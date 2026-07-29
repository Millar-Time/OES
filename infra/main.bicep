// OES demo infrastructure — RG-scoped, Azure Commercial, East US 2.
// Security baseline (non-negotiable): every service authenticates via the App
// Service system-assigned managed identity + RBAC. Local/shared-key auth is
// DISABLED on every resource that supports it. No keys, secrets, or connection
// strings are emitted or stored.
//
// Deploy:
//   az deployment group create -g OES -f infra/main.bicep -p @infra/main.parameters.json

targetScope = 'resourceGroup'

@description('Deployment location. Locked to East US 2 for the demo.')
param location string = 'eastus2'

@description('Short project prefix used in resource names.')
param prefix string = 'oes-demo'

@description('Azure OpenAI model + deployment name to provision.')
param openAiModel string = 'gpt-4o'
param openAiModelVersion string = '2024-08-06'

@description('Resource tags.')
param tags object = {
  project: 'OES'
  env: 'demo'
}

var suffix = uniqueString(resourceGroup().id)
var names = {
  logAnalytics: 'log-${prefix}-${suffix}'
  appInsights: 'appi-${prefix}-${suffix}'
  plan: 'plan-${prefix}-${suffix}'
  app: 'app-${prefix}-${suffix}'
  openai: 'aoai-${prefix}-${suffix}'
  cosmos: 'cosmos-${prefix}-${suffix}'
  maps: 'maps-${prefix}-${suffix}'
}

// Built-in role definition IDs (least privilege, data-plane)
var roles = {
  openAiUser: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd') // Cognitive Services OpenAI User
  mapsDataReader: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '423170ca-a8f6-4b0f-8487-9e4eb8f49bfa') // Azure Maps Data Reader
  metricsPublisher: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '3913510d-42f4-4e42-8a64-420c390055eb') // Monitoring Metrics Publisher
}

// ---------- Observability ----------
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: names.logAnalytics
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: names.appInsights
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    DisableLocalAuth: true
  }
}

// ---------- Compute (App Service, system-assigned MI) ----------
resource plan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: names.plan
  location: location
  tags: tags
  sku: { name: 'B1', tier: 'Basic' }
  kind: 'linux'
  properties: { reserved: true }
}

resource app 'Microsoft.Web/sites@2024-04-01' = {
  name: names.app
  location: location
  tags: tags
  kind: 'app,linux'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'PYTHON|3.11'
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      appSettings: [
        // Endpoints only — NO keys. Auth is via managed identity.
        { name: 'OES_ENVIRONMENT', value: 'azure' }
        { name: 'OES_AZURE_OPENAI_ENDPOINT', value: openai.properties.endpoint }
        { name: 'OES_AZURE_OPENAI_DEPLOYMENT', value: openAiModel }
        { name: 'OES_COSMOS_ENDPOINT', value: cosmos.properties.documentEndpoint }
        { name: 'OES_COSMOS_DATABASE', value: 'oes' }
        { name: 'OES_AZURE_MAPS_CLIENT_ID', value: maps.properties.uniqueId }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
      ]
    }
  }
}

// ---------- Azure OpenAI (Entra auth only) ----------
resource openai 'Microsoft.CognitiveServices/accounts@2024-10-01' = {
  name: names.openai
  location: location
  tags: tags
  kind: 'OpenAI'
  sku: { name: 'S0' }
  properties: {
    customSubDomainName: names.openai
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: true // key auth OFF — MI + RBAC only
  }
}

resource openAiDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-10-01' = {
  parent: openai
  name: openAiModel
  sku: { name: 'Standard', capacity: 20 }
  properties: {
    model: { format: 'OpenAI', name: openAiModel, version: openAiModelVersion }
  }
}

// ---------- Cosmos DB (serverless, key auth disabled) ----------
resource cosmos 'Microsoft.DocumentDB/databaseAccounts@2024-11-15' = {
  name: names.cosmos
  location: location
  tags: tags
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    disableLocalAuth: true // key auth OFF — Entra data-plane RBAC only
    enableAutomaticFailover: false
    capabilities: [ { name: 'EnableServerless' } ]
    consistencyPolicy: { defaultConsistencyLevel: 'Session' }
    locations: [ { locationName: location, failoverPriority: 0 } ]
  }
}

resource cosmosDb 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-11-15' = {
  parent: cosmos
  name: 'oes'
  properties: { resource: { id: 'oes' } }
}

// Cosmos data-plane RBAC uses its own role system (not Azure RBAC).
// Built-in "Cosmos DB Built-in Data Contributor" = ...002
resource cosmosDataContributor 'Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2024-11-15' = {
  parent: cosmos
  name: guid(cosmos.id, app.id, 'data-contributor')
  properties: {
    roleDefinitionId: '${cosmos.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002'
    principalId: app.identity.principalId
    scope: cosmos.id
  }
}

// ---------- Azure Maps (Entra tokens only) ----------
resource maps 'Microsoft.Maps/accounts@2023-06-01' = {
  name: names.maps
  location: 'global'
  tags: tags
  sku: { name: 'G2' }
  kind: 'Gen2'
  properties: {
    disableLocalAuth: true // shared-key auth OFF — Entra tokens only
  }
}

// ---------- Role assignments (App Service MI, least privilege) ----------
resource raOpenAi 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(openai.id, app.id, roles.openAiUser)
  scope: openai
  properties: {
    roleDefinitionId: roles.openAiUser
    principalId: app.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource raMaps 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(maps.id, app.id, roles.mapsDataReader)
  scope: maps
  properties: {
    roleDefinitionId: roles.mapsDataReader
    principalId: app.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource raMetrics 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(appInsights.id, app.id, roles.metricsPublisher)
  scope: appInsights
  properties: {
    roleDefinitionId: roles.metricsPublisher
    principalId: app.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ---------- Outputs (endpoints only — no secrets) ----------
output appName string = app.name
output appHostName string = app.properties.defaultHostName
output openAiEndpoint string = openai.properties.endpoint
output cosmosEndpoint string = cosmos.properties.documentEndpoint
output mapsClientId string = maps.properties.uniqueId

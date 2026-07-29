// OES demo infrastructure — RG-scoped Bicep skeleton (F1).
// Full resource definitions land in F3. Security baseline is non-negotiable:
// every service uses managed identity + RBAC. No keys, secrets, or connection strings.
//
// Deploy (F3):
//   az deployment group create -g OES -f infra/main.bicep -p @infra/main.parameters.json

targetScope = 'resourceGroup'

@description('Deployment location. Locked to East US 2 for the demo.')
param location string = 'eastus2'

@description('Short project prefix used in resource names.')
param prefix string = 'oes-demo'

// TODO(F3): App Service (system-assigned MI), Azure OpenAI, Cosmos DB (serverless),
// Azure Maps, Log Analytics + App Insights, and least-privilege role assignments
// (Cognitive Services OpenAI User, Cosmos DB Data Contributor, Azure Maps Data Reader)
// scoped to this resource group. No local auth / shared keys on any resource.

output note string = 'Scaffold only — resources defined in F3. prefix=${prefix} location=${location}'

"""Configuration — endpoints only, resolved from environment.

NO secrets, keys, or connection strings. All Azure access uses
DefaultAzureCredential (managed identity in Azure, developer identity locally).
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="OES_", env_file=".env")

    # Azure OpenAI (Entra/MI auth — no api key)
    azure_openai_endpoint: str = ""
    azure_openai_deployment: str = "gpt-4o"
    azure_openai_api_version: str = "2024-10-21"

    # Cosmos DB (Entra/MI auth — no key/connection string)
    cosmos_endpoint: str = ""
    cosmos_database: str = "oes"

    # Azure Maps (token minted for the app's managed identity)
    azure_maps_client_id: str = ""

    # CORS — comma-separated allowed origins. Kept as a plain string so it
    # parses cleanly from any shell / App Service setting (no JSON quoting).
    cors_origins_raw: str = "http://localhost:5173"

    environment: str = "local"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins_raw.split(",") if o.strip()]


settings = Settings()

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

    # CORS — the Vite dev server origin(s) allowed to call this API locally.
    cors_origins: list[str] = ["http://localhost:5173"]

    environment: str = "local"


settings = Settings()

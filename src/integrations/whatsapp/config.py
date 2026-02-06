import os
from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache

class Settings(BaseSettings):
    """
    Configurações da aplicação.
    """
    # Servidor
    PORT: int = 8000
    LOG_LEVEL: str = "INFO"

    # --- Vertex AI Agent Builder (Modo Enterprise) ---
    VERTEX_PROJECT_ID: Optional[str] = None
    VERTEX_LOCATION: str = "global"
    VERTEX_AGENT_ID: Optional[str] = None
    VERTEX_DATA_STORE_ID: Optional[str] = None

    # --- Gemini Direct API (Modo Rápido / API Key) ---
    # Se GOOGLE_API_KEY estiver presente, o serviço tentará usar este modo primeiro ou como fallback.
    GOOGLE_API_KEY: Optional[str] = None
    GEMINI_MODEL_NAME: str = "gemini-2.5-flash-lite"

    # --- Segurança Webhook ---
    WEBHOOK_VERIFICATION_TOKEN: str

    # --- Evolution API (Envio) ---
    EVOLUTION_API_URL: str
    EVOLUTION_API_TOKEN: str
    EVOLUTION_INSTANCE_NAME: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

@lru_cache
def get_settings() -> Settings:
    return Settings()

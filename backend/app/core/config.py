from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'NeuroFocus API'
    app_env: str = 'development'
    app_host: str = '0.0.0.0'
    app_port: int = 8000
    cors_origins: str = 'http://localhost:5173'

    model_dir: str = 'backend/models'
    scaler_filename: str = 'scaler.joblib'
    model_filename: str = 'model.joblib'

    @property
    def model_dir_path(self) -> Path:
        return Path(self.model_dir)

    @property
    def scaler_path(self) -> Path:
        return self.model_dir_path / self.scaler_filename

    @property
    def model_path(self) -> Path:
        return self.model_dir_path / self.model_filename


@lru_cache
def get_settings() -> Settings:
    return Settings()

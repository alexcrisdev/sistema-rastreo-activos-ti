from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str
    app_version: str
    debug: bool
    database_url: str
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    register_code: str
    admin_user: str
    admin_password: str
    admin_nombres: str
    admin_apellidos: str
    admin_correo: str
    admin_telefono: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    
settings = Settings()
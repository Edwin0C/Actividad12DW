"""
configuracion.py - Configuración de la aplicación Lümenik
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configuración base"""
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'lumenik-secret-key-development')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', False)
    
    # MongoDB
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/lumenik_db')
    MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'lumenik_db')
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'lumenik-jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Servidor
    SERVIDOR_HOST = os.getenv('SERVIDOR_HOST', 'localhost')
    SERVIDOR_PUERTO = int(os.getenv('SERVIDOR_PUERTO', 5000))
    
    # CORS
    CORS_ORIGINS = ['http://localhost:5000', 'http://127.0.0.1:5000']

class DevelopmentConfig(Config):
    """Configuración de desarrollo"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Configuración de producción"""
    DEBUG = False
    TESTING = False

class TestingConfig(Config):
    """Configuración de testing"""
    TESTING = True
    MONGO_URI = 'mongodb://localhost:27017/lumenik_test'

# Seleccionar configuración según entorno
config_actual = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig
}

def obtener_config():
    """Obtiene la configuración según el ambiente"""
    ambiente = os.getenv('FLASK_ENV', 'development')
    return config_actual.get(ambiente, DevelopmentConfig)

"""
app.py - Aplicación Principal Flask de Lümenik
"""
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Importar configuración
from configuracion import obtener_config

# Importar repositorios
from modelos.usuario import RepositorioUsuario
from modelos.juego import RepositorioJuego
from modelos.cliente import RepositorioCliente
from modelos.registro_trabajo import RepositorioRegistroTrabajo

# Importar rutas
from rutas.autenticacion_rutas import crear_rutas_autenticacion
from rutas.usuario_rutas import crear_rutas_usuarios
from rutas.juego_rutas import crear_rutas_juegos
from rutas.trabajo_rutas import crear_rutas_trabajos

load_dotenv()

def crear_app():
    """Factory para crear la aplicación Flask"""
    
    # Obtener configuración según entorno
    config = obtener_config()
    
    # Crear instancia de Flask
    app = Flask(__name__)
    app.config.from_object(config)
    
    # Configurar CORS
    CORS(app, resources={r"/api/*": {"origins": config.CORS_ORIGINS}})
    
    # Configurar JWT
    jwt = JWTManager(app)
    
    # Conectar a MongoDB
    cliente_mongo = MongoClient(config.MONGO_URI)
    db = cliente_mongo[config.MONGO_DB_NAME]
    
    # Crear repositorios
    repo_usuario = RepositorioUsuario(db)
    repo_juego = RepositorioJuego(db)
    repo_cliente = RepositorioCliente(db)
    repo_trabajo = RepositorioRegistroTrabajo(db)
    
    # Registrar blueprints de rutas
    app.register_blueprint(crear_rutas_autenticacion(repo_usuario))
    app.register_blueprint(crear_rutas_usuarios(repo_usuario))
    app.register_blueprint(crear_rutas_juegos(repo_juego))
    app.register_blueprint(crear_rutas_trabajos(repo_trabajo, repo_cliente))
    
    # Servir archivos estáticos del frontend
    @app.route('/')
    def index():
        """Página principal"""
        return send_from_directory('../frontend', 'index.html')
    
    @app.route('/<path:ruta>')
    def servir_estaticos(ruta):
        """Servir archivos estáticos"""
        return send_from_directory('../frontend', ruta)
    
    # Endpoints de salud
    @app.route('/api/health', methods=['GET'])
    def salud():
        """Endpoint para verificar que la API está activa"""
        return jsonify({'estado': 'ok', 'mensaje': 'Lümenik API está en línea'}), 200
    
    # Manejador de errores 404
    @app.errorhandler(404)
    def no_encontrado(error):
        return jsonify({'error': 'Recurso no encontrado'}), 404
    
    # Manejador de errores 500
    @app.errorhandler(500)
    def error_interno(error):
        return jsonify({'error': 'Error interno del servidor'}), 500
    
    # Manejador de errores JWT
    @jwt.invalid_token_loader
    def token_invalido(error):
        return jsonify({'error': 'Token inválido'}), 401
    
    @jwt.expired_token_loader
    def token_expirado(jwt_header, jwt_payload):
        return jsonify({'error': 'Token expirado'}), 401
    
    @jwt.unauthorized_loader
    def sin_autorizacion(error):
        return jsonify({'error': 'Autenticación requerida'}), 401
    
    return app, db

def main():
    """Función principal para ejecutar la aplicación"""
    app, db = crear_app()
    config = obtener_config()
    
    print("=" * 60)
    print("    ♪ LÜMENIK - Sistema de Gestión de Juegos ♪")
    print("=" * 60)
    print(f"Ambiente: {os.getenv('FLASK_ENV', 'development')}")
    print(f"Base de datos: {config.MONGO_DB_NAME}")
    print(f"Servidor: http://{config.SERVIDOR_HOST}:{config.SERVIDOR_PUERTO}")
    print("=" * 60)
    
    app.run(
        host=config.SERVIDOR_HOST,
        port=config.SERVIDOR_PUERTO,
        debug=config.DEBUG
    )

if __name__ == '__main__':
    main()

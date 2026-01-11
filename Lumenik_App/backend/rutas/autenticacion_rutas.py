"""
autenticacion_rutas.py - Rutas de Autenticación
"""
from flask import Blueprint, request, jsonify
from controladores.autenticacion_controlador import (
    AutenticacionControlador, 
    token_requerido,
    verificar_token_jwt
)

def crear_rutas_autenticacion(repo_usuario):
    """Crea el blueprint de rutas de autenticación"""
    
    rutas_auth = Blueprint('autenticacion', __name__, url_prefix='/api/auth')
    controlador = AutenticacionControlador(repo_usuario)
    
    @rutas_auth.route('/login', methods=['POST'])
    def login():
        """
        Endpoint para login de usuario
        POST /api/auth/login
        
        Body:
        {
            "nombre_usuario": "string",
            "contraseña": "string"
        }
        """
        datos = request.get_json()
        
        if not datos:
            return jsonify({'error': 'No data provided'}), 400
        
        resultado, codigo = controlador.login(datos)
        return jsonify(resultado), codigo
    
    @rutas_auth.route('/registrar', methods=['POST'])
    @token_requerido
    def registrar():
        """
        Endpoint para crear un nuevo usuario (solo admin)
        POST /api/auth/registrar
        
        Headers:
            Authorization: Bearer <token>
        
        Body:
        {
            "nombre_usuario": "string",
            "email": "string",
            "contraseña": "string",
            "rol": "cliente|empleado|administrador",
            "nombre_completo": "string",
            "telefono": "string"
        }
        """
        # Verificar que es admin
        if request.usuario_actual.get('rol') != 'administrador':
            return jsonify({'error': 'Acceso denegado'}), 403
        
        datos = request.get_json()
        
        if not datos:
            return jsonify({'error': 'No data provided'}), 400
        
        resultado, codigo = controlador.registrar(datos)
        return jsonify(resultado), codigo
    
    @rutas_auth.route('/cambiar-contraseña', methods=['POST'])
    @token_requerido
    def cambiar_contraseña():
        """
        Endpoint para cambiar contraseña
        POST /api/auth/cambiar-contraseña
        
        Headers:
            Authorization: Bearer <token>
        
        Body:
        {
            "contraseña_actual": "string",
            "contraseña_nueva": "string"
        }
        """
        datos = request.get_json()
        usuario_id = request.usuario_actual.get('usuario_id')
        
        if not datos:
            return jsonify({'error': 'No data provided'}), 400
        
        resultado, codigo = controlador.cambiar_contraseña(usuario_id, datos)
        return jsonify(resultado), codigo
    
    @rutas_auth.route('/refrescar-token', methods=['POST'])
    @token_requerido
    def refrescar_token():
        """
        Endpoint para refrescar token JWT
        POST /api/auth/refrescar-token
        
        Headers:
            Authorization: Bearer <token>
        """
        token = request.headers.get('Authorization', '').split(" ")[-1]
        resultado, codigo = controlador.refrescar_token(token)
        return jsonify(resultado), codigo
    
    @rutas_auth.route('/validar-token', methods=['POST'])
    def validar_token():
        """
        Endpoint para validar un token
        POST /api/auth/validar-token
        
        Body:
        {
            "token": "string"
        }
        """
        datos = request.get_json()
        token = datos.get('token') if datos else None
        
        if not token:
            return jsonify({'valido': False, 'error': 'Token requerido'}), 400
        
        payload = verificar_token_jwt(token)
        
        if 'error' in payload:
            return jsonify({'valido': False, 'error': payload['error']}), 401
        
        return jsonify({
            'valido': True,
            'usuario_id': payload.get('usuario_id'),
            'nombre_usuario': payload.get('nombre_usuario'),
            'rol': payload.get('rol')
        }), 200
    
    return rutas_auth

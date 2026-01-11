"""
autenticacion_controlador.py - Controlador de Autenticación
"""
import bcrypt
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
from modelos.usuario import RepositorioUsuario, Usuario

def hash_contraseña(contraseña):
    """Genera un hash de la contraseña"""
    return bcrypt.hashpw(contraseña.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verificar_contraseña(contraseña, hash_contraseña):
    """Verifica si una contraseña coincide con su hash"""
    return bcrypt.checkpw(contraseña.encode('utf-8'), hash_contraseña.encode('utf-8'))

def generar_token_jwt(usuario_id, nombre_usuario, rol):
    """Genera un token JWT para el usuario"""
    payload = {
        'usuario_id': str(usuario_id),
        'nombre_usuario': nombre_usuario,
        'rol': rol,
        'exp': datetime.utcnow() + timedelta(hours=24),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
    return token

def verificar_token_jwt(token):
    """Verifica y decodifica un token JWT"""
    try:
        payload = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return {'error': 'Token expirado'}
    except jwt.InvalidTokenError:
        return {'error': 'Token inválido'}

def token_requerido(f):
    """Decorador para proteger rutas que requieren autenticación"""
    @wraps(f)
    def decorado(*args, **kwargs):
        token = None
        
        # Buscar token en headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            print(f"[DEBUG] Authorization header: {auth_header}")
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                print("[ERROR] Token format inválido")
                return jsonify({'mensaje': 'Token inválido'}), 401
        
        if not token:
            print("[ERROR] No token found")
            return jsonify({'mensaje': 'Token requerido'}), 401
        
        payload = verificar_token_jwt(token)
        print(f"[DEBUG] Token payload: {payload}")
        
        if 'error' in payload:
            print(f"[ERROR] Token error: {payload['error']}")
            return jsonify({'mensaje': payload['error']}), 401
        
        # Guardar payload en request para uso posterior
        request.usuario_actual = payload
        return f(*args, **kwargs)
    
    return decorado

def rol_requerido(*roles_permitidos):
    """Decorador para verificar que el usuario tiene el rol correcto"""
    def decorador(f):
        @wraps(f)
        @token_requerido
        def decorado(*args, **kwargs):
            rol_usuario = request.usuario_actual.get('rol')
            print(f"[DEBUG] Verificando rol. Usuario: {rol_usuario}, Requerido: {roles_permitidos}")
            
            if rol_usuario not in roles_permitidos:
                print(f"[ERROR] Acceso denegado. Rol '{rol_usuario}' no está en {roles_permitidos}")
                return jsonify({'mensaje': 'Acceso denegado - rol insuficiente'}), 403
            
            print(f"[DEBUG] Acceso permitido para rol {rol_usuario}")
            return f(*args, **kwargs)
        return decorado
    return decorador

class AutenticacionControlador:
    """Controlador para manejar la autenticación"""
    
    def __init__(self, repo_usuario):
        """
        Inicializa el controlador
        
        Args:
            repo_usuario: Repositorio de usuarios
        """
        self.repo_usuario = repo_usuario
    
    def login(self, datos):
        """
        Autentica a un usuario
        
        Args:
            datos (dict): {nombre_usuario, contraseña}
        
        Returns:
            dict: {token, usuario_id, rol, nombre_usuario} o error
        """
        nombre_usuario = datos.get('nombre_usuario')
        contraseña = datos.get('contraseña')
        
        if not nombre_usuario or not contraseña:
            return {'error': 'Usuario y contraseña requeridos'}, 400
        
        # Buscar usuario
        usuario = self.repo_usuario.obtener_por_nombre(nombre_usuario)
        
        if not usuario:
            return {'error': 'Usuario o contraseña incorrectos'}, 401
        
        if usuario.get('estado') == 'inactivo':
            return {'error': 'Usuario inactivo'}, 401
        
        # Verificar contraseña
        if not verificar_contraseña(contraseña, usuario.get('contraseña_hash')):
            return {'error': 'Usuario o contraseña incorrectos'}, 401
        
        # Generar token
        token = generar_token_jwt(
            usuario['_id'],
            usuario['nombre_usuario'],
            usuario['rol']
        )
        
        return {
            'token': token,
            'usuario_id': str(usuario['_id']),
            'rol': usuario['rol'],
            'nombre_usuario': usuario['nombre_usuario'],
            'nombre_completo': usuario['nombre_completo']
        }, 200
    
    def registrar(self, datos):
        """
        Crea un nuevo usuario (solo admin)
        
        Args:
            datos (dict): Datos del nuevo usuario
        
        Returns:
            dict: {usuario_id} o error
        """
        nombre_usuario = datos.get('nombre_usuario')
        email = datos.get('email')
        contraseña = datos.get('contraseña')
        rol = datos.get('rol', 'cliente')
        nombre_completo = datos.get('nombre_completo', '')
        telefono = datos.get('telefono', '')
        
        # Validaciones
        if not nombre_usuario or not contraseña or not email:
            return {'error': 'Campos requeridos: nombre_usuario, contraseña, email'}, 400
        
        if len(contraseña) < 8:
            return {'error': 'La contraseña debe tener al menos 8 caracteres'}, 400
        
        if self.repo_usuario.existe_nombre_usuario(nombre_usuario):
            return {'error': 'El nombre de usuario ya existe'}, 409
        
        # Crear usuario
        hash_pwd = hash_contraseña(contraseña)
        usuario = Usuario(
            nombre_usuario=nombre_usuario,
            contraseña_hash=hash_pwd,
            email=email,
            rol=rol,
            nombre_completo=nombre_completo,
            telefono=telefono
        )
        
        usuario_id = self.repo_usuario.crear(usuario)
        
        return {
            'mensaje': 'Usuario creado exitosamente',
            'usuario_id': usuario_id
        }, 201
    
    def cambiar_contraseña(self, usuario_id, datos):
        """
        Cambia la contraseña de un usuario
        
        Args:
            usuario_id (str): ID del usuario
            datos (dict): {contraseña_actual, contraseña_nueva}
        
        Returns:
            dict: mensaje de éxito o error
        """
        contraseña_actual = datos.get('contraseña_actual')
        contraseña_nueva = datos.get('contraseña_nueva')
        
        if not contraseña_actual or not contraseña_nueva:
            return {'error': 'Ambas contraseñas requeridas'}, 400
        
        if len(contraseña_nueva) < 8:
            return {'error': 'La contraseña debe tener al menos 8 caracteres'}, 400
        
        usuario = self.repo_usuario.obtener_por_id(usuario_id)
        if not usuario:
            return {'error': 'Usuario no encontrado'}, 404
        
        # Verificar contraseña actual
        if not verificar_contraseña(contraseña_actual, usuario.get('contraseña_hash')):
            return {'error': 'Contraseña actual incorrecta'}, 401
        
        # Actualizar contraseña
        hash_nueva = hash_contraseña(contraseña_nueva)
        self.repo_usuario.actualizar(usuario_id, {'contraseña_hash': hash_nueva})
        
        return {'mensaje': 'Contraseña cambiad exitosamente'}, 200
    
    def refrescar_token(self, token_actual):
        """
        Genera un nuevo token basado en uno válido
        
        Args:
            token_actual (str): Token JWT actual
        
        Returns:
            dict: {token} o error
        """
        payload = verificar_token_jwt(token_actual)
        
        if 'error' in payload:
            return {'error': payload['error']}, 401
        
        nuevo_token = generar_token_jwt(
            payload['usuario_id'],
            payload['nombre_usuario'],
            payload['rol']
        )
        
        return {'token': nuevo_token}, 200

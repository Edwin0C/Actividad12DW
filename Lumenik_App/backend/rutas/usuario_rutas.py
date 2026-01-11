"""
usuario_rutas.py - Rutas de Gestión de Usuarios
"""
from flask import Blueprint, request, jsonify
from controladores.autenticacion_controlador import token_requerido, rol_requerido
from controladores.usuario_controlador import UsuarioControlador

def crear_rutas_usuarios(repo_usuario):
    """Crea el blueprint de rutas de usuarios"""
    
    rutas_usuarios = Blueprint('usuarios', __name__, url_prefix='/api/usuarios')
    controlador = UsuarioControlador(repo_usuario)
    
    @rutas_usuarios.route('', methods=['POST'])
    @rol_requerido('administrador')
    def crear_usuario():
        """
        Crea un nuevo usuario
        POST /api/usuarios
        
        Headers:
            Authorization: Bearer <token>
        
        Body:
        {
            "nombre_usuario": "string (requerido)",
            "email": "string (requerido)",
            "contraseña": "string (requerido)",
            "nombre_completo": "string (requerido)",
            "telefono": "string (opcional)",
            "rol": "cliente|empleado|administrador (requerido)"
        }
        """
        try:
            datos = request.get_json()
            
            if not datos:
                return jsonify({'error': 'No data provided'}), 400
            
            print(f"[DEBUG] Datos recibidos para crear usuario: {datos}")
            
            resultado, codigo = controlador.crear_usuario(datos)
            
            print(f"[DEBUG] Resultado de crear usuario: {resultado}, Código: {codigo}")
            
            return jsonify(resultado), codigo
        except Exception as e:
            print(f"[ERROR] Error al crear usuario: {str(e)}")
            return jsonify({'error': f'Error al crear usuario: {str(e)}'}), 500
    
    @rutas_usuarios.route('', methods=['GET'])
    @rol_requerido('administrador')
    def obtener_todos():
        """
        Obtiene todos los usuarios
        GET /api/usuarios
        
        Headers:
            Authorization: Bearer <token>
        """
        resultado, codigo = controlador.obtener_todos()
        return jsonify(resultado), codigo
    
    @rutas_usuarios.route('/<usuario_id>', methods=['GET'])
    @token_requerido
    def obtener_usuario(usuario_id):
        """
        Obtiene un usuario específico
        GET /api/usuarios/<usuario_id>
        
        Headers:
            Authorization: Bearer <token>
        """
        resultado, codigo = controlador.obtener_por_id(usuario_id)
        return jsonify(resultado), codigo
    
    @rutas_usuarios.route('/rol/<rol>', methods=['GET'])
    @rol_requerido('administrador')
    def obtener_por_rol(rol):
        """
        Obtiene usuarios por rol
        GET /api/usuarios/rol/<rol>
        
        Headers:
            Authorization: Bearer <token>
        """
        resultado, codigo = controlador.obtener_por_rol(rol)
        return jsonify(resultado), codigo
    
    @rutas_usuarios.route('/<usuario_id>', methods=['PUT'])
    @rol_requerido('administrador')
    def actualizar_usuario(usuario_id):
        """
        Actualiza un usuario
        PUT /api/usuarios/<usuario_id>
        
        Headers:
            Authorization: Bearer <token>
        
        Body:
        {
            "email": "string",
            "nombre_completo": "string",
            "telefono": "string",
            "rol": "cliente|empleado|administrador"
        }
        """
        datos = request.get_json()
        
        if not datos:
            return jsonify({'error': 'No data provided'}), 400
        
        resultado, codigo = controlador.actualizar(usuario_id, datos)
        return jsonify(resultado), codigo
    
    @rutas_usuarios.route('/<usuario_id>/cambiar-estado', methods=['POST'])
    @rol_requerido('administrador')
    def cambiar_estado(usuario_id):
        """
        Cambia el estado de un usuario
        POST /api/usuarios/<usuario_id>/cambiar-estado
        
        Headers:
            Authorization: Bearer <token>
        
        Body:
        {
            "estado": "activo|inactivo"
        }
        """
        datos = request.get_json()
        
        if not datos or 'estado' not in datos:
            return jsonify({'error': 'Estado requerido'}), 400
        
        resultado, codigo = controlador.cambiar_estado(usuario_id, datos['estado'])
        return jsonify(resultado), codigo
    
    @rutas_usuarios.route('/estadisticas', methods=['GET'])
    @rol_requerido('administrador')
    def obtener_estadisticas():
        """
        Obtiene estadísticas de usuarios
        GET /api/usuarios/estadisticas
        
        Headers:
            Authorization: Bearer <token>
        """
        resultado, codigo = controlador.obtener_estadisticas()
        return jsonify(resultado), codigo
    
    @rutas_usuarios.route('/<usuario_id>', methods=['DELETE'])
    @rol_requerido('administrador')
    def eliminar_usuario(usuario_id):
        """
        Elimina un usuario y todos sus datos asociados
        DELETE /api/usuarios/<usuario_id>
        
        Headers:
            Authorization: Bearer <token>
        """
        resultado, codigo = controlador.eliminar(usuario_id)
        return jsonify(resultado), codigo
    
    return rutas_usuarios

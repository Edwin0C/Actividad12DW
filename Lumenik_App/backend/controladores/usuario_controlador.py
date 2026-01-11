"""
usuario_controlador.py - Controlador de Usuarios
"""
from bson.objectid import ObjectId
from modelos.usuario import Usuario
from controladores.autenticacion_controlador import hash_contraseña

class UsuarioControlador:
    """Controlador para gestión de usuarios"""
    
    def __init__(self, repo_usuario):
        """Inicializa el controlador"""
        self.repo_usuario = repo_usuario
    
    def obtener_todos(self):
        """Obtiene todos los usuarios (excluyendo administradores)"""
        usuarios = self.repo_usuario.obtener_todos()
        
        # Convertir a formato de respuesta sin mostrar hashes
        # Filtrar para excluir administradores
        usuarios_respuesta = []
        for usuario in usuarios:
            # No mostrar administradores en la lista de gestión
            if usuario['rol'] == 'administrador':
                continue
                
            usuarios_respuesta.append({
                'id': str(usuario['_id']),
                'nombre_usuario': usuario['nombre_usuario'],
                'email': usuario['email'],
                'rol': usuario['rol'],
                'nombre_completo': usuario['nombre_completo'],
                'telefono': usuario['telefono'],
                'estado': usuario['estado'],
                'fecha_creacion': usuario['fecha_creacion'].isoformat()
            })
        
        return {'usuarios': usuarios_respuesta}, 200
    
    def obtener_por_id(self, usuario_id):
        """Obtiene un usuario por ID"""
        usuario = self.repo_usuario.obtener_por_id(usuario_id)
        
        if not usuario:
            return {'error': 'Usuario no encontrado'}, 404
        
        return {
            'id': str(usuario['_id']),
            'nombre_usuario': usuario['nombre_usuario'],
            'email': usuario['email'],
            'rol': usuario['rol'],
            'nombre_completo': usuario['nombre_completo'],
            'telefono': usuario['telefono'],
            'estado': usuario['estado'],
            'fecha_creacion': usuario['fecha_creacion'].isoformat()
        }, 200
    
    def obtener_por_rol(self, rol):
        """Obtiene usuarios por rol"""
        usuarios = self.repo_usuario.obtener_por_rol(rol)
        
        usuarios_respuesta = []
        for usuario in usuarios:
            usuarios_respuesta.append({
                'id': str(usuario['_id']),
                'nombre_usuario': usuario['nombre_usuario'],
                'email': usuario['email'],
                'nombre_completo': usuario['nombre_completo'],
                'telefono': usuario['telefono']
            })
        
        return {'usuarios': usuarios_respuesta}, 200
    
    def actualizar(self, usuario_id, datos):
        """Actualiza información de un usuario"""
        usuario_actual = self.repo_usuario.obtener_por_id(usuario_id)
        
        if not usuario_actual:
            return {'error': 'Usuario no encontrado'}, 404
        
        # Campos que pueden actualizarse
        campos_permitidos = ['email', 'nombre_completo', 'telefono', 'rol']
        datos_actualizacion = {}
        
        for campo in campos_permitidos:
            if campo in datos:
                datos_actualizacion[campo] = datos[campo]
        
        if not datos_actualizacion:
            return {'error': 'No hay campos para actualizar'}, 400
        
        # Validar rol si se intenta cambiar
        if 'rol' in datos_actualizacion:
            roles_validos = ['administrador', 'empleado', 'cliente']
            if datos_actualizacion['rol'] not in roles_validos:
                return {'error': f'Rol inválido. Debe ser: {", ".join(roles_validos)}'}, 400
        
        self.repo_usuario.actualizar(usuario_id, datos_actualizacion)
        
        return {'mensaje': 'Usuario actualizado exitosamente'}, 200
    
    def cambiar_estado(self, usuario_id, nuevo_estado):
        """Cambia el estado de un usuario (activo/inactivo)"""
        usuario = self.repo_usuario.obtener_por_id(usuario_id)
        
        if not usuario:
            return {'error': 'Usuario no encontrado'}, 404
        
        estados_validos = ['activo', 'inactivo']
        if nuevo_estado not in estados_validos:
            return {'error': f'Estado inválido. Debe ser: {", ".join(estados_validos)}'}, 400
        
        self.repo_usuario.actualizar(usuario_id, {'estado': nuevo_estado})
        
        return {'mensaje': f'Estado del usuario cambiado a {nuevo_estado}'}, 200
    
    def crear_usuario(self, datos):
        """Crea un nuevo usuario"""
        # Validar campos requeridos
        campos_requeridos = ['nombre_usuario', 'email', 'contraseña', 'nombre_completo', 'rol']
        campos_faltantes = []
        
        for campo in campos_requeridos:
            valor = datos.get(campo, '').strip() if isinstance(datos.get(campo), str) else datos.get(campo)
            if not valor:
                campos_faltantes.append(campo)
        
        if campos_faltantes:
            return {'error': f'Campos requeridos: {", ".join(campos_faltantes)}'}, 400
        
        # Validar rol
        roles_validos = ['administrador', 'empleado', 'cliente']
        if datos['rol'] not in roles_validos:
            return {'error': f'Rol inválido. Debe ser: {", ".join(roles_validos)}'}, 400
        
        # Verificar si el usuario ya existe
        usuario_existente = self.repo_usuario.obtener_por_nombre(datos['nombre_usuario'])
        if usuario_existente:
            return {'error': 'El nombre de usuario ya existe'}, 409
        
        # Verificar si el email ya existe
        email_existente = self.repo_usuario.coleccion.find_one({'email': datos['email']})
        if email_existente:
            return {'error': 'El email ya está registrado'}, 409
        
        # Crear el usuario
        nuevo_usuario = Usuario(
            nombre_usuario=datos['nombre_usuario'].strip(),
            email=datos['email'].strip(),
            contraseña_hash=hash_contraseña(datos['contraseña']),
            nombre_completo=datos['nombre_completo'].strip(),
            telefono=datos.get('telefono', '').strip(),
            rol=datos['rol'],
            estado='activo'
        )
        
        usuario_id = self.repo_usuario.crear(nuevo_usuario)
        
        return {
            'mensaje': 'Usuario creado exitosamente',
            'usuario_id': usuario_id,
            'nombre_usuario': datos['nombre_usuario']
        }, 201
    
    def obtener_estadisticas(self):
        """Obtiene estadísticas de usuarios"""
        todos_usuarios = self.repo_usuario.obtener_todos()
        
        admin_count = sum(1 for u in todos_usuarios if u['rol'] == 'administrador')
        empleado_count = sum(1 for u in todos_usuarios if u['rol'] == 'empleado')
        cliente_count = sum(1 for u in todos_usuarios if u['rol'] == 'cliente')
        activos_count = sum(1 for u in todos_usuarios if u['estado'] == 'activo')
        
        # Total de usuarios SIN contar al administrador
        usuarios_sin_admin = len(todos_usuarios) - admin_count
        
        return {
            'total_usuarios': usuarios_sin_admin,
            'administradores': admin_count,
            'empleados': empleado_count,
            'clientes': cliente_count,
            'usuarios_activos': activos_count
        }, 200
    
    def eliminar(self, usuario_id):
        """Elimina un usuario y todos sus datos asociados"""
        from bson.objectid import ObjectId
        from modelos.registro_trabajo import RepositorioRegistroTrabajo
        from modelos.cliente import RepositorioCliente
        
        try:
            usuario_obj_id = ObjectId(usuario_id)
        except:
            return {'error': 'ID de usuario inválido'}, 400
        
        # Verificar si el usuario existe
        usuario = self.repo_usuario.obtener_por_id(usuario_id)
        if not usuario:
            return {'error': 'Usuario no encontrado'}, 404
        
        # Obtener la base de datos desde el repositorio
        db = self.repo_usuario.db
        
        # Eliminar registros de trabajo del usuario
        try:
            repo_trabajo = RepositorioRegistroTrabajo(db)
            repo_trabajo.coleccion.delete_many({'usuario_id': usuario_obj_id})
        except Exception as e:
            print(f"[DEBUG] Error eliminando trabajos: {e}")
        
        # Eliminar cliente asociado si existe
        try:
            repo_cliente = RepositorioCliente(db)
            repo_cliente.coleccion.delete_many({'usuario_id': usuario_obj_id})
        except Exception as e:
            print(f"[DEBUG] Error eliminando cliente: {e}")
        
        # Eliminar usuario
        usuario_eliminado = self.repo_usuario.coleccion.delete_one({'_id': usuario_obj_id})
        
        if usuario_eliminado.deleted_count > 0:
            return {
                'mensaje': 'Usuario eliminado correctamente',
                'usuario_eliminado': usuario['nombre_usuario']
            }, 200
        else:
            return {'error': 'No se pudo eliminar el usuario'}, 400


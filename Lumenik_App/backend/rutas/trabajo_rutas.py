"""
trabajo_rutas.py - Rutas de Gestión de Trabajos
"""
from flask import Blueprint, request, jsonify
from controladores.autenticacion_controlador import token_requerido, rol_requerido
from controladores.trabajo_controlador import TrabajoControlador

def crear_rutas_trabajos(repo_trabajo, repo_cliente=None):
    """Crea el blueprint de rutas de trabajos"""
    
    rutas_trabajos = Blueprint('trabajos', __name__, url_prefix='/api/trabajos')
    controlador = TrabajoControlador(repo_trabajo, repo_cliente)
    
    @rutas_trabajos.route('', methods=['GET'])
    @token_requerido
    def obtener_todos():
        """
        Obtiene todos los registros de trabajo
        GET /api/trabajos
        
        Headers:
            Authorization: Bearer <token>
        """
        resultado, codigo = controlador.obtener_todos()
        return jsonify(resultado), codigo
    
    @rutas_trabajos.route('/<registro_id>', methods=['GET'])
    @token_requerido
    def obtener_trabajo(registro_id):
        """
        Obtiene un registro específico
        GET /api/trabajos/<registro_id>
        
        Headers:
            Authorization: Bearer <token>
        """
        resultado, codigo = controlador.obtener_por_id(registro_id)
        return jsonify(resultado), codigo
    
    @rutas_trabajos.route('/cliente/<cliente_id>', methods=['GET'])
    @token_requerido
    def obtener_por_cliente(cliente_id):
        """
        Obtiene trabajos de un cliente específico
        GET /api/trabajos/cliente/<cliente_id>
        
        Headers:
            Authorization: Bearer <token>
        """
        resultado, codigo = controlador.obtener_por_cliente(cliente_id)
        return jsonify(resultado), codigo
    
    @rutas_trabajos.route('/empleado/<empleado_id>', methods=['GET'])
    @token_requerido
    def obtener_por_empleado(empleado_id):
        """
        Obtiene trabajos de un empleado específico
        GET /api/trabajos/empleado/<empleado_id>
        
        Headers:
            Authorization: Bearer <token>
        """
        resultado, codigo = controlador.obtener_por_empleado(empleado_id)
        return jsonify(resultado), codigo
    
    @rutas_trabajos.route('/pendientes', methods=['GET'])
    @token_requerido
    def obtener_pendientes():
        """
        Obtiene registros pendientes
        GET /api/trabajos/pendientes
        
        Headers:
            Authorization: Bearer <token>
        
        Query params:
            empleado_id: (opcional) para filtrar por empleado
        """
        empleado_id = request.args.get('empleado_id')
        resultado, codigo = controlador.obtener_pendientes(empleado_id)
        return jsonify(resultado), codigo
    
    @rutas_trabajos.route('', methods=['POST'])
    @token_requerido
    def crear_trabajo():
        """
        Crea un nuevo registro de trabajo
        POST /api/trabajos
        
        Headers:
            Authorization: Bearer <token>
        
        Body:
        {
            "cliente_id": "string",
            "empleado_id": "string",
            "tipo_servicio": "instalacion|descarga",
            "juegos_instalados": ["id1", "id2"],
            "descripcion": "string",
            "costo": "float"
        }
        """
        datos = request.get_json()
        
        if not datos:
            return jsonify({'error': 'No data provided'}), 400
        
        resultado, codigo = controlador.crear(datos)
        return jsonify(resultado), codigo
    
    @rutas_trabajos.route('/<registro_id>', methods=['PUT'])
    @token_requerido
    def actualizar_trabajo(registro_id):
        """
        Actualiza un registro de trabajo
        PUT /api/trabajos/<registro_id>
        
        Headers:
            Authorization: Bearer <token>
        
        Body:
        {
            "descripcion": "string",
            "costo": "float",
            "estado": "pendiente|en_progreso|completado|cancelado"
        }
        """
        datos = request.get_json()
        
        if not datos:
            return jsonify({'error': 'No data provided'}), 400
        
        resultado, codigo = controlador.actualizar(registro_id, datos)
        return jsonify(resultado), codigo
    
    @rutas_trabajos.route('/<registro_id>', methods=['DELETE'])
    @token_requerido
    def eliminar_trabajo(registro_id):
        """
        Elimina un registro de trabajo (solo si está en estado pendiente)
        DELETE /api/trabajos/<registro_id>
        
        Headers:
            Authorization: Bearer <token>
        """
        resultado, codigo = controlador.eliminar(registro_id)
        return jsonify(resultado), codigo
    
    @rutas_trabajos.route('/<registro_id>/cambiar-estado', methods=['POST'])
    @token_requerido
    def cambiar_estado(registro_id):
        """
        Cambia el estado de un registro de trabajo
        POST /api/trabajos/<registro_id>/cambiar-estado
        
        Headers:
            Authorization: Bearer <token>
        
        Body:
        {
            "estado": "pendiente|en_progreso|completado|cancelado"
        }
        """
        datos = request.get_json()
        
        if not datos or 'estado' not in datos:
            return jsonify({'error': 'Estado requerido'}), 400
        
        resultado, codigo = controlador.cambiar_estado(registro_id, datos['estado'])
        return jsonify(resultado), codigo
    
    @rutas_trabajos.route('/<registro_id>/registrar-pago', methods=['POST'])
    @rol_requerido('administrador')
    def registrar_pago(registro_id):
        """
        Registra un pago para un trabajo
        POST /api/trabajos/<registro_id>/registrar-pago
        
        Headers:
            Authorization: Bearer <token>
        
        Body:
        {
            "monto": float
        }
        """
        datos = request.get_json()
        
        if not datos or 'monto' not in datos:
            return jsonify({'error': 'Monto requerido'}), 400
        
        resultado, codigo = controlador.registrar_pago(registro_id, datos['monto'])
        return jsonify(resultado), codigo
    
    @rutas_trabajos.route('/<registro_id>/asignar-deuda', methods=['POST'])
    @rol_requerido('administrador')
    def asignar_deuda_total(registro_id):
        """
        Asigna una deuda total nueva y limpia el historial de pagos
        POST /api/trabajos/<registro_id>/asignar-deuda
        
        Headers:
            Authorization: Bearer <token>
        
        Body:
        {
            "nuevo_costo": float
        }
        """
        datos = request.get_json()
        
        if not datos or 'nuevo_costo' not in datos:
            return jsonify({'error': 'Nuevo costo requerido'}), 400
        
        resultado, codigo = controlador.asignar_deuda_total(registro_id, datos['nuevo_costo'])
        return jsonify(resultado), codigo
    
    @rutas_trabajos.route('/<registro_id>/limpiar-pagos', methods=['POST'])
    @rol_requerido('administrador')
    def limpiar_historial_pagos(registro_id):
        """
        Limpia el historial de pagos manteniendo el costo original
        POST /api/trabajos/<registro_id>/limpiar-pagos
        
        Headers:
            Authorization: Bearer <token>
        """
        resultado, codigo = controlador.limpiar_historial_pagos(registro_id)
        return jsonify(resultado), codigo
    
    @rutas_trabajos.route('/estadisticas', methods=['GET'])
    @rol_requerido('administrador')
    def obtener_estadisticas():
        """
        Obtiene estadísticas de trabajos (solo admin)
        GET /api/trabajos/estadisticas
        
        Headers:
            Authorization: Bearer <token>
        """
        resultado, codigo = controlador.obtener_estadisticas()
        return jsonify(resultado), codigo
    
    return rutas_trabajos

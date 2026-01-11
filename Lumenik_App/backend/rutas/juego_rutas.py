"""
juego_rutas.py - Rutas de Gestión de Juegos
"""
from flask import Blueprint, request, jsonify
from controladores.autenticacion_controlador import token_requerido, rol_requerido
from controladores.juego_controlador import JuegoControlador

def crear_rutas_juegos(repo_juego):
    """Crea el blueprint de rutas de juegos"""
    
    rutas_juegos = Blueprint('juegos', __name__, url_prefix='/api/juegos')
    controlador = JuegoControlador(repo_juego)
    
    @rutas_juegos.route('', methods=['GET'])
    def obtener_todos():
        """
        Obtiene todos los juegos disponibles
        GET /api/juegos
        """
        resultado, codigo = controlador.obtener_todos()
        return jsonify(resultado), codigo
    
    @rutas_juegos.route('/todas-consolas', methods=['GET'])
    def obtener_todas_consolas():
        """
        Obtiene juegos agrupados por consola
        GET /api/juegos/todas-consolas
        """
        resultado, codigo = controlador.obtener_todas_las_consolas()
        return jsonify(resultado), codigo
    
    @rutas_juegos.route('/consola/<consola>', methods=['GET'])
    def obtener_por_consola(consola):
        """
        Obtiene juegos de una consola específica
        GET /api/juegos/consola/<consola>
        
        Consolas válidas: PSP, PS2, PS3, PS4
        """
        resultado, codigo = controlador.obtener_por_consola(consola)
        return jsonify(resultado), codigo
    
    @rutas_juegos.route('/<juego_id>', methods=['GET'])
    def obtener_juego(juego_id):
        """
        Obtiene un juego específico
        GET /api/juegos/<juego_id>
        """
        resultado, codigo = controlador.obtener_por_id(juego_id)
        return jsonify(resultado), codigo
    
    @rutas_juegos.route('', methods=['POST'])
    @rol_requerido('administrador')
    def crear_juego():
        """
        Crea un nuevo juego (solo admin)
        POST /api/juegos
        
        Headers:
            Authorization: Bearer <token>
        
        Body:
        {
            "nombre": "string",
            "consola": "PSP|PS2|PS3|PS4",
            "peso_gb": "float",
            "descripcion": "string",
            "imagen_url": "string"
        }
        """
        datos = request.get_json()
        
        if not datos:
            return jsonify({'error': 'No data provided'}), 400
        
        resultado, codigo = controlador.crear(datos)
        return jsonify(resultado), codigo
    
    @rutas_juegos.route('/<juego_id>', methods=['PUT'])
    @rol_requerido('administrador')
    def actualizar_juego(juego_id):
        """
        Actualiza un juego (solo admin)
        PUT /api/juegos/<juego_id>
        
        Headers:
            Authorization: Bearer <token>
        
        Body:
        {
            "nombre": "string",
            "descripcion": "string",
            "imagen_url": "string",
            "peso_gb": "float",
            "consola": "string"
        }
        """
        datos = request.get_json()
        
        if not datos:
            return jsonify({'error': 'No data provided'}), 400
        
        resultado, codigo = controlador.actualizar(juego_id, datos)
        return jsonify(resultado), codigo
    
    @rutas_juegos.route('/<juego_id>', methods=['DELETE'])
    @rol_requerido('administrador')
    def eliminar_juego(juego_id):
        """
        Elimina un juego completamente (solo admin)
        DELETE /api/juegos/<juego_id>
        
        Headers:
            Authorization: Bearer <token>
        """
        resultado, codigo = controlador.eliminar(juego_id)
        return jsonify(resultado), codigo
    
    @rutas_juegos.route('/<juego_id>/disponibilidad', methods=['POST'])
    @rol_requerido('administrador')
    def cambiar_disponibilidad(juego_id):
        """
        Cambia la disponibilidad de un juego (solo admin)
        POST /api/juegos/<juego_id>/disponibilidad
        
        Headers:
            Authorization: Bearer <token>
        
        Body:
        {
            "disponible": boolean
        }
        """
        datos = request.get_json()
        
        if not datos or 'disponible' not in datos:
            return jsonify({'error': 'Campo disponible requerido'}), 400
        
        resultado, codigo = controlador.cambiar_disponibilidad(juego_id, datos['disponible'])
        return jsonify(resultado), codigo
    
    @rutas_juegos.route('/buscar/<termino>', methods=['GET'])
    def buscar_juegos(termino):
        """
        Busca juegos por nombre
        GET /api/juegos/buscar/<termino>
        """
        resultado, codigo = controlador.buscar(termino)
        return jsonify(resultado), codigo
    
    @rutas_juegos.route('/estadisticas', methods=['GET'])
    @rol_requerido('administrador')
    def obtener_estadisticas():
        """
        Obtiene estadísticas de juegos (solo admin)
        GET /api/juegos/estadisticas
        
        Headers:
            Authorization: Bearer <token>
        """
        resultado, codigo = controlador.obtener_estadisticas()
        return jsonify(resultado), codigo
    
    return rutas_juegos

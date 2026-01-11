"""
juego_controlador.py - Controlador de Juegos
"""
from modelos.juego import Juego

class JuegoControlador:
    """Controlador para gestión de juegos"""
    
    def __init__(self, repo_juego):
        """Inicializa el controlador"""
        self.repo_juego = repo_juego
    
    def crear(self, datos):
        """Crea un nuevo juego"""
        nombre = datos.get('nombre')
        consola = datos.get('consola')
        peso_gb = datos.get('peso_gb')
        descripcion = datos.get('descripcion', '')
        imagen_url = datos.get('imagen_url', '')
        
        # Validaciones
        if not nombre or not consola or peso_gb is None:
            return {'error': 'Campos requeridos: nombre, consola, peso_gb'}, 400
        
        consolas_validas = ['PSP', 'PS2', 'PS3', 'PS4']
        if consola not in consolas_validas:
            return {'error': f'Consola inválida. Debe ser: {", ".join(consolas_validas)}'}, 400
        
        try:
            peso_gb = float(peso_gb)
            if peso_gb <= 0:
                return {'error': 'El peso debe ser mayor a 0'}, 400
        except ValueError:
            return {'error': 'El peso debe ser un número'}, 400
        
        # Crear juego
        juego = Juego(
            nombre=nombre,
            consola=consola,
            peso_gb=peso_gb,
            descripcion=descripcion,
            imagen_url=imagen_url
        )
        
        juego_id = self.repo_juego.crear(juego)
        
        return {
            'mensaje': 'Juego creado exitosamente',
            'juego_id': juego_id
        }, 201
    
    def obtener_todos(self):
        """Obtiene todos los juegos disponibles"""
        juegos = self.repo_juego.obtener_todos()
        
        juegos_respuesta = [self._formato_juego(j) for j in juegos]
        
        return {'juegos': juegos_respuesta, 'total': len(juegos_respuesta)}, 200
    
    def obtener_por_consola(self, consola):
        """Obtiene juegos de una consola específica"""
        consolas_validas = ['PSP', 'PS2', 'PS3', 'PS4']
        if consola not in consolas_validas:
            return {'error': f'Consola inválida. Debe ser: {", ".join(consolas_validas)}'}, 400
        
        juegos = self.repo_juego.obtener_por_consola(consola)
        
        juegos_respuesta = [self._formato_juego(j) for j in juegos]
        
        return {
            'consola': consola,
            'juegos': juegos_respuesta,
            'total': len(juegos_respuesta)
        }, 200
    
    def obtener_todas_las_consolas(self):
        """Obtiene juegos agrupados por consola"""
        consolas = {'PSP': [], 'PS2': [], 'PS3': [], 'PS4': []}
        juegos = self.repo_juego.obtener_todas_consolas()
        
        for juego in juegos:
            consola = juego.get('consola')
            if consola in consolas:
                consolas[consola].append(self._formato_juego(juego))
        
        return {'juegos_por_consola': consolas}, 200
    
    def obtener_por_id(self, juego_id):
        """Obtiene un juego por ID"""
        juego = self.repo_juego.obtener_por_id(juego_id)
        
        if not juego:
            return {'error': 'Juego no encontrado'}, 404
        
        return self._formato_juego(juego), 200
    
    def actualizar(self, juego_id, datos):
        """Actualiza un juego"""
        juego = self.repo_juego.obtener_por_id(juego_id)
        
        if not juego:
            return {'error': 'Juego no encontrado'}, 404
        
        # Campos que pueden actualizarse
        datos_actualizacion = {}
        
        if 'nombre' in datos:
            datos_actualizacion['nombre'] = datos['nombre']
        
        if 'descripcion' in datos:
            datos_actualizacion['descripcion'] = datos['descripcion']
        
        if 'imagen_url' in datos:
            datos_actualizacion['imagen_url'] = datos['imagen_url']
        
        if 'peso_gb' in datos:
            try:
                peso = float(datos['peso_gb'])
                if peso <= 0:
                    return {'error': 'El peso debe ser mayor a 0'}, 400
                datos_actualizacion['peso_gb'] = peso
            except ValueError:
                return {'error': 'El peso debe ser un número'}, 400
        
        if 'consola' in datos:
            consolas_validas = ['PSP', 'PS2', 'PS3', 'PS4']
            if datos['consola'] not in consolas_validas:
                return {'error': f'Consola inválida. Debe ser: {", ".join(consolas_validas)}'}, 400
            datos_actualizacion['consola'] = datos['consola']
        
        self.repo_juego.actualizar(juego_id, datos_actualizacion)
        
        return {'mensaje': 'Juego actualizado exitosamente'}, 200
    
    def cambiar_disponibilidad(self, juego_id, disponible):
        """Cambia la disponibilidad de un juego"""
        juego = self.repo_juego.obtener_por_id(juego_id)
        
        if not juego:
            return {'error': 'Juego no encontrado'}, 404
        
        self.repo_juego.cambiar_disponibilidad(juego_id, disponible)
        
        estado = 'disponible' if disponible else 'no disponible'
        return {'mensaje': f'Juego marcado como {estado}'}, 200
    
    def buscar(self, termino):
        """Busca juegos por nombre"""
        juegos = self.repo_juego.buscar(termino)
        
        juegos_respuesta = [self._formato_juego(j) for j in juegos]
        
        return {'juegos': juegos_respuesta, 'total': len(juegos_respuesta)}, 200
    
    def eliminar(self, juego_id):
        """Elimina un juego completamente"""
        juego = self.repo_juego.obtener_por_id(juego_id)
        
        if not juego:
            return {'error': 'Juego no encontrado'}, 404
        
        self.repo_juego.eliminar(juego_id)
        
        return {'mensaje': 'Juego eliminado exitosamente'}, 200
    
    def obtener_estadisticas(self):
        """Obtiene estadísticas de juegos"""
        todos_juegos = self.repo_juego.obtener_todos()
        
        estadisticas = {
            'total_juegos': len(todos_juegos),
            'por_consola': {
                'PSP': len([j for j in todos_juegos if j['consola'] == 'PSP']),
                'PS2': len([j for j in todos_juegos if j['consola'] == 'PS2']),
                'PS3': len([j for j in todos_juegos if j['consola'] == 'PS3']),
                'PS4': len([j for j in todos_juegos if j['consola'] == 'PS4'])
            },
            'peso_total_gb': sum(j['peso_gb'] for j in todos_juegos)
        }
        
        return estadisticas, 200
    
    @staticmethod
    def _formato_juego(juego):
        """Convierte un documento juego a formato de respuesta"""
        return {
            'id': str(juego['_id']),
            'nombre': juego['nombre'],
            'consola': juego['consola'],
            'peso_gb': juego['peso_gb'],
            'descripcion': juego['descripcion'],
            'imagen_url': juego['imagen_url'],
            'disponible': juego['disponible'],
            'fecha_agregado': juego['fecha_agregado'].isoformat()
        }

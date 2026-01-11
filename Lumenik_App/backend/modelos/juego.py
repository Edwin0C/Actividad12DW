"""
juego.py - Modelo de Juego
"""
from datetime import datetime
from bson.objectid import ObjectId

class Juego:
    """Modelo para la colección de juegos"""
    
    def __init__(self, nombre, consola, peso_gb, descripcion, 
                 imagen_url='', disponible=True):
        """
        Inicializa un nuevo juego
        
        Args:
            nombre (str): Nombre del juego
            consola (str): PSP, PS2, PS3 o PS4
            peso_gb (float): Peso en gigabytes
            descripcion (str): Descripción del juego
            imagen_url (str): URL de la imagen
            disponible (bool): Si está disponible o no
        """
        self.nombre = nombre
        self.consola = consola
        self.peso_gb = float(peso_gb)
        self.descripcion = descripcion
        self.imagen_url = imagen_url
        self.disponible = disponible
        self.fecha_agregado = datetime.now()
    
    def a_diccionario(self):
        """Convierte el juego a diccionario para MongoDB"""
        return {
            'nombre': self.nombre,
            'consola': self.consola,
            'peso_gb': self.peso_gb,
            'descripcion': self.descripcion,
            'imagen_url': self.imagen_url,
            'disponible': self.disponible,
            'fecha_agregado': self.fecha_agregado
        }
    
    @staticmethod
    def desde_diccionario(datos):
        """Crea un objeto Juego desde un diccionario"""
        return Juego(
            nombre=datos.get('nombre'),
            consola=datos.get('consola'),
            peso_gb=datos.get('peso_gb'),
            descripcion=datos.get('descripcion'),
            imagen_url=datos.get('imagen_url', ''),
            disponible=datos.get('disponible', True)
        )

class RepositorioJuego:
    """Repositorio para operaciones CRUD de juegos"""
    
    def __init__(self, db):
        """
        Inicializa el repositorio
        
        Args:
            db: Instancia de base de datos MongoDB
        """
        self.db = db
        self.coleccion = db['juegos']
    
    def crear(self, juego):
        """Crea un nuevo juego"""
        resultado = self.coleccion.insert_one(juego.a_diccionario())
        return str(resultado.inserted_id)
    
    def obtener_por_id(self, juego_id):
        """Obtiene juego por ID"""
        try:
            juego = self.coleccion.find_one({'_id': ObjectId(juego_id)})
            return juego
        except:
            return None
    
    def obtener_todos(self):
        """Obtiene todos los juegos disponibles"""
        return list(self.coleccion.find({'disponible': True}))
    
    def obtener_por_consola(self, consola):
        """Obtiene juegos por consola"""
        return list(self.coleccion.find({
            'consola': consola,
            'disponible': True
        }))
    
    def obtener_todas_consolas(self):
        """Obtiene juegos de todas las consolas"""
        return list(self.coleccion.find({'disponible': True}))
    
    def actualizar(self, juego_id, datos):
        """Actualiza un juego"""
        try:
            resultado = self.coleccion.update_one(
                {'_id': ObjectId(juego_id)},
                {'$set': datos}
            )
            return resultado.modified_count > 0
        except:
            return False
    
    def eliminar(self, juego_id):
        """Elimina un juego completamente de la base de datos"""
        try:
            resultado = self.coleccion.delete_one(
                {'_id': ObjectId(juego_id)}
            )
            return resultado.deleted_count > 0
        except:
            return False
    
    def cambiar_disponibilidad(self, juego_id, disponible):
        """Marca un juego como disponible o no disponible"""
        try:
            resultado = self.coleccion.update_one(
                {'_id': ObjectId(juego_id)},
                {'$set': {'disponible': disponible}}
            )
            return resultado.modified_count > 0
        except:
            return False
    
    def buscar(self, termino):
        """Busca juegos por nombre"""
        return list(self.coleccion.find({
            'nombre': {'$regex': termino, '$options': 'i'},
            'disponible': True
        }))
    
    def obtener_juegos_mas_populares(self, limite=10):
        """Obtiene los juegos más descargados/instalados"""
        # En un futuro, esto puede integrar datos de registros_trabajo
        return list(self.coleccion.find({'disponible': True}).limit(limite))
    
    def obtener_por_peso(self, peso_minimo, peso_maximo):
        """Obtiene juegos dentro de un rango de peso"""
        return list(self.coleccion.find({
            'peso_gb': {'$gte': peso_minimo, '$lte': peso_maximo},
            'disponible': True
        }))

"""
usuario.py - Modelo de Usuario
"""
from datetime import datetime
from bson.objectid import ObjectId
from pymongo import MongoClient
import os

class Usuario:
    """Modelo para la colección de usuarios"""
    
    def __init__(self, nombre_usuario, contraseña_hash, email, rol, 
                 nombre_completo, telefono='', estado='activo'):
        """
        Inicializa un nuevo usuario
        
        Args:
            nombre_usuario (str): Nombre único para login
            contraseña_hash (str): Hash de la contraseña
            email (str): Email del usuario
            rol (str): admin, empleado o cliente
            nombre_completo (str): Nombre completo
            telefono (str): Número de teléfono
            estado (str): activo o inactivo
        """
        self.nombre_usuario = nombre_usuario
        self.contraseña_hash = contraseña_hash
        self.email = email
        self.rol = rol
        self.nombre_completo = nombre_completo
        self.telefono = telefono
        self.estado = estado
        self.fecha_creacion = datetime.now()
    
    def a_diccionario(self):
        """Convierte el usuario a diccionario para MongoDB"""
        return {
            'nombre_usuario': self.nombre_usuario,
            'contraseña_hash': self.contraseña_hash,
            'email': self.email,
            'rol': self.rol,
            'nombre_completo': self.nombre_completo,
            'telefono': self.telefono,
            'estado': self.estado,
            'fecha_creacion': self.fecha_creacion
        }
    
    @staticmethod
    def desde_diccionario(datos):
        """Crea un objeto Usuario desde un diccionario"""
        return Usuario(
            nombre_usuario=datos.get('nombre_usuario'),
            contraseña_hash=datos.get('contraseña_hash'),
            email=datos.get('email'),
            rol=datos.get('rol'),
            nombre_completo=datos.get('nombre_completo'),
            telefono=datos.get('telefono', ''),
            estado=datos.get('estado', 'activo')
        )

class RepositorioUsuario:
    """Repositorio para operaciones CRUD de usuarios"""
    
    def __init__(self, db):
        """
        Inicializa el repositorio
        
        Args:
            db: Instancia de base de datos MongoDB
        """
        self.db = db
        self.coleccion = db['usuarios']
    
    def crear(self, usuario):
        """Crea un nuevo usuario"""
        resultado = self.coleccion.insert_one(usuario.a_diccionario())
        return str(resultado.inserted_id)
    
    def obtener_por_id(self, usuario_id):
        """Obtiene usuario por ID"""
        try:
            usuario = self.coleccion.find_one({'_id': ObjectId(usuario_id)})
            return usuario
        except:
            return None
    
    def obtener_por_nombre(self, nombre_usuario):
        """Obtiene usuario por nombre de usuario"""
        return self.coleccion.find_one({'nombre_usuario': nombre_usuario})
    
    def obtener_todos(self):
        """Obtiene todos los usuarios"""
        return list(self.coleccion.find({}))
    
    def actualizar(self, usuario_id, datos):
        """Actualiza un usuario"""
        try:
            resultado = self.coleccion.update_one(
                {'_id': ObjectId(usuario_id)},
                {'$set': datos}
            )
            return resultado.modified_count > 0
        except:
            return False
    
    def eliminar(self, usuario_id):
        """Elimina (desactiva) un usuario"""
        try:
            resultado = self.coleccion.update_one(
                {'_id': ObjectId(usuario_id)},
                {'$set': {'estado': 'inactivo'}}
            )
            return resultado.modified_count > 0
        except:
            return False
    
    def existe_nombre_usuario(self, nombre_usuario):
        """Verifica si un nombre de usuario ya existe"""
        return self.coleccion.find_one({'nombre_usuario': nombre_usuario}) is not None
    
    def obtener_por_rol(self, rol):
        """Obtiene todos los usuarios con un rol específico"""
        return list(self.coleccion.find({'rol': rol, 'estado': 'activo'}))

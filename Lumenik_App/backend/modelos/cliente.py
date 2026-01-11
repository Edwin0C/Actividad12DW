"""
cliente.py - Modelo de Cliente
"""
from datetime import datetime
from bson.objectid import ObjectId

class Cliente:
    """Modelo para información adicional de clientes"""
    
    def __init__(self, usuario_id, telefono='', direccion='', ciudad='', 
                 consolas_principales=None, espacio_total_gb=0):
        """
        Inicializa un nuevo cliente
        
        Args:
            usuario_id (str): ID del usuario asociado
            telefono (str): Teléfono del cliente
            direccion (str): Dirección
            ciudad (str): Ciudad
            consolas_principales (list): Consolas que le interesan
            espacio_total_gb (float): Espacio total disponible en el dispositivo en GB
        """
        self.usuario_id = usuario_id
        self.telefono = telefono
        self.direccion = direccion
        self.ciudad = ciudad
        self.consolas_principales = consolas_principales or ['PS4']
        self.espacio_total_gb = espacio_total_gb
        self.cliente_desde = datetime.now()
        self.servicios_realizados = 0
        self.gasto_total = 0.0
    
    def a_diccionario(self):
        """Convierte el cliente a diccionario para MongoDB"""
        return {
            'usuario_id': self.usuario_id,
            'telefono': self.telefono,
            'direccion': self.direccion,
            'ciudad': self.ciudad,
            'consolas_principales': self.consolas_principales,
            'espacio_total_gb': self.espacio_total_gb,
            'cliente_desde': self.cliente_desde,
            'servicios_realizados': self.servicios_realizados,
            'gasto_total': self.gasto_total
        }

class RepositorioCliente:
    """Repositorio para operaciones CRUD de clientes"""
    
    def __init__(self, db):
        """
        Inicializa el repositorio
        
        Args:
            db: Instancia de base de datos MongoDB
        """
        self.db = db
        self.coleccion = db['clientes']
    
    def crear(self, cliente):
        """Crea un nuevo cliente"""
        resultado = self.coleccion.insert_one(cliente.a_diccionario())
        return str(resultado.inserted_id)
    
    def obtener_por_usuario_id(self, usuario_id):
        """Obtiene cliente por ID de usuario"""
        try:
            cliente = self.coleccion.find_one({'usuario_id': usuario_id})
            return cliente
        except:
            return None
    
    def obtener_por_id(self, cliente_id):
        """Obtiene cliente por ID de cliente"""
        try:
            cliente = self.coleccion.find_one({'_id': ObjectId(cliente_id)})
            return cliente
        except:
            return None
    
    def obtener_todos(self):
        """Obtiene todos los clientes"""
        return list(self.coleccion.find({}))
    
    def actualizar(self, cliente_id, datos):
        """Actualiza un cliente"""
        try:
            resultado = self.coleccion.update_one(
                {'_id': ObjectId(cliente_id)},
                {'$set': datos}
            )
            return resultado.modified_count > 0
        except:
            return False
    
    def actualizar_por_usuario_id(self, usuario_id, datos):
        """Actualiza un cliente por ID de usuario"""
        try:
            resultado = self.coleccion.update_one(
                {'usuario_id': usuario_id},
                {'$set': datos}
            )
            return resultado.modified_count > 0
        except:
            return False
    
    def incrementar_servicios(self, cliente_id, monto=1.0):
        """Incrementa el contador de servicios y el gasto total"""
        try:
            self.coleccion.update_one(
                {'_id': ObjectId(cliente_id)},
                {
                    '$inc': {
                        'servicios_realizados': 1,
                        'gasto_total': monto
                    }
                }
            )
            return True
        except:
            return False

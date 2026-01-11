"""
registro_trabajo.py - Modelo de Registro de Trabajo
"""
from datetime import datetime
from bson.objectid import ObjectId

class RegistroTrabajo:
    """Modelo para registros de trabajos realizados"""
    
    def __init__(self, cliente_id, empleado_id, tipo_servicio, 
                 juegos_instalados=None, descripcion='', 
                 costo=0.0, estado='pendiente'):
        """
        Inicializa un nuevo registro de trabajo
        
        Args:
            cliente_id (str): ID del cliente
            empleado_id (str): ID del empleado que realiza el trabajo
            tipo_servicio (str): instalacion o descarga
            juegos_instalados (list): Lista de IDs de juegos
            descripcion (str): Descripción del trabajo
            costo (float): Costo del servicio
            estado (str): pendiente, en_progreso, completado, cancelado
        """
        self.cliente_id = cliente_id
        self.empleado_id = empleado_id
        self.tipo_servicio = tipo_servicio
        self.juegos_instalados = juegos_instalados or []
        self.descripcion = descripcion
        self.costo = float(costo)
        self.estado = estado
        self.fecha_creacion = datetime.now()
        self.fecha_inicio = None
        self.fecha_fin = None
        self.total_gb = 0.0
        self.consola = 'PS4'
        # Campos de pago
        self.monto_pagado = 0.0  # Monto total pagado por el cliente
        self.pagos = []  # Lista de pagos realizados con detalles
        self.completamente_pagado = False  # Flag para indicar si el pago está completo
    
    def a_diccionario(self):
        """Convierte el registro a diccionario para MongoDB"""
        return {
            'cliente_id': self.cliente_id,
            'empleado_id': self.empleado_id,
            'tipo_servicio': self.tipo_servicio,
            'juegos_instalados': self.juegos_instalados,
            'descripcion': self.descripcion,
            'costo': self.costo,
            'estado': self.estado,
            'fecha_creacion': self.fecha_creacion,
            'fecha_inicio': self.fecha_inicio,
            'fecha_fin': self.fecha_fin,
            'total_gb': self.total_gb,
            'consola': self.consola,
            'monto_pagado': self.monto_pagado,
            'pagos': self.pagos,
            'completamente_pagado': self.completamente_pagado
        }

class RepositorioRegistroTrabajo:
    """Repositorio para operaciones CRUD de registros de trabajo"""
    
    def __init__(self, db):
        """
        Inicializa el repositorio
        
        Args:
            db: Instancia de base de datos MongoDB
        """
        self.db = db
        self.coleccion = db['registros_trabajo']
    
    def crear(self, registro):
        """Crea un nuevo registro de trabajo"""
        resultado = self.coleccion.insert_one(registro.a_diccionario())
        return str(resultado.inserted_id)
    
    def obtener_por_id(self, registro_id):
        """Obtiene registro por ID"""
        try:
            registro = self.coleccion.find_one({'_id': ObjectId(registro_id)})
            return registro
        except:
            return None
    
    def obtener_por_cliente(self, cliente_id):
        """Obtiene todos los registros de un cliente"""
        try:
            return list(self.coleccion.find({'cliente_id': cliente_id}).sort('fecha_creacion', -1))
        except:
            return []
    
    def obtener_por_empleado(self, empleado_id):
        """Obtiene todos los registros de un empleado"""
        try:
            return list(self.coleccion.find({'empleado_id': empleado_id}).sort('fecha_creacion', -1))
        except:
            return []
    
    def obtener_pendientes(self):
        """Obtiene todos los registros pendientes"""
        return list(self.coleccion.find({'estado': 'pendiente'}).sort('fecha_creacion', 1))
    
    def obtener_pendientes_empleado(self, empleado_id):
        """Obtiene registros pendientes de un empleado"""
        return list(self.coleccion.find({
            'empleado_id': empleado_id,
            'estado': 'pendiente'
        }).sort('fecha_creacion', 1))
    
    def obtener_todos(self):
        """Obtiene todos los registros"""
        return list(self.coleccion.find({}).sort('fecha_creacion', -1))
    
    def actualizar(self, registro_id, datos):
        """Actualiza un registro"""
        try:
            resultado = self.coleccion.update_one(
                {'_id': ObjectId(registro_id)},
                {'$set': datos}
            )
            return resultado.modified_count > 0
        except:
            return False
    
    def cambiar_estado(self, registro_id, nuevo_estado):
        """Cambia el estado de un registro"""
        datos = {
            'estado': nuevo_estado,
        }
        if nuevo_estado == 'en_progreso':
            datos['fecha_inicio'] = datetime.now()
        elif nuevo_estado == 'completado':
            datos['fecha_fin'] = datetime.now()
        
        return self.actualizar(registro_id, datos)
    
    def eliminar(self, registro_id):
        """Elimina un registro"""
        try:
            resultado = self.coleccion.delete_one({'_id': ObjectId(registro_id)})
            return resultado.deleted_count > 0
        except:
            return False
    
    def obtener_por_fecha(self, fecha_inicio, fecha_fin):
        """Obtiene registros en un rango de fechas"""
        return list(self.coleccion.find({
            'fecha_creacion': {
                '$gte': fecha_inicio,
                '$lte': fecha_fin
            }
        }).sort('fecha_creacion', -1))
    
    def obtener_ingresos_total(self):
        """Calcula el ingreso total"""
        resultado = self.coleccion.aggregate([
            {'$match': {'estado': 'completado'}},
            {'$group': {'_id': None, 'total': {'$sum': '$costo'}}}
        ])
        resultado_list = list(resultado)
        return resultado_list[0]['total'] if resultado_list else 0.0
    
    def obtener_estadisticas(self):
        """Obtiene estadísticas generales"""
        total_registros = self.coleccion.count_documents({})
        registros_completados = self.coleccion.count_documents({'estado': 'completado'})
        registros_pendientes = self.coleccion.count_documents({'estado': 'pendiente'})
        
        return {
            'total_registros': total_registros,
            'completados': registros_completados,
            'pendientes': registros_pendientes,
            'ingresos_total': self.obtener_ingresos_total()
        }

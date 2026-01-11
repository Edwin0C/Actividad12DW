"""
trabajo_controlador.py - Controlador de Registros de Trabajo
"""
from datetime import datetime
from modelos.registro_trabajo import RegistroTrabajo

class TrabajoControlador:
    """Controlador para gestión de registros de trabajo"""
    
    def __init__(self, repo_trabajo, repo_cliente=None):
        """
        Inicializa el controlador
        
        Args:
            repo_trabajo: Repositorio de trabajos
            repo_cliente: Repositorio de clientes (opcional)
        """
        self.repo_trabajo = repo_trabajo
        self.repo_cliente = repo_cliente
    
    def crear(self, datos):
        """Crea un nuevo registro de trabajo"""
        cliente_id = datos.get('cliente_id')
        empleado_id = datos.get('empleado_id')
        tipo_servicio = datos.get('tipo_servicio')
        juegos_instalados = datos.get('juegos_instalados', [])
        descripcion = datos.get('descripcion', '')
        costo = datos.get('costo', 0.0)
        
        # Validaciones
        if not cliente_id or not tipo_servicio:
            return {'error': 'Campos requeridos: cliente_id, tipo_servicio'}, 400
        
        tipos_validos = ['instalacion', 'descarga']
        if tipo_servicio not in tipos_validos:
            return {'error': f'Tipo de servicio inválido. Debe ser: {", ".join(tipos_validos)}'}, 400
        
        try:
            costo = float(costo)
        except ValueError:
            return {'error': 'El costo debe ser un número'}, 400
        
        # Crear registro
        registro = RegistroTrabajo(
            cliente_id=cliente_id,
            empleado_id=empleado_id or 'sin_asignar',
            tipo_servicio=tipo_servicio,
            juegos_instalados=juegos_instalados,
            descripcion=descripcion,
            costo=costo
        )
        
        # Asignar total_gb y consola desde los datos de la solicitud
        registro.total_gb = float(datos.get('total_gb', 0.0))
        registro.consola = datos.get('consola', 'PS4')
        
        registro_id = self.repo_trabajo.crear(registro)
        
        # Actualizar estadísticas del cliente si existe repo
        if self.repo_cliente:
            self.repo_cliente.incrementar_servicios(cliente_id, costo)
        
        return {
            'mensaje': 'Registro de trabajo creado exitosamente',
            'registro_id': registro_id
        }, 201
    
    def obtener_todos(self):
        """Obtiene todos los registros de trabajo"""
        registros = self.repo_trabajo.obtener_todos()
        
        registros_respuesta = [self._formato_registro(r) for r in registros]
        
        return {'registros': registros_respuesta, 'total': len(registros_respuesta)}, 200
    
    def obtener_por_id(self, registro_id):
        """Obtiene un registro por ID"""
        registro = self.repo_trabajo.obtener_por_id(registro_id)
        
        if not registro:
            return {'error': 'Registro no encontrado'}, 404
        
        return self._formato_registro(registro), 200
    
    def obtener_por_cliente(self, cliente_id):
        """Obtiene registros de un cliente"""
        registros = self.repo_trabajo.obtener_por_cliente(cliente_id)
        
        registros_respuesta = [self._formato_registro(r) for r in registros]
        
        return {'registros': registros_respuesta, 'total': len(registros_respuesta)}, 200
    
    def obtener_por_empleado(self, empleado_id):
        """Obtiene registros de un empleado"""
        registros = self.repo_trabajo.obtener_por_empleado(empleado_id)
        
        registros_respuesta = [self._formato_registro(r) for r in registros]
        
        return {'registros': registros_respuesta, 'total': len(registros_respuesta)}, 200
    
    def obtener_pendientes(self, empleado_id=None):
        """Obtiene registros pendientes"""
        if empleado_id:
            registros = self.repo_trabajo.obtener_pendientes_empleado(empleado_id)
        else:
            registros = self.repo_trabajo.obtener_pendientes()
        
        registros_respuesta = [self._formato_registro(r) for r in registros]
        
        return {'registros': registros_respuesta, 'total': len(registros_respuesta)}, 200
    
    def actualizar(self, registro_id, datos):
        """Actualiza un registro de trabajo"""
        registro = self.repo_trabajo.obtener_por_id(registro_id)
        
        if not registro:
            return {'error': 'Registro no encontrado'}, 404
        
        # Solo permitir editar si está en estado pendiente
        if registro.get('estado') != 'pendiente':
            return {'error': f'No se puede editar un registro en estado {registro.get("estado")}. Solo se pueden editar registros pendientes.'}, 400
        
        # Campos que pueden actualizarse
        datos_actualizacion = {}
        
        if 'descripcion' in datos:
            datos_actualizacion['descripcion'] = datos['descripcion']
        
        if 'costo' in datos:
            try:
                costo = float(datos['costo'])
                datos_actualizacion['costo'] = costo
            except ValueError:
                return {'error': 'El costo debe ser un número'}, 400
        
        if 'estado' in datos:
            estados_validos = ['pendiente', 'en_progreso', 'completado', 'cancelado']
            if datos['estado'] not in estados_validos:
                return {'error': f'Estado inválido. Debe ser: {", ".join(estados_validos)}'}, 400
            datos_actualizacion['estado'] = datos['estado']
        
        # Campos adicionales para edición
        if 'juegos_instalados' in datos:
            datos_actualizacion['juegos_instalados'] = datos['juegos_instalados']
        
        if 'consola' in datos:
            datos_actualizacion['consola'] = datos['consola']
        
        if 'total_gb' in datos:
            try:
                total_gb = float(datos['total_gb'])
                datos_actualizacion['total_gb'] = total_gb
            except ValueError:
                return {'error': 'El total_gb debe ser un número'}, 400
        
        self.repo_trabajo.actualizar(registro_id, datos_actualizacion)
        
        return {'mensaje': 'Registro actualizado exitosamente'}, 200
    
    def eliminar(self, registro_id):
        """Elimina un registro de trabajo (solo si está en estado pendiente)"""
        registro = self.repo_trabajo.obtener_por_id(registro_id)
        
        if not registro:
            return {'error': 'Registro no encontrado'}, 404
        
        # Solo permitir eliminar si está en estado pendiente
        if registro.get('estado') != 'pendiente':
            return {'error': f'No se puede eliminar un registro en estado {registro.get("estado")}. Solo se pueden eliminar registros pendientes.'}, 400
        
        self.repo_trabajo.eliminar(registro_id)
        
        return {'mensaje': 'Registro eliminado exitosamente'}, 200
    
    def cambiar_estado(self, registro_id, nuevo_estado):
        """Cambia el estado de un registro"""
        registro = self.repo_trabajo.obtener_por_id(registro_id)
        
        if not registro:
            return {'error': 'Registro no encontrado'}, 404
        
        estados_validos = ['pendiente', 'en_progreso', 'completado', 'cancelado']
        if nuevo_estado not in estados_validos:
            return {'error': f'Estado inválido. Debe ser: {", ".join(estados_validos)}'}, 400
        
        self.repo_trabajo.cambiar_estado(registro_id, nuevo_estado)
        
        return {'mensaje': f'Estado cambiado a {nuevo_estado}'}, 200
    
    def registrar_pago(self, registro_id, monto):
        """Registra un pago para un trabajo"""
        registro = self.repo_trabajo.obtener_por_id(registro_id)
        
        if not registro:
            return {'error': 'Registro no encontrado'}, 404
        
        try:
            monto = float(monto)
            if monto <= 0:
                return {'error': 'El monto debe ser mayor a 0'}, 400
        except ValueError:
            return {'error': 'El monto debe ser un número'}, 400
        
        costo_total = float(registro.get('costo', 0))
        monto_pagado_actual = float(registro.get('monto_pagado', 0))
        monto_pagado_nuevo = monto_pagado_actual + monto
        
        # Validar que no se pague más de lo debido
        if monto_pagado_nuevo > costo_total:
            return {
                'error': f'El monto a pagar ({monto}) excede lo adeudado ({costo_total - monto_pagado_actual})',
                'monto_adeudado': costo_total - monto_pagado_actual
            }, 400
        
        # Crear entrada de pago
        nuevo_pago = {
            'monto': monto,
            'fecha': datetime.now().isoformat(),
            'saldo_pendiente': costo_total - monto_pagado_nuevo
        }
        
        # Actualizar registro
        datos_actualizacion = {
            'monto_pagado': monto_pagado_nuevo,
            'completamente_pagado': monto_pagado_nuevo >= costo_total
        }
        
        # Agregar nuevo pago a la lista
        pagos_actuales = registro.get('pagos', [])
        pagos_actuales.append(nuevo_pago)
        datos_actualizacion['pagos'] = pagos_actuales
        
        self.repo_trabajo.actualizar(registro_id, datos_actualizacion)
        
        return {
            'mensaje': f'Pago registrado exitosamente',
            'monto_pagado': monto_pagado_nuevo,
            'costo_total': costo_total,
            'saldo_pendiente': max(0, costo_total - monto_pagado_nuevo),
            'completamente_pagado': monto_pagado_nuevo >= costo_total
        }, 200
    
    def asignar_deuda_total(self, registro_id, nuevo_costo):
        """Asigna una deuda total nueva y limpia el historial de pagos"""
        registro = self.repo_trabajo.obtener_por_id(registro_id)
        
        if not registro:
            return {'error': 'Registro no encontrado'}, 404
        
        try:
            nuevo_costo = float(nuevo_costo)
            if nuevo_costo < 0:
                return {'error': 'El costo no puede ser negativo'}, 400
        except ValueError:
            return {'error': 'El costo debe ser un número'}, 400
        
        # Resetear pagos
        datos_actualizacion = {
            'costo': nuevo_costo,
            'monto_pagado': 0.0,
            'pagos': [],
            'completamente_pagado': False
        }
        
        self.repo_trabajo.actualizar(registro_id, datos_actualizacion)
        
        return {
            'mensaje': 'Deuda total asignada y historial de pagos limpiado',
            'costo_total': nuevo_costo,
            'monto_pagado': 0.0,
            'saldo_pendiente': nuevo_costo
        }, 200
    
    def limpiar_historial_pagos(self, registro_id):
        """Limpia solo el historial de pagos manteniendo el costo"""
        registro = self.repo_trabajo.obtener_por_id(registro_id)
        
        if not registro:
            return {'error': 'Registro no encontrado'}, 404
        
        costo_total = float(registro.get('costo', 0))
        
        # Limpiar pagos
        datos_actualizacion = {
            'monto_pagado': 0.0,
            'pagos': [],
            'completamente_pagado': False
        }
        
        self.repo_trabajo.actualizar(registro_id, datos_actualizacion)
        
        return {
            'mensaje': 'Historial de pagos limpiado',
            'costo_total': costo_total,
            'monto_pagado': 0.0,
            'saldo_pendiente': costo_total
        }, 200
    
    def obtener_estadisticas(self):
        """Obtiene estadísticas de trabajos"""
        stats = self.repo_trabajo.obtener_estadisticas()
        return stats, 200
    
    @staticmethod
    def _formato_registro(registro):
        """Convierte un documento registro a formato de respuesta"""
        return {
            'id': str(registro['_id']),
            'cliente_id': registro.get('cliente_id'),
            'empleado_id': registro.get('empleado_id'),
            'tipo_servicio': registro['tipo_servicio'],
            'juegos_instalados': [str(j) if hasattr(j, '__str__') else j 
                                 for j in registro.get('juegos_instalados', [])],
            'descripcion': registro['descripcion'],
            'costo': registro['costo'],
            'estado': registro['estado'],
            'fecha_creacion': registro['fecha_creacion'].isoformat() if registro.get('fecha_creacion') else None,
            'fecha_inicio': registro['fecha_inicio'].isoformat() if registro.get('fecha_inicio') else None,
            'fecha_fin': registro['fecha_fin'].isoformat() if registro.get('fecha_fin') else None,
            'total_gb': registro.get('total_gb', 0.0),
            'consola': registro.get('consola', 'Desconocida'),
            'monto_pagado': registro.get('monto_pagado', 0.0),
            'pagos': registro.get('pagos', []),
            'completamente_pagado': registro.get('completamente_pagado', False),
            'saldo_pendiente': max(0, float(registro.get('costo', 0)) - float(registro.get('monto_pagado', 0)))
        }

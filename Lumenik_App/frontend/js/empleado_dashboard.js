/**
 * empleado_dashboard.js - Lógica del panel del empleado
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    if (!verificarAutenticacion()) return;
    if (!requerirRol('empleado')) return;
    
    // Configurar logout y tabs
    configurarLogout();
    
    // Cargar datos iniciales
    await cargarClientes();
    await cargarTrabajosPendientes();
    await cargarHistorialTrabajos();
    
    // Configurar eventos
    configurarEventosEmpleado();
});

/**
 * Carga la lista de clientes del empleado
 */
async function cargarClientes() {
    try {
        const respuesta = await obtenerTodosUsuariosAPI();
        const clientes = respuesta.usuarios.filter(u => {
            // Simulamos que todos los clientes están asignados al empleado
            return true;
        });
        
        const tbody = document.getElementById('clientes-list');
        tbody.innerHTML = '';
        
        clientes.forEach(cliente => {
            const fila = document.createElement('tr');
            fila.className = 'hover:bg-gray-700 transition';
            fila.innerHTML = `
                <td class="px-4 py-2">${cliente.nombre_completo}</td>
                <td class="px-4 py-2">${cliente.telefono || 'N/A'}</td>
                <td class="px-4 py-2">Calle Principal #123</td>
                <td class="px-4 py-2">
                    <button class="px-3 py-1 bg-purple-600 rounded text-sm hover:bg-purple-700 transition" 
                            onclick="abrirModalTrabajo('${cliente.id}', '${cliente.nombre_completo}')">
                        Registrar Trabajo
                    </button>
                </td>
            `;
            tbody.appendChild(fila);
        });
        
    } catch (error) {
        mostrarNotificacion('Error al cargar clientes: ' + error.mensaje, 'error');
    }
}

/**
 * Carga los trabajos pendientes
 */
async function cargarTrabajosPendientes() {
    try {
        const usuario = obtenerUsuario();
        const respuesta = await obtenerTrabajosPendientesAPI(usuario.id);
        
        const contenedor = document.getElementById('trabajos-pendientes');
        contenedor.innerHTML = '';
        
        if (respuesta.registros.length === 0) {
            contenedor.innerHTML = '<p class="text-gray-400 text-center py-4">No hay trabajos pendientes</p>';
            return;
        }
        
        respuesta.registros.forEach(trabajo => {
            const tarjeta = document.createElement('div');
            tarjeta.className = 'bg-gray-700 rounded-lg p-4 border-l-4 border-yellow-500';
            tarjeta.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="font-bold text-yellow-300">TRABAJO PENDIENTE</p>
                        <p class="text-sm text-gray-400">${formatearFecha(trabajo.fecha_creacion)}</p>
                    </div>
                    <button class="px-3 py-1 bg-green-600 rounded text-sm hover:bg-green-700 transition"
                            onclick="cambiarEstadoTrabajo('${trabajo.id}', 'completado')">
                        Marcar Completado
                    </button>
                </div>
                <p class="text-sm text-gray-300 mb-2">${trabajo.descripcion}</p>
                <p class="text-sm text-gray-400">• ${trabajo.juegos_instalados.length} juego(s) instalados</p>
            `;
            contenedor.appendChild(tarjeta);
        });
        
    } catch (error) {
        console.error('Error al cargar trabajos pendientes:', error);
    }
}

/**
 * Carga el historial de trabajos
 */
async function cargarHistorialTrabajos() {
    try {
        const usuario = obtenerUsuario();
        const respuesta = await obtenerTrabajoPorEmpleadoAPI(usuario.id);
        
        const contenedor = document.getElementById('historial-trabajos');
        contenedor.innerHTML = '';
        
        if (respuesta.registros.length === 0) {
            contenedor.innerHTML = '<p class="text-gray-400 text-center py-4">No hay trabajos registrados</p>';
            return;
        }
        
        respuesta.registros.forEach(trabajo => {
            const tarjeta = document.createElement('div');
            const colorEstado = trabajo.estado === 'completado' ? 'green' : trabajo.estado === 'en_progreso' ? 'blue' : 'gray';
            tarjeta.className = `bg-gray-700 rounded-lg p-4 border-l-4 border-${colorEstado}-500`;
            tarjeta.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="font-bold">${trabajo.tipo_servicio.toUpperCase()}</p>
                        <p class="text-sm text-gray-400">${formatearFecha(trabajo.fecha_creacion)}</p>
                    </div>
                    <span class="px-3 py-1 rounded text-xs font-bold bg-${colorEstado}-900 text-${colorEstado}-300">
                        ${trabajo.estado.toUpperCase()}
                    </span>
                </div>
                <p class="text-sm text-gray-300 mb-2">${trabajo.descripcion}</p>
                <div class="flex justify-between text-sm text-gray-400 mt-2">
                    <span>${trabajo.juegos_instalados.length} juego(s)</span>
                    <span>${formatearDinero(trabajo.costo)}</span>
                </div>
            `;
            contenedor.appendChild(tarjeta);
        });
        
    } catch (error) {
        console.error('Error al cargar historial:', error);
    }
}

/**
 * Abre el modal para registrar trabajo
 */
async function abrirModalTrabajo(clienteId, nombreCliente) {
    const modal = document.getElementById('modal-trabajo');
    modal.classList.remove('hidden');
    
    // Guardar cliente actual
    modal.dataset.clienteId = clienteId;
    
    // Cargar juegos disponibles
    try {
        const respuesta = await obtenerTodosJuegosAPI();
        const checklist = document.getElementById('juegos-checklist');
        checklist.innerHTML = '';
        
        respuesta.juegos.forEach(juego => {
            const label = document.createElement('label');
            label.className = 'flex items-center space-x-2 cursor-pointer';
            label.innerHTML = `
                <input type="checkbox" class="juego-checkbox" value="${juego.id}" data-peso="${juego.peso_gb}">
                <span class="text-sm">${juego.nombre} (${juego.peso_gb}GB)</span>
            `;
            checklist.appendChild(label);
        });
    } catch (error) {
        mostrarNotificacion('Error al cargar juegos: ' + error.mensaje, 'error');
    }
}

/**
 * Cierra el modal de trabajo
 */
function cerrarModalTrabajo() {
    document.getElementById('modal-trabajo').classList.add('hidden');
    document.getElementById('form-trabajo').reset();
}

/**
 * Cambia el estado de un trabajo
 */
async function cambiarEstadoTrabajo(trabajoId, nuevoEstado) {
    try {
        await cambiarEstadoTrabajoAPI(trabajoId, nuevoEstado);
        mostrarNotificacion('Estado del trabajo actualizado', 'exito');
        
        // Recargar datos
        await cargarTrabajosPendientes();
        await cargarHistorialTrabajos();
        
    } catch (error) {
        mostrarNotificacion('Error: ' + error.mensaje, 'error');
    }
}

/**
 * Configura los eventos del empleado
 */
function configurarEventosEmpleado() {
    // Cerrar modal
    document.getElementById('cerrar-modal').addEventListener('click', cerrarModalTrabajo);
    
    // Enviar formulario de trabajo
    document.getElementById('form-trabajo').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const modal = document.getElementById('modal-trabajo');
        const clienteId = modal.dataset.clienteId;
        const usuario = obtenerUsuario();
        
        // Obtener juegos seleccionados
        const juegosSeleccionados = Array.from(document.querySelectorAll('.juego-checkbox:checked'))
            .map(checkbox => checkbox.value);
        
        if (juegosSeleccionados.length === 0) {
            mostrarNotificacion('Por favor selecciona al menos un juego', 'advertencia');
            return;
        }
        
        const datosTrabajo = {
            cliente_id: clienteId,
            empleado_id: usuario.id,
            tipo_servicio: document.getElementById('tipo-servicio').value,
            juegos_instalados: juegosSeleccionados,
            descripcion: document.getElementById('descripcion-trabajo').value,
            costo: parseFloat(document.getElementById('costo').value) || 0
        };
        
        try {
            mostrarCarga(true);
            await crearTrabajoAPI(datosTrabajo);
            mostrarCarga(false);
            
            mostrarNotificacion('Trabajo registrado exitosamente', 'exito');
            cerrarModalTrabajo();
            
            // Recargar datos
            await cargarTrabajosPendientes();
            await cargarHistorialTrabajos();
            
        } catch (error) {
            mostrarCarga(false);
            mostrarNotificacion('Error: ' + error.mensaje, 'error');
        }
    });
}

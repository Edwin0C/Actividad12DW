/**
 * admin_dashboard.js - Lógica del panel administrativo
 */

// Variables globales para filtrado
let todosLosTrabajos = [];
let todosLosUsuarios = [];
let todosLosJuegos = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    if (!verificarAutenticacion()) return;
    if (!requerirRol('administrador')) return;
    
    // Configurar logout
    configurarLogout();
    
    // Cargar datos
    await cargarEstadisticas();
    await cargarUsuarios();
    await cargarJuegos();
    await cargarTrabajos();
    
    // Configurar eventos
    configurarEventosAdmin();
    configurarTabs();
    configurarFiltros();
    
    // Comentar el refresh automático - el usuario recargará manualmente cuando lo necesite
    // setInterval(async () => {
    //     await cargarEstadisticas();
    //     await cargarTrabajos();
    // }, 60000);
});

// Función para cambiar entre tabs desde los cuadros de estadísticas
function cambiarTab(tabName) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Remover clase active de todos los botones y ocultar todos los tabs
    tabBtns.forEach(b => {
        b.classList.remove('border-b-purple-500', 'text-purple-400');
        b.classList.add('border-transparent');
    });
    tabContents.forEach(tab => tab.classList.add('hidden'));
    
    // Mostrar la sección seleccionada
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
    }
    
    // Cargar datos según la sección
    switch(tabName) {
        case 'usuarios':
            cargarUsuarios();
            break;
        case 'juegos':
            cargarJuegos();
            break;
        case 'trabajos':
            cargarTrabajos();
            break;
    }
}
/**
 * Carga estadísticas del sistema
 */
async function cargarEstadisticas() {
    try {
        const statsUsuarios = await obtenerEstadisticasUsuariosAPI();
        const statsJuegos = await obtenerEstadisticasJuegosAPI();
        const statsTrabajo = await obtenerEstadisticasTrabajoAPI();
        
        document.getElementById('stat-usuarios').textContent = statsUsuarios.total_usuarios;
        document.getElementById('stat-juegos').textContent = statsJuegos.total_juegos;
        document.getElementById('stat-trabajos').textContent = statsTrabajo.completados;
        document.getElementById('stat-ingresos').textContent = formatearDinero(statsTrabajo.ingresos_total);
        
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

/**
 * Carga la lista de usuarios
 */
async function cargarUsuarios() {
    try {
        const respuesta = await obtenerTodosUsuariosAPI();
        // Filtrar: excluir al administrador de la lista
        todosLosUsuarios = respuesta.usuarios.filter(u => u.rol !== 'administrador');
        
        // Aplicar filtros y ordenamiento
        aplicarFiltrosUsuarios();
        
    } catch (error) {
        mostrarNotificacion('Error al cargar usuarios: ' + error.mensaje, 'error');
    }
}

/**
 * Aplica filtros y ordenamiento a la lista de usuarios
 */
function aplicarFiltrosUsuarios() {
    const busqueda = document.getElementById('buscar-usuario')?.value.toLowerCase() || '';
    const filtroEstado = document.getElementById('filtro-estado-usuario')?.value || '';
    const orden = document.getElementById('filtro-orden-nombre')?.value || '';
    
    // Filtrar usuarios
    let usuariosFiltrados = todosLosUsuarios.filter(usuario => {
        // Filtro por búsqueda (nombre de usuario o nombre completo)
        if (busqueda) {
            const coincideNombreUsuario = usuario.nombre_usuario.toLowerCase().includes(busqueda);
            const coincideNombre = usuario.nombre_completo.toLowerCase().includes(busqueda);
            if (!coincideNombreUsuario && !coincideNombre) {
                return false;
            }
        }
        
        // Filtro por estado
        if (filtroEstado && usuario.estado !== filtroEstado) {
            return false;
        }
        
        return true;
    });
    
    // Ordenar usuarios por rol (empleado primero) y luego por nombre si aplica
    usuariosFiltrados.sort((a, b) => {
        // Primero: ordenar por rol (empleado > cliente)
        const rolOrder = { 'empleado': 0, 'cliente': 1 };
        const ordenA = rolOrder[a.rol] !== undefined ? rolOrder[a.rol] : 99;
        const ordenB = rolOrder[b.rol] !== undefined ? rolOrder[b.rol] : 99;
        
        if (ordenA !== ordenB) {
            return ordenA - ordenB;
        }
        
        // Segundo: ordenar por nombre si se selecciona
        if (orden === 'asc') {
            return a.nombre_completo.localeCompare(b.nombre_completo);
        } else if (orden === 'desc') {
            return b.nombre_completo.localeCompare(a.nombre_completo);
        }
        
        return 0;
    });
    
    // Renderizar usuarios filtrados
    renderizarUsuarios(usuariosFiltrados);
}

/**
 * Renderiza los usuarios en la tabla
 */
function renderizarUsuarios(usuarios) {
    const tbody = document.getElementById('usuarios-tbody');
    tbody.innerHTML = '';
    
    if (!usuarios || usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-gray-400">No hay usuarios que coincidan con los filtros</td></tr>';
        document.getElementById('usuarios-contador').textContent = 'Mostrando 0 usuarios';
        return;
    }
    
    usuarios.forEach(usuario => {
        const fila = document.createElement('tr');
        const colorEstado = usuario.estado === 'activo' ? 'green' : 'red';
        const textoBtnEstado = usuario.estado === 'activo' ? 'Desactivar' : 'Activar';
        const colorBtnEstado = usuario.estado === 'activo' ? 'red' : 'green';
        const rolBadge = usuario.rol === 'empleado' ? 
            '<span class="px-2 py-1 rounded text-xs font-bold bg-orange-900 text-orange-300">💼 EMPLEADO</span>' :
            '<span class="px-2 py-1 rounded text-xs font-bold bg-blue-900 text-blue-300">👤 CLIENTE</span>';
        
        fila.innerHTML = `
            <td class="px-4 py-2 font-bold text-purple-300">${usuario.nombre_usuario}</td>
            <td class="px-4 py-2">${usuario.nombre_completo}</td>
            <td class="px-4 py-2 text-sm text-gray-400">${usuario.email}</td>
            <td class="px-4 py-2">
                ${rolBadge}
            </td>
            <td class="px-4 py-2">
                <span class="px-2 py-1 rounded text-xs font-bold bg-${colorEstado}-900 text-${colorEstado}-300">
                    ${usuario.estado.toUpperCase()}
                </span>
            </td>
            <td class="px-4 py-2 space-x-2 flex flex-wrap gap-1">
                <button class="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700 transition font-bold"
                        onclick="abrirModalEditarUsuario('${usuario.id}')">
                    ✏️ Editar
                </button>
                <button class="px-2 py-1 bg-${colorBtnEstado}-600 rounded text-xs hover:bg-${colorBtnEstado}-700 transition font-bold"
                        onclick="cambiarEstadoUsuario('${usuario.id}', '${usuario.estado}')">
                    ${textoBtnEstado}
                </button>
                <button class="px-2 py-1 bg-red-700 rounded text-xs hover:bg-red-800 transition font-bold"
                        onclick="eliminarUsuarioPermanente('${usuario.id}', '${usuario.nombre_usuario}')">
                    🗑️ Eliminar
                </button>
            </td>
        `;
        tbody.appendChild(fila);
    });
    
    // Actualizar contador
    document.getElementById('usuarios-contador').textContent = `Mostrando ${usuarios.length} usuarios`;
}

/**
 * Cambia el estado de un usuario (activo <-> inactivo)
 */
async function cambiarEstadoUsuario(usuarioId, estadoActual) {
    try {
        const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
        const confirmacion = confirm(`¿Deseas ${nuevoEstado === 'activo' ? 'activar' : 'desactivar'} este usuario?`);
        
        if (!confirmacion) return;
        
        mostrarCarga(true);
        await cambiarEstadoUsuarioAPI(usuarioId, nuevoEstado);
        mostrarCarga(false);
        
        mostrarNotificacion(`Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`, 'exito');
        await cargarUsuarios();
        
    } catch (error) {
        mostrarCarga(false);
        console.error('[ERROR] Error al cambiar estado:', error);
        mostrarNotificacion('Error: ' + (error.mensaje || 'No se pudo cambiar el estado'), 'error');
    }
}

/**
 * Elimina un usuario y todos sus datos asociados
 */
async function eliminarUsuarioPermanente(usuarioId, nombreUsuario) {
    try {
        const confirmacion = confirm(`⚠️ ¿Estás seguro? Esto eliminará a "${nombreUsuario}" y TODOS sus datos (solicitudes, registros, etc.). Esta acción no se puede deshacer.`);
        
        if (!confirmacion) return;
        
        const confirmacion2 = confirm('Esta es la última oportunidad para cancelar. ¿Continuar con la eliminación?');
        if (!confirmacion2) return;
        
        mostrarCarga(true);
        await eliminarUsuarioAPI(usuarioId);
        mostrarCarga(false);
        
        mostrarNotificacion('Usuario eliminado correctamente', 'exito');
        await cargarUsuarios();
        await cargarEstadisticas();
        
    } catch (error) {
        mostrarCarga(false);
        console.error('[ERROR] Error al eliminar usuario:', error);
        mostrarNotificacion('Error: ' + (error.mensaje || 'No se pudo eliminar el usuario'), 'error');
    }
}

// Variables para paginación de juegos
let paginaActualJuegos = 1;
const JUEGOS_POR_PAGINA = 4;
let juegosFiltrados = [];
let juegoEnEdicion = null;

/**
 * Carga la lista de juegos
 */
async function cargarJuegos() {
    try {
        const respuesta = await obtenerTodosJuegosAPI();
        todosLosJuegos = respuesta.juegos; // Guardar en variable global
        paginaActualJuegos = 1;
        
        // Aplicar filtros
        aplicarFiltrosJuegos();
        
        // Configurar listeners de paginación y filtros
        configurarEventosJuegos();
        
    } catch (error) {
        mostrarNotificacion('Error al cargar juegos: ' + error.mensaje, 'error');
    }
}

/**
 * Aplica filtros a la lista de juegos
 */
function aplicarFiltrosJuegos() {
    const busqueda = document.getElementById('buscar-juego-admin')?.value.toLowerCase() || '';
    const consola = document.getElementById('filtro-consola-juego')?.value || '';
    
    juegosFiltrados = todosLosJuegos.filter(juego => {
        // Filtro por búsqueda
        if (busqueda && !juego.nombre.toLowerCase().includes(busqueda)) {
            return false;
        }
        
        // Filtro por consola
        if (consola && juego.consola !== consola) {
            return false;
        }
        
        return true;
    });
    
    paginaActualJuegos = 1;
    renderizarJuegos();
}

/**
 * Renderiza los juegos de la página actual
 */
function renderizarJuegos() {
    const inicio = (paginaActualJuegos - 1) * JUEGOS_POR_PAGINA;
    const fin = inicio + JUEGOS_POR_PAGINA;
    const juegosPagina = juegosFiltrados.slice(inicio, fin);
    
    const contenedor = document.getElementById('juegos-lista');
    contenedor.innerHTML = '';
    
    if (juegosFiltrados.length === 0) {
        contenedor.innerHTML = '<p class="col-span-full text-center text-gray-400">No hay juegos que coincidan con los filtros</p>';
        document.getElementById('paginacion-juegos').style.display = 'none';
        document.getElementById('juegos-contador').textContent = 'Mostrando 0 juegos';
        return;
    }
    
    // Mostrar controles de paginación si hay múltiples páginas
    const totalPaginas = Math.ceil(juegosFiltrados.length / JUEGOS_POR_PAGINA);
    document.getElementById('paginacion-juegos').style.display = totalPaginas > 1 ? 'flex' : 'none';
    
    juegosPagina.forEach(juego => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'bg-gray-700 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition transform hover:scale-105';
        
        // Determinar color y texto del botón de disponibilidad
        const btnDisponibilidad = juego.disponible 
            ? '<button class="px-2 py-1 bg-green-600 hover:bg-green-700 text-xs font-bold rounded transition" onclick="cambiarDisponibilidadJuego(\'' + juego.id + '\', false)">✓ Habilitado</button>'
            : '<button class="px-2 py-1 bg-red-600 hover:bg-red-700 text-xs font-bold rounded transition" onclick="cambiarDisponibilidadJuego(\'' + juego.id + '\', true)">✗ Deshabilitado</button>';
        
        tarjeta.innerHTML = `
            <div class="relative">
                <img src="${juego.imagen_url}" alt="${juego.nombre}" class="w-full h-40 object-cover">
                <div class="absolute top-2 right-2 bg-gray-900 px-2 py-1 rounded text-xs font-bold text-purple-300">
                    ${juego.consola}
                </div>
            </div>
            <div class="p-4">
                <p class="font-bold text-sm mb-1 truncate">${juego.nombre}</p>
                <p class="text-xs text-gray-400 mb-3">${juego.peso_gb}GB • ${juego.disponible ? '🟢 Disponible' : '🔴 No disponible'}</p>
                <div class="space-y-2">
                    ${btnDisponibilidad}
                    <button class="w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded transition"
                            onclick="abrirModalEditarJuego('${juego.id}')">
                        ✏️ Editar
                    </button>
                    <button class="w-full px-2 py-1 bg-red-700 hover:bg-red-800 text-xs font-bold rounded transition"
                            onclick="eliminarJuegoDefinitivo('${juego.id}', '${juego.nombre}')">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
        contenedor.appendChild(tarjeta);
    });
    
    // Actualizar info de paginación
    const totalJuegos = juegosFiltrados.length;
    document.getElementById('info-paginacion').textContent = `Página ${paginaActualJuegos} de ${totalPaginas}`;
    document.getElementById('juegos-contador').textContent = `Mostrando ${juegosPagina.length} de ${totalJuegos} juegos`;
    
    // Actualizar estado de botones de paginación
    document.getElementById('btn-pagina-anterior').disabled = paginaActualJuegos === 1;
    document.getElementById('btn-pagina-siguiente').disabled = paginaActualJuegos === totalPaginas;
}

/**
 * Cambia la disponibilidad de un juego (habilitar/deshabilitar)
 */
async function cambiarDisponibilidadJuego(juegoId, disponible) {
    try {
        const estado = disponible ? 'habilitado' : 'deshabilitado';
        mostrarCarga(true);
        await cambiarDisponibilidadJuegoAPI(juegoId, disponible);
        mostrarCarga(false);
        
        mostrarNotificacion(`Juego ${estado}`, 'exito');
        await cargarJuegos();
        
    } catch (error) {
        mostrarCarga(false);
        mostrarNotificacion('Error: ' + (error.mensaje || 'No se pudo cambiar la disponibilidad'), 'error');
    }
}

/**
 * Elimina un juego definitivamente
 */
async function eliminarJuegoDefinitivo(juegoId, nombreJuego) {
    try {
        const confirmacion = confirm(`⚠️ ¿Estás seguro de que quieres eliminar "${nombreJuego}"?`);
        if (!confirmacion) return;
        
        mostrarCarga(true);
        await eliminarJuegoAPI(juegoId);
        mostrarCarga(false);
        
        mostrarNotificacion('Juego eliminado correctamente', 'exito');
        await cargarJuegos();
        await cargarEstadisticas();
        
    } catch (error) {
        mostrarCarga(false);
        mostrarNotificacion('Error: ' + (error.mensaje || 'No se pudo eliminar el juego'), 'error');
    }
}

/**
 * Abre modal para editar un juego existente
 */
async function abrirModalEditarJuego(juegoId) {
    try {
        const juego = todosLosJuegos.find(j => j.id === juegoId);
        
        if (!juego) {
            mostrarNotificacion('Juego no encontrado', 'error');
            return;
        }
        
        juegoEnEdicion = juego;
        
        // Llenar el formulario
        document.getElementById('juego-nombre').value = juego.nombre;
        document.getElementById('juego-consola').value = juego.consola;
        document.getElementById('juego-peso').value = juego.peso_gb;
        document.getElementById('juego-descripcion').value = juego.descripcion || '';
        document.getElementById('juego-imagen').value = juego.imagen_url || '';
        
        // Actualizar modal
        const modal = document.getElementById('modal-juego');
        const titulo = modal.querySelector('h3');
        titulo.textContent = `Editar Juego: ${juego.nombre}`;
        
        const btnSubmit = modal.querySelector('button[type="submit"]');
        btnSubmit.textContent = 'Guardar Cambios';
        
        // Mostrar modal
        modal.classList.remove('hidden');
        
    } catch (error) {
        console.error('[ERROR] Error al abrir modal de edición:', error);
        mostrarNotificacion('Error al cargar datos del juego', 'error');
    }
}

/**
 * Configura los eventos de juegos
 */
function configurarEventosJuegos() {
    // Filtros
    const buscarJuego = document.getElementById('buscar-juego-admin');
    const filtroConsola = document.getElementById('filtro-consola-juego');
    const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros-juegos');
    
    if (buscarJuego) {
        buscarJuego.removeEventListener('input', aplicarFiltrosJuegos);
        buscarJuego.addEventListener('input', aplicarFiltrosJuegos);
    }
    
    if (filtroConsola) {
        filtroConsola.removeEventListener('change', aplicarFiltrosJuegos);
        filtroConsola.addEventListener('change', aplicarFiltrosJuegos);
    }
    
    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.removeEventListener('click', () => {});
        btnLimpiarFiltros.addEventListener('click', () => {
            if (buscarJuego) buscarJuego.value = '';
            if (filtroConsola) filtroConsola.value = '';
            aplicarFiltrosJuegos();
        });
    }
    
    // Paginación
    const btnAnterior = document.getElementById('btn-pagina-anterior');
    const btnSiguiente = document.getElementById('btn-pagina-siguiente');
    
    if (btnAnterior) {
        btnAnterior.removeEventListener('click', () => {});
        btnAnterior.addEventListener('click', () => {
            if (paginaActualJuegos > 1) {
                paginaActualJuegos--;
                renderizarJuegos();
            }
        });
    }
    
    if (btnSiguiente) {
        btnSiguiente.removeEventListener('click', () => {});
        btnSiguiente.addEventListener('click', () => {
            const totalPaginas = Math.ceil(juegosFiltrados.length / JUEGOS_POR_PAGINA);
            if (paginaActualJuegos < totalPaginas) {
                paginaActualJuegos++;
                renderizarJuegos();
            }
        });
    }
}

/**
 * Convierte el código de estado a texto legible
 */
function formatearEstado(estado) {
    const estados = {
        'pendiente': 'PENDIENTE',
        'en_progreso': 'EN PROCESO',
        'completado': 'COMPLETADO',
        'cancelado': 'ANULADO'
    };
    return estados[estado] || estado.toUpperCase();
}

/**
 * Carga el historial de trabajos
 */
async function cargarTrabajos() {
    try {
        const respuesta = await obtenerTodosTrabajoAPI();
        
        // Guardar en variable global para filtros
        todosLosTrabajos = respuesta.registros || [];
        
        // Si no hay trabajos
        if (!todosLosTrabajos || todosLosTrabajos.length === 0) {
            document.getElementById('trabajos-lista').innerHTML = '<p class="text-gray-400 text-center py-4">No hay trabajos registrados</p>';
            return;
        }
        
        // Renderizar todos los trabajos
        renderizarTrabajos(todosLosTrabajos);
        
    } catch (error) {
        console.error('Error al cargar trabajos:', error);
        document.getElementById('trabajos-lista').innerHTML = '<p class="text-red-400">Error al cargar trabajos</p>';
    }
}

/**
 * Abre modal para crear usuario
 */
function abrirModalUsuario() {
    document.getElementById('modal-usuario').classList.remove('hidden');
    document.getElementById('modal-usuario-titulo').textContent = 'Crear Nuevo Usuario';
    document.getElementById('form-usuario').reset();
    document.getElementById('form-usuario-id').value = '';
    document.getElementById('form-usuario-contraseña').required = true;
    document.getElementById('btn-form-usuario-submit').textContent = 'Crear';
}

/**
 * Cierra modal de usuario
 */
function cerrarModalUsuario() {
    document.getElementById('modal-usuario').classList.add('hidden');
    document.getElementById('form-usuario').reset();
    document.getElementById('form-usuario-id').value = '';
}

/**
 * Abre modal para editar un usuario existente
 */
async function abrirModalEditarUsuario(usuarioId) {
    try {
        // Encontrar el usuario en la lista global
        const usuario = todosLosUsuarios.find(u => u.id === usuarioId);
        
        if (!usuario) {
            mostrarNotificacion('Usuario no encontrado', 'error');
            return;
        }
        
        // Llenar el formulario con los datos del usuario
        document.getElementById('form-usuario-id').value = usuario.id;
        document.getElementById('form-usuario-nombre').value = usuario.nombre_usuario;
        document.getElementById('form-usuario-email').value = usuario.email;
        document.getElementById('form-usuario-nombre-completo').value = usuario.nombre_completo;
        document.getElementById('form-usuario-telefono').value = usuario.telefono || '';
        document.getElementById('form-usuario-rol').value = usuario.rol;
        document.getElementById('form-usuario-contraseña').value = '';
        document.getElementById('form-usuario-contraseña').required = false;
        
        // Actualizar modal
        document.getElementById('modal-usuario-titulo').textContent = `Editar Usuario: ${usuario.nombre_usuario}`;
        document.getElementById('btn-form-usuario-submit').textContent = 'Guardar Cambios';
        
        // Deshabilitar cambio de nombre de usuario en edición
        document.getElementById('form-usuario-nombre').disabled = true;
        
        // Abrir modal
        document.getElementById('modal-usuario').classList.remove('hidden');
        
    } catch (error) {
        console.error('[ERROR] Error al abrir modal de edición:', error);
        mostrarNotificacion('Error al cargar datos del usuario', 'error');
    }
}

/**
 * Abre modal para crear juego
 */
function abrirModalJuego() {
    juegoEnEdicion = null;
    
    // Limpiar formulario
    document.getElementById('form-juego').reset();
    
    // Actualizar modal
    const modal = document.getElementById('modal-juego');
    const titulo = modal.querySelector('h3');
    titulo.textContent = 'Agregar Nuevo Juego';
    
    const btnSubmit = modal.querySelector('button[type="submit"]');
    btnSubmit.textContent = 'Guardar';
    
    // Mostrar modal
    modal.classList.remove('hidden');
}

/**
 * Cierra modal de juego
 */
function cerrarModalJuego() {
    document.getElementById('modal-juego').classList.add('hidden');
    document.getElementById('form-juego').reset();
    juegoEnEdicion = null;
}

/**
 * Elimina un usuario
 */
async function eliminarUsuario(usuarioId) {
    if (!confirm('¿Estás seguro de que quieres desactivar este usuario?')) return;
    
    try {
        await cambiarEstadoUsuarioAPI(usuarioId, 'inactivo');
        mostrarNotificacion('Usuario desactivado', 'exito');
        await cargarUsuarios();
    } catch (error) {
        mostrarNotificacion('Error: ' + error.mensaje, 'error');
    }
}

/**
 * Configura los tabs de navegación
 */
function configurarTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            
            // Remover clase active de todos los botones y ocultar todos los tabs
            tabBtns.forEach(b => {
                b.classList.remove('border-b-purple-500', 'text-purple-400');
                b.classList.add('border-transparent');
            });
            tabContents.forEach(tab => tab.classList.add('hidden'));
            
            // Activar botón y mostrar tab seleccionado
            btn.classList.add('border-b-purple-500', 'text-purple-400');
            btn.classList.remove('border-transparent');
            document.getElementById(`${tabName}-tab`).classList.remove('hidden');
        });
    });
    
    // Activar primer tab por defecto
    if (tabBtns.length > 0) {
        tabBtns[0].click();
    }
}

/**
 * Configura los eventos del admin
 */
function configurarEventosAdmin() {
    // Botones de creación
    document.getElementById('btn-crear-usuario').addEventListener('click', abrirModalUsuario);
    document.getElementById('btn-crear-juego').addEventListener('click', abrirModalJuego);
    
    // Cerrar modales
    document.getElementById('cerrar-modal-usuario').addEventListener('click', cerrarModalUsuario);
    document.getElementById('cerrar-modal-juego').addEventListener('click', cerrarModalJuego);
    document.getElementById('cerrar-modal-trabajo').addEventListener('click', cerrarModalTrabajo);
    
    // Modal de trabajo - Registrar pago
    const btnRegistrarPago = document.getElementById('btn-registrar-pago');
    if (btnRegistrarPago) {
        btnRegistrarPago.addEventListener('click', async () => {
            const monto = document.getElementById('trabajo-monto-pago').value;
            if (monto) {
                await registrarPagoTrabajo(monto);
            }
        });
    }
    
    // Modal de trabajo - Pago completo
    const btnPagoCompleto = document.getElementById('btn-pago-completo');
    if (btnPagoCompleto) {
        btnPagoCompleto.addEventListener('click', async () => {
            const trabajoId = document.getElementById('trabajo-id-oculto').value;
            const trabajo = todosLosTrabajos.find(t => t.id === trabajoId);
            
            if (trabajo) {
                const saldoPendiente = (trabajo.costo || 0) - (trabajo.monto_pagado || 0);
                if (saldoPendiente > 0) {
                    await registrarPagoTrabajo(saldoPendiente);
                } else {
                    mostrarNotificacion('El trabajo ya está completamente pagado', 'info');
                }
            }
        });
    }
    
    // Modal de trabajo - Asignar deuda total
    const btnAsignarDeuda = document.getElementById('btn-asignar-deuda');
    if (btnAsignarDeuda) {
        btnAsignarDeuda.addEventListener('click', async () => {
            await asignarDeudaTotalTrabajo();
        });
    }
    
    // Modal de trabajo - Limpiar historial de pagos
    const btnLimpiarPagos = document.getElementById('btn-limpiar-pagos');
    if (btnLimpiarPagos) {
        btnLimpiarPagos.addEventListener('click', async () => {
            await limpiarHistorialPagosTrabajo();
        });
    }
    
    // Modal de trabajo - Formulario
    document.getElementById('form-trabajo-pago').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const trabajoId = document.getElementById('trabajo-id-oculto').value;
        const nuevoEstado = document.getElementById('trabajo-nuevo-estado').value;
        
        if (!nuevoEstado) {
            mostrarNotificacion('Selecciona un nuevo estado', 'advertencia');
            return;
        }
        
        try {
            mostrarCarga(true);
            await cambiarEstadoTrabajoAPI(trabajoId, nuevoEstado);
            mostrarCarga(false);
            
            mostrarNotificacion(`Estado cambiado a ${nuevoEstado}`, 'exito');
            await cargarTrabajos();
            cerrarModalTrabajo();
            
        } catch (error) {
            mostrarCarga(false);
            mostrarNotificacion('Error al cambiar estado: ' + error.mensaje, 'error');
        }
    });
    
    // Filtros de usuarios
    const buscarUsuario = document.getElementById('buscar-usuario');
    const filtroOrden = document.getElementById('filtro-orden-nombre');
    const filtroEstado = document.getElementById('filtro-estado-usuario');
    const btnLimpiar = document.getElementById('btn-limpiar-filtros');
    
    if (buscarUsuario) {
        buscarUsuario.addEventListener('input', aplicarFiltrosUsuarios);
    }
    if (filtroOrden) {
        filtroOrden.addEventListener('change', aplicarFiltrosUsuarios);
    }
    if (filtroEstado) {
        filtroEstado.addEventListener('change', aplicarFiltrosUsuarios);
    }
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', () => {
            if (buscarUsuario) buscarUsuario.value = '';
            if (filtroOrden) filtroOrden.value = '';
            if (filtroEstado) filtroEstado.value = '';
            aplicarFiltrosUsuarios();
        });
    }
    
    // Formulario de usuario
    document.getElementById('form-usuario').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const usuarioId = document.getElementById('form-usuario-id').value;
        const esEdicion = !!usuarioId;
        
        const datosUsuario = {
            nombre_usuario: document.getElementById('form-usuario-nombre').value,
            email: document.getElementById('form-usuario-email').value,
            nombre_completo: document.getElementById('form-usuario-nombre-completo').value,
            telefono: document.getElementById('form-usuario-telefono').value,
            rol: document.getElementById('form-usuario-rol').value
        };
        
        // Solo agregar contraseña si no está vacía
        const contraseña = document.getElementById('form-usuario-contraseña').value;
        if (contraseña) {
            datosUsuario.contraseña = contraseña;
        }
        
        console.log('[DEBUG] Datos a enviar:', datosUsuario, 'Edición:', esEdicion);
        
        try {
            mostrarCarga(true);
            
            if (esEdicion) {
                // Editar usuario existente
                await editarUsuarioAPI(usuarioId, datosUsuario);
                mostrarCarga(false);
                mostrarNotificacion('Usuario actualizado exitosamente', 'exito');
            } else {
                // Crear nuevo usuario
                if (!datosUsuario.contraseña) {
                    mostrarCarga(false);
                    mostrarNotificacion('La contraseña es requerida para crear un usuario', 'error');
                    return;
                }
                const resultado = await crearUsuarioAPI(datosUsuario);
                mostrarCarga(false);
                console.log('[DEBUG] Usuario creado exitosamente:', resultado);
                mostrarNotificacion('Usuario creado exitosamente', 'exito');
            }
            
            cerrarModalUsuario();
            // Rehabilitar el campo de nombre de usuario
            document.getElementById('form-usuario-nombre').disabled = false;
            await cargarUsuarios();
            await cargarEstadisticas();
            
        } catch (error) {
            mostrarCarga(false);
            console.error('[ERROR] Error:', error);
            mostrarNotificacion('Error: ' + error.mensaje, 'error');
        }
    });
    
    // Formulario de juego
    document.getElementById('form-juego').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const datosJuego = {
            nombre: document.getElementById('juego-nombre').value,
            consola: document.getElementById('juego-consola').value,
            peso_gb: parseFloat(document.getElementById('juego-peso').value),
            descripcion: document.getElementById('juego-descripcion').value,
            imagen_url: document.getElementById('juego-imagen').value
        };
        
        try {
            mostrarCarga(true);
            
            if (juegoEnEdicion) {
                // Editar juego existente
                await actualizarJuegoAPI(juegoEnEdicion.id, datosJuego);
                mostrarCarga(false);
                mostrarNotificacion('Juego actualizado exitosamente', 'exito');
            } else {
                // Crear nuevo juego
                await crearJuegoAPI(datosJuego);
                mostrarCarga(false);
                mostrarNotificacion('Juego agregado exitosamente', 'exito');
            }
            
            cerrarModalJuego();
            await cargarJuegos();
            await cargarEstadisticas();
            
        } catch (error) {
            mostrarCarga(false);
            mostrarNotificacion('Error: ' + (error.mensaje || error), 'error');
        }
    });
}

/**
 * Configura los filtros de trabajos
 */
function configurarFiltros() {
    const filtroEstado = document.getElementById('filtro-estado');
    const filtroTipo = document.getElementById('filtro-tipo');
    const buscarCliente = document.getElementById('buscar-cliente');
    const btnRefrescar = document.getElementById('btn-refrescar-trabajos');
    
    // Filtrar cuando cambia cualquier filtro
    [filtroEstado, filtroTipo, buscarCliente].forEach(elemento => {
        if (elemento) {
            elemento.addEventListener('change', aplicarFiltros);
            elemento.addEventListener('input', aplicarFiltros);
        }
    });
    
    // Botón de refrescar
    if (btnRefrescar) {
        btnRefrescar.addEventListener('click', async () => {
            btnRefrescar.disabled = true;
            btnRefrescar.textContent = '⏳ Cargando...';
            await cargarTrabajos();
            btnRefrescar.disabled = false;
            btnRefrescar.textContent = '🔄 Refrescar';
        });
    }
}

/**
 * Aplica los filtros a la lista de trabajos
 */
function aplicarFiltros() {
    const filtroEstado = document.getElementById('filtro-estado')?.value || '';
    const filtroTipo = document.getElementById('filtro-tipo')?.value || '';
    const buscarCliente = document.getElementById('buscar-cliente')?.value.toLowerCase() || '';
    
    const trabajosFiltrados = todosLosTrabajos.filter(trabajo => {
        // Filtrar por estado
        if (filtroEstado && trabajo.estado !== filtroEstado) {
            return false;
        }
        
        // Filtrar por tipo
        if (filtroTipo && trabajo.tipo_servicio !== filtroTipo) {
            return false;
        }
        
        // Filtrar por cliente (nombre o email)
        if (buscarCliente) {
            const cliente = todosLosUsuarios.find(u => u.id === trabajo.cliente_id);
            if (!cliente) return false;
            
            const nombreMatch = cliente.nombre_completo.toLowerCase().includes(buscarCliente);
            const emailMatch = cliente.email.toLowerCase().includes(buscarCliente);
            
            if (!nombreMatch && !emailMatch) {
                return false;
            }
        }
        
        return true;
    });
    
    // Renderizar trabajos filtrados
    renderizarTrabajos(trabajosFiltrados);
}

/**
 * Renderiza los trabajos en la lista
 */
function renderizarTrabajos(trabajos) {
    const contenedor = document.getElementById('trabajos-lista');
    contenedor.innerHTML = '';
    
    if (!trabajos || trabajos.length === 0) {
        contenedor.innerHTML = '<p class="text-gray-400 text-center py-4">No hay trabajos que coincidan con los filtros</p>';
        return;
    }
    
    // Crear mapa de juegos para búsqueda rápida
    const juegosMap = {};
    todosLosJuegos.forEach(juego => {
        juegosMap[juego.id] = juego;
    });
    
    trabajos.forEach(trabajo => {
        const tarjeta = document.createElement('div');
        
        // Obtener nombre del cliente
        const cliente = todosLosUsuarios.find(u => u.id === trabajo.cliente_id);
        const nombreCliente = cliente ? cliente.nombre_completo : 'Cliente desconocido';
        const emailCliente = cliente ? cliente.email : 'N/A';
        
        // Construir descripción con nombres de juegos y GB
        let descripcionDetallada = trabajo.descripcion || 'Sin descripción';
        if (trabajo.juegos_instalados && trabajo.juegos_instalados.length > 0) {
            const juegosDetallados = trabajo.juegos_instalados.map(juegoId => {
                const juego = juegosMap[juegoId] || juegosMap[Object.keys(juegosMap).find(key => juegosMap[key]._id === juegoId)];
                return juego ? `${juego.nombre} (${juego.peso_gb}GB)` : 'Juego desconocido';
            });
            descripcionDetallada = juegosDetallados.join(', ');
        }
        
        // Obtener color del estado
        const estadoColores = {
            'pendiente': 'bg-yellow-900 text-yellow-300',
            'en_progreso': 'bg-blue-900 text-blue-300',
            'completado': 'bg-green-900 text-green-300',
            'cancelado': 'bg-red-900 text-red-300'
        };
        const colorEstado = estadoColores[trabajo.estado] || 'bg-gray-700 text-gray-300';
        
        // Información de pago
        const montoPagado = trabajo.monto_pagado || 0;
        const saldoPendiente = trabajo.saldo_pendiente || (trabajo.costo - montoPagado);
        const completamentePagado = trabajo.completamente_pagado || montoPagado >= trabajo.costo;
        
        const indicadorPago = completamentePagado 
            ? '<span class="px-2 py-1 bg-green-900 text-green-300 rounded text-xs font-bold">✓ Pagado</span>'
            : `<span class="px-2 py-1 bg-orange-900 text-orange-300 rounded text-xs font-bold">⚠️ Deuda: ${formatearDinero(saldoPendiente)}</span>`;
        
        tarjeta.className = 'bg-gray-700 rounded-lg p-4 border-l-4 border-purple-500 hover:bg-gray-650 transition';
        tarjeta.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div>
                    <p class="font-bold text-purple-300">${trabajo.tipo_servicio.toUpperCase()}</p>
                    <p class="text-sm text-gray-400">${formatearFecha(trabajo.fecha_creacion)}</p>
                </div>
                <span class="px-3 py-1 rounded text-xs font-bold ${colorEstado}">
                    ${formatearEstado(trabajo.estado)}
                </span>
            </div>
            
            <div class="mb-3 pb-3 border-b border-gray-600">
                <p class="text-sm text-gray-300 mb-1"><strong>👤 Cliente:</strong> ${nombreCliente}</p>
                <p class="text-xs text-gray-400">📧 ${emailCliente}</p>
            </div>
            
            <div class="mb-3">
                <p class="text-sm text-gray-300 mb-2"><strong>📀 Juegos:</strong> ${descripcionDetallada}</p>
                <p class="text-sm text-gray-400">💾 ${trabajo.total_gb ? trabajo.total_gb.toFixed(1) + 'GB' : 'N/A'} en ${trabajo.consola || 'Desconocida'}</p>
            </div>

            <div class="grid grid-cols-2 gap-2 mb-3 bg-gray-600 p-2 rounded">
                <div>
                    <p class="text-xs text-gray-400">Costo Total:</p>
                    <p class="text-sm font-bold text-purple-300">${formatearDinero(trabajo.costo || 0)}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-400">Estado Pago:</p>
                    <p>${indicadorPago}</p>
                </div>
            </div>
            
            <button class="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded text-sm font-bold transition" 
                    onclick="abrirModalGestionarTrabajo('${trabajo.id}')">
                ⚙️ Gestionar Trabajo
            </button>
        `;
        contenedor.appendChild(tarjeta);
    });
}

/**
 * Abre el modal para gestionar un trabajo (estado y pagos)
 */
async function abrirModalGestionarTrabajo(trabajoId) {
    try {
        // Encontrar el trabajo
        const trabajo = todosLosTrabajos.find(t => t.id === trabajoId);
        if (!trabajo) {
            mostrarNotificacion('Trabajo no encontrado', 'error');
            return;
        }
        
        // Encontrar cliente
        const cliente = todosLosUsuarios.find(u => u.id === trabajo.cliente_id);
        const nombreCliente = cliente ? cliente.nombre_completo : 'Cliente desconocido';
        
        // Actualizar modal con datos del trabajo
        document.getElementById('trabajo-id-oculto').value = trabajoId;
        document.getElementById('trabajo-cliente').textContent = nombreCliente;
        document.getElementById('trabajo-tipo').textContent = trabajo.tipo_servicio === 'instalacion' ? 'Instalación' : 'Descarga';
        document.getElementById('trabajo-estado-actual').textContent = formatearEstado(trabajo.estado);
        document.getElementById('trabajo-costo-total').textContent = formatearDinero(trabajo.costo || 0);
        
        // Información de pago
        const montoPagado = trabajo.monto_pagado || 0;
        const saldoPendiente = (trabajo.costo || 0) - montoPagado;
        
        document.getElementById('trabajo-pagado').textContent = formatearDinero(montoPagado);
        document.getElementById('trabajo-pendiente').textContent = formatearDinero(Math.max(0, saldoPendiente));
        
        // Llenar historial de pagos
        const historialDiv = document.getElementById('pagos-historial');
        const pagos = trabajo.pagos || [];
        
        if (pagos.length === 0) {
            historialDiv.innerHTML = '<p class="text-gray-400 p-2">Sin pagos registrados aún</p>';
        } else {
            let html = '';
            pagos.forEach((pago, index) => {
                const fecha = new Date(pago.fecha).toLocaleDateString('es-ES');
                html += `<div class="bg-gray-700 p-2 mb-1 rounded">
                    <p class="text-gray-300">Pago ${index + 1}: <strong>${formatearDinero(pago.monto)}</strong></p>
                    <p class="text-gray-500 text-xs">${fecha}</p>
                </div>`;
            });
            historialDiv.innerHTML = html;
        }
        
        // Resetear formulario
        document.getElementById('trabajo-nuevo-estado').value = '';
        document.getElementById('trabajo-monto-pago').value = '';
        
        // Mostrar modal
        document.getElementById('modal-trabajo').classList.remove('hidden');
        
    } catch (error) {
        console.error('[ERROR]:', error);
        mostrarNotificacion('Error al abrir gestión de trabajo', 'error');
    }
}

/**
 * Cierra el modal de trabajo
 */
function cerrarModalTrabajo() {
    document.getElementById('modal-trabajo').classList.add('hidden');
}

/**
 * Registra un pago para un trabajo
 */
async function registrarPagoTrabajo(monto) {
    try {
        if (!monto || parseFloat(monto) <= 0) {
            mostrarNotificacion('Ingresa un monto válido', 'advertencia');
            return;
        }
        
        const trabajoId = document.getElementById('trabajo-id-oculto').value;
        
        mostrarCarga(true);
        const resultado = await registrarPagoTrabajoAPI(trabajoId, parseFloat(monto));
        mostrarCarga(false);
        
        mostrarNotificacion('Pago registrado correctamente', 'exito');
        document.getElementById('trabajo-monto-pago').value = '';
        
        // Recargar trabajos y actualizar modal
        await cargarTrabajos();
        await abrirModalGestionarTrabajo(trabajoId);
        
    } catch (error) {
        mostrarCarga(false);
        const mensaje = error.mensaje || 'No se pudo registrar el pago';
        mostrarNotificacion(mensaje, 'error');
    }
}

/**
 * Asigna una deuda total nueva y limpia el historial de pagos
 */
async function asignarDeudaTotalTrabajo() {
    try {
        const nuevoCosto = document.getElementById('trabajo-deuda-total').value;
        
        if (!nuevoCosto || parseFloat(nuevoCosto) < 0) {
            mostrarNotificacion('Ingresa un monto válido (no puede ser negativo)', 'advertencia');
            return;
        }
        
        const trabajoId = document.getElementById('trabajo-id-oculto').value;
        
        mostrarCarga(true);
        const resultado = await asignarDeudaTotalAPI(trabajoId, parseFloat(nuevoCosto));
        mostrarCarga(false);
        
        mostrarNotificacion('Deuda total asignada y historial limpiado', 'exito');
        
        // Limpiar campos de entrada
        document.getElementById('trabajo-deuda-total').value = '';
        document.getElementById('trabajo-monto-pago').value = '';
        
        // Recargar trabajos y actualizar modal
        await cargarTrabajos();
        await abrirModalGestionarTrabajo(trabajoId);
        
    } catch (error) {
        mostrarCarga(false);
        const mensaje = error.mensaje || 'No se pudo asignar la deuda total';
        mostrarNotificacion(mensaje, 'error');
    }
}

/**
 * Limpia el historial de pagos manteniendo el costo original
 */
async function limpiarHistorialPagosTrabajo() {
    try {
        const trabajoId = document.getElementById('trabajo-id-oculto').value;
        
        const confirmacion = confirm('¿Estás seguro de que quieres limpiar el historial de pagos? El saldo pendiente volverá al costo original.');
        
        if (!confirmacion) {
            return;
        }
        
        mostrarCarga(true);
        const resultado = await limpiarPagosTrabajoAPI(trabajoId);
        mostrarCarga(false);
        
        mostrarNotificacion('Historial de pagos limpiado correctamente', 'exito');
        
        // Limpiar campos de entrada
        document.getElementById('trabajo-deuda-total').value = '';
        document.getElementById('trabajo-monto-pago').value = '';
        
        // Recargar trabajos y actualizar modal
        await cargarTrabajos();
        await abrirModalGestionarTrabajo(trabajoId);
        
    } catch (error) {
        mostrarCarga(false);
        const mensaje = error.mensaje || 'No se pudo limpiar el historial de pagos';
        mostrarNotificacion(mensaje, 'error');
    }
}


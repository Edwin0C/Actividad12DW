/**
 * cliente_dashboard.js - Lógica del panel del cliente
 */

let juegosCargados = [];
let juegosSeleccionados = [];
let espacioTotalGB = 0;
let trabajoEnEdicion = null; // Rastrear qué solicitud se está editando

// Variables para paginación y búsqueda
let paginaActual = 1;
const JUEGOS_POR_PAGINA = 25; // 5 filas x 5 columnas
let textoBusqueda = '';
let ordenActual = 'nuevo'; // Por defecto: Lo más nuevo
let juegosFiltrados = [];

// Variables para polling automático de juegos
let intervaloRefreshJuegos = null;
const TIEMPO_REFRESH_JUEGOS = 30000; // Refrescar cada 30 segundos
let ultimoHashJuegos = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    if (!verificarAutenticacion()) return;
    if (!requerirRol('cliente')) return;
    
    // Configurar logout
    configurarLogout();
    
    // Configurar eventos PRIMERO
    configurarEventos();
    
    // Cargar datos
    await cargarJuegos();
    await cargarHistorial();
    
    // Configurar polling automático para refrescar juegos
    configurarPollingJuegos();
    
    console.log('Dashboard cliente inicializado');
});

/**
 * Carga los juegos disponibles
 */
async function cargarJuegos() {
    try {
        // Configurar botones de consola UNA SOLA VEZ
        document.querySelectorAll('.consola-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                // Evitar cambio de consola si se está editando
                if (trabajoEnEdicion) {
                    mostrarNotificacion('No puedes cambiar de consola mientras editas una solicitud', 'advertencia');
                    return;
                }
                const consola = this.getAttribute('data-consola');
                mostrarJuegosConsola(consola);
            });
        });
        
        // Mostrar PS4 por defecto
        await mostrarJuegosConsola('PS4');
        
    } catch (error) {
        const mensaje = error?.mensaje || error?.message || 'Error desconocido';
        mostrarNotificacion('Error al cargar juegos: ' + mensaje, 'error');
        console.error('Error en cargarJuegos:', error);
    }
}

/**
 * Muestra juegos de una consola específica
 */
async function mostrarJuegosConsola(consola, mantenerSeleccion = false) {
    try {
        // Resetear selecciones cuando cambias de consola (PERO NO en modo edición)
        if (!mantenerSeleccion) {
            juegosSeleccionados = [];
            espacioTotalGB = 0;
            document.getElementById('espacio-total').value = '';
            actualizarBarraProgreso();
        }
        
        const respuesta = await obtenerJuegosPorConsolaAPI(consola);
        console.log('Respuesta de API:', respuesta);
        juegosCargados = respuesta.juegos || [];
        
        // Resetear búsqueda y paginación cuando cambias de consola
        if (!mantenerSeleccion) {
            textoBusqueda = '';
            paginaActual = 1;
            ordenActual = 'nuevo';
            document.getElementById('buscar-juego').value = '';
            document.getElementById('ordenar-juegos').value = 'nuevo';
        }
        
        if (juegosCargados.length === 0) {
            document.getElementById('juegos-grid').innerHTML = '<p class="col-span-full text-center text-gray-400">No hay juegos disponibles para esta consola</p>';
            document.getElementById('paginacion-container').style.display = 'none';
            return;
        }
        
        // Aplicar filtro y orden
        aplicarFiltroYOrden();
        
        // Renderizar primera página
        renderizarPagina();
        
        // Actualizar opciones de almacenamiento según la consola
        actualizarOpcionesAlmacenamiento(consola);
        
        // Actualizar botones de consola SIN re-bindear listeners
        document.querySelectorAll('.consola-btn').forEach(btn => {
            btn.classList.remove('bg-purple-600', 'border-2', 'border-pink-600');
            btn.classList.add('bg-gray-700');
            
            // Deshabilitar botones si se está editando
            if (trabajoEnEdicion) {
                btn.classList.add('opacity-50', 'cursor-not-allowed');
                btn.style.pointerEvents = 'none';
            } else {
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
                btn.style.pointerEvents = 'auto';
            }
        });
        
        const btnActivo = document.querySelector(`[data-consola="${consola}"]`);
        if (btnActivo) {
            btnActivo.classList.remove('bg-gray-700');
            btnActivo.classList.add('bg-purple-600', 'border-2', 'border-pink-600');
        }
        
    } catch (error) {
        console.error('Error completo:', error);
        const mensaje = error?.mensaje || error?.message || JSON.stringify(error);
        mostrarNotificacion('Error al cargar juegos: ' + mensaje, 'error');
    }
}

/**
 * Actualiza las opciones de almacenamiento según la consola seleccionada
 */
function actualizarOpcionesAlmacenamiento(consola) {
    const espacioSelect = document.getElementById('espacio-total');
    const esPS3oPS4 = consola === 'PS3' || consola === 'PS4';
    
    // Obtener todas las opciones excepto la primera (placeholder)
    const opciones = Array.from(espacioSelect.querySelectorAll('option'));
    
    opciones.forEach(opcion => {
        if (opcion.value === '') {
            // No tocar el placeholder
            return;
        }
        
        const valor = parseFloat(opcion.value);
        
        if (esPS3oPS4) {
            // Para PS3 y PS4, solo mostrar opciones >= 128GB
            if (valor < 128) {
                opcion.disabled = true;
                opcion.style.display = 'none';
            } else {
                opcion.disabled = false;
                opcion.style.display = '';
            }
        } else {
            // Para otras consolas, mostrar todas las opciones
            opcion.disabled = false;
            opcion.style.display = '';
        }
    });
    
    // Si estamos en PS3/PS4 y hay un valor seleccionado menor a 128GB, resetear
    if (esPS3oPS4 && espacioTotalGB > 0 && espacioTotalGB < 128) {
        espacioTotalGB = 0;
        espacioSelect.value = '';
        espacioSelect.disabled = false;
        juegosSeleccionados = [];
        actualizarBarraProgreso();
        mostrarNotificacion('El espacio seleccionado es insuficiente para PS3/PS4. Por favor selecciona 128GB o más', 'advertencia');
    }
}

/**
 * Crea una tarjeta de juego mejorada
 */
function crearTarjetaJuego(juego) {
    const tarjeta = document.createElement('div');
    const estaSeleccionado = juegosSeleccionados.find(j => j.id === juego.id);
    
    tarjeta.className = `bg-gray-700 rounded-lg overflow-hidden cursor-pointer transition transform hover:scale-110 juego-card ${estaSeleccionado ? 'ring-2 ring-purple-500 scale-110' : ''} shadow-lg`;
    tarjeta.setAttribute('data-juego-id', juego.id);
    tarjeta.addEventListener('click', () => seleccionarJuego(juego));
    
    tarjeta.innerHTML = `
        <div class="relative h-32">
            <img src="${juego.imagen_url}" alt="${juego.nombre}" class="w-full h-full object-cover">
            ${estaSeleccionado ? '<div class="absolute inset-0 bg-purple-600 bg-opacity-70 flex items-center justify-center"><span class="text-3xl">✓</span></div>' : ''}
            <div class="absolute top-1 right-1 bg-purple-600 px-2 py-1 rounded text-xs font-bold">${juego.peso_gb}GB</div>
        </div>
        <div class="p-2">
            <h4 class="font-bold text-xs truncate">${juego.nombre}</h4>
            <p class="text-xs text-gray-400 truncate">${juego.consola}</p>
        </div>
    `;
    
    return tarjeta;
}

/**
 * Selecciona/deselecciona un juego
 */
function seleccionarJuego(juego) {
    // Buscar usando solo j.id === juego.id (comparación simple)
    const indice = juegosSeleccionados.findIndex(j => j.id === juego.id);
    
    if (indice > -1) {
        // Si está seleccionado, deseleccionar directamente
        juegosSeleccionados.splice(indice, 1);
        actualizarBarraProgreso();
        actualizarTarjetas();
    } else {
        // Validar espacio primero
        if (espacioTotalGB <= 0) {
            mostrarNotificacion('⚠️ Debes seleccionar el espacio de almacenamiento PRIMERO', 'advertencia');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.getElementById('espacio-total').focus();
            return;
        }
        
        // Calcular espacio usado y disponible
        const espacioUsado = juegosSeleccionados.reduce((sum, j) => sum + j.peso_gb, 0);
        const espacioDisponible = espacioTotalGB - espacioUsado;
        
        // Validar si el juego cabe en el espacio disponible
        if (juego.peso_gb > espacioDisponible) {
            mostrarNotificacion(`❌ Este juego necesita ${juego.peso_gb}GB pero solo tienes ${espacioDisponible.toFixed(1)}GB disponibles`, 'advertencia');
            return;
        }
        
        // Seleccionar el juego
        juegosSeleccionados.push(juego);
        actualizarBarraProgreso();
        actualizarTarjetas();
    }
}

/**
 * Actualiza solo el estado visual de las tarjetas sin re-renderizar
 */
function actualizarTarjetas() {
    // Calcular espacio usado
    const espacioUsado = juegosSeleccionados.reduce((sum, j) => sum + j.peso_gb, 0);
    const espacioDisponible = espacioTotalGB - espacioUsado;
    
    document.querySelectorAll('.juego-card').forEach((tarjeta) => {
        const juegoId = tarjeta.getAttribute('data-juego-id');
        
        // Buscar el juego en la lista global
        const juego = juegosCargados.find(j => j.id === juegoId);
        if (!juego) return;
        
        // Buscar en juegosSeleccionados
        const estaSeleccionado = juegosSeleccionados.find(j => j.id === juegoId);
        const overlay = tarjeta.querySelector('.absolute.inset-0');
        
        // Determinar si el juego no cabe en el espacio disponible
        const noCabe = !estaSeleccionado && espacioTotalGB > 0 && juego.peso_gb > espacioDisponible;
        
        if (noCabe) {
            // Desabilitar visualmente si no cabe
            tarjeta.classList.add('opacity-50', 'cursor-not-allowed');
            tarjeta.style.pointerEvents = 'none';
        } else {
            // Habilitar si cabe
            tarjeta.classList.remove('opacity-50', 'cursor-not-allowed');
            tarjeta.style.pointerEvents = 'auto';
        }
        
        if (estaSeleccionado) {
            tarjeta.classList.add('ring-2', 'ring-purple-500', 'scale-110');
            if (!overlay) {
                const div = document.createElement('div');
                div.className = 'absolute inset-0 bg-purple-600 bg-opacity-70 flex items-center justify-center';
                div.innerHTML = '<span class="text-3xl">✓</span>';
                tarjeta.querySelector('div').appendChild(div);
            }
        } else {
            tarjeta.classList.remove('ring-2', 'ring-purple-500', 'scale-110');
            if (overlay) overlay.remove();
        }
    });
}

/**
 * Aplica filtro de búsqueda y orden a los juegos
 */
function aplicarFiltroYOrden() {
    // Filtrar por búsqueda
    juegosFiltrados = juegosCargados.filter(juego =>
        juego.nombre.toLowerCase().includes(textoBusqueda.toLowerCase())
    );
    
    // Ordenar según la opción seleccionada
    switch(ordenActual) {
        case 'nuevo':
            juegosFiltrados.sort((a, b) => {
                // Por defecto, ordenar por como aparecen en la BD (índice inverso = más nuevo primero)
                return juegosCargados.indexOf(b) - juegosCargados.indexOf(a);
            });
            break;
        case 'peso-menor':
            juegosFiltrados.sort((a, b) => a.peso_gb - b.peso_gb);
            break;
        case 'peso-mayor':
            juegosFiltrados.sort((a, b) => b.peso_gb - a.peso_gb);
            break;
        case 'alfabetico':
            juegosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
            break;
    }
    
    // Resetear a página 1 cuando se aplica nuevo filtro
    paginaActual = 1;
}

/**
 * Renderiza la página actual de juegos
 */
function renderizarPagina() {
    const gridJuegos = document.getElementById('juegos-grid');
    gridJuegos.innerHTML = '';
    
    if (juegosFiltrados.length === 0) {
        gridJuegos.innerHTML = '<p class="col-span-full text-center text-gray-400">No se encontraron juegos</p>';
        document.getElementById('paginacion-container').style.display = 'none';
        return;
    }
    
    // Calcular índices
    const inicio = (paginaActual - 1) * JUEGOS_POR_PAGINA;
    const fin = inicio + JUEGOS_POR_PAGINA;
    const juegosEnPagina = juegosFiltrados.slice(inicio, fin);
    
    // Renderizar juegos de la página
    juegosEnPagina.forEach(juego => {
        const tarjeta = crearTarjetaJuego(juego);
        gridJuegos.appendChild(tarjeta);
    });
    
    // Actualizar estado visual
    actualizarTarjetas();
    
    // Actualizar paginación
    actualizarPaginacion();
}

/**
 * Actualiza los botones y texto de paginación
 */
function actualizarPaginacion() {
    const totalPaginas = Math.ceil(juegosFiltrados.length / JUEGOS_POR_PAGINA);
    const btnAnterior = document.getElementById('pagina-anterior');
    const btnSiguiente = document.getElementById('pagina-siguiente');
    const infoPaginacion = document.getElementById('info-paginacion');

    // Cambia la línea de abajo para que quede así:
    infoPaginacion.textContent = `Página ${paginaActual} de ${totalPaginas}`;

    // El resto de tu código sigue igual...
    btnAnterior.disabled = (paginaActual === 1);
    btnSiguiente.disabled = (paginaActual === totalPaginas);

    
    // Mostrar/ocultar paginación
    if (totalPaginas <= 1) {
        document.getElementById('paginacion-container').style.display = 'none';
    } else {
        document.getElementById('paginacion-container').style.display = 'flex';
    }
}

/**
 * Actualiza el resumen dinámico de la solicitud
 */
function actualizarResumenSolicitud() {
    const resumenDiv = document.getElementById('resumen-solicitud');
    const resumenText = document.getElementById('resumen-text');
    
    if (trabajoEnEdicion && juegosSeleccionados.length > 0 && espacioTotalGB > 0) {
        const consola = obtenerConsolaSeleccionada();
        const juegosLista = juegosSeleccionados.map(j => j.nombre).join(', ');
        const gbUsado = juegosSeleccionados.reduce((sum, j) => sum + j.peso_gb, 0);
        
        resumenText.innerHTML = `${consola} | ${juegosSeleccionados.length} juego(s): ${juegosLista} | ${gbUsado.toFixed(1)}GB / ${espacioTotalGB.toFixed(1)}GB`;
        resumenDiv.classList.remove('hidden');
    } else {
        resumenDiv.classList.add('hidden');
    }
}

/**
 * Actualiza la barra de progreso
 */
function actualizarBarraProgreso() {
    const gbUsado = juegosSeleccionados.reduce((sum, j) => sum + j.peso_gb, 0);
    const solicitudBtn = document.getElementById('solicitar-btn');
    const limpiarBtn = document.getElementById('limpiar-btn');
    const alertaEspacio = document.getElementById('alerta-espacio-superado');
    
    if (espacioTotalGB <= 0) {
        document.getElementById('gb-usado').textContent = gbUsado.toFixed(1);
        document.getElementById('gb-total').textContent = '-';
        document.getElementById('barra-progreso').style.width = '0%';
    } else {
        const porcentaje = (gbUsado / espacioTotalGB) * 100;
        document.getElementById('gb-usado').textContent = gbUsado.toFixed(1);
        document.getElementById('gb-total').textContent = espacioTotalGB.toFixed(1);
        document.getElementById('barra-progreso').style.width = Math.min(porcentaje, 100) + '%';
    }
    
    // Cambiar color de barra según porcentaje
    const barra = document.getElementById('barra-progreso');
    const porcentaje = espacioTotalGB > 0 ? (gbUsado / espacioTotalGB) * 100 : 0;
    
    // Verificar si se superó el límite
    const superaLimite = gbUsado > espacioTotalGB && espacioTotalGB > 0;
    
    if (superaLimite) {
        barra.className = 'bg-gradient-to-r from-red-500 to-red-600 h-full';
        // Mostrar alerta
        if (alertaEspacio) {
            alertaEspacio.classList.remove('hidden');
            alertaEspacio.innerHTML = `<p class="text-red-300"><strong>⚠️ Advertencia:</strong> Los juegos seleccionados (${gbUsado.toFixed(1)}GB) superan tu espacio disponible (${espacioTotalGB.toFixed(1)}GB)</p>`;
        }
        // Bloquear botón de solicitud
        solicitudBtn.disabled = true;
        solicitudBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else if (porcentaje > 90) {
        barra.className = 'bg-gradient-to-r from-orange-500 to-orange-600 h-full';
        // Ocultar alerta si existe
        if (alertaEspacio) {
            alertaEspacio.classList.add('hidden');
        }
        // Habilitar botón si hay juegos Y no estamos editando
        if (juegosSeleccionados.length > 0 && espacioTotalGB > 0 && !trabajoEnEdicion) {
            solicitudBtn.disabled = false;
            solicitudBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    } else if (porcentaje > 70) {
        barra.className = 'bg-gradient-to-r from-yellow-500 to-orange-600 h-full';
        // Ocultar alerta si existe
        if (alertaEspacio) {
            alertaEspacio.classList.add('hidden');
        }
        // Habilitar botón si hay juegos Y no estamos editando
        if (juegosSeleccionados.length > 0 && espacioTotalGB > 0 && !trabajoEnEdicion) {
            solicitudBtn.disabled = false;
            solicitudBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    } else {
        barra.className = 'bg-gradient-to-r from-purple-500 to-pink-600 h-full';
        // Ocultar alerta si existe
        if (alertaEspacio) {
            alertaEspacio.classList.add('hidden');
        }
        // Habilitar botón si hay juegos Y no estamos editando
        if (juegosSeleccionados.length > 0 && espacioTotalGB > 0 && !trabajoEnEdicion) {
            solicitudBtn.disabled = false;
            solicitudBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
    
    // Habilitar/Deshabilitar botón "Limpiar Selección"
    if (juegosSeleccionados.length > 0) {
        limpiarBtn.disabled = false;
        limpiarBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        limpiarBtn.disabled = true;
        limpiarBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
    
    // Actualizar resumen si estamos en edición
    actualizarResumenSolicitud();
}

/**
 * Limpia la selección de juegos
 */
function limpiarSeleccion() {
    juegosSeleccionados = [];
    espacioTotalGB = 0;
    
    // Limpiar el selector de espacio
    const espacioSelect = document.getElementById('espacio-total');
    espacioSelect.value = '';
    espacioSelect.style.backgroundColor = '';
    
    // Actualizar solo la barra de progreso y las tarjetas
    // SIN recargar juegos, SIN resetear búsqueda/orden/página
    actualizarBarraProgreso();
    actualizarTarjetas();
    
    // Ocultar resumen si estaba visible
    document.getElementById('resumen-solicitud').classList.add('hidden');
    
    mostrarNotificacion('Selección limpiada', 'info');
}

/**
 * Solicita la instalación de juegos
 */
async function solicitarInstalacion() {
    if (juegosSeleccionados.length === 0) {
        mostrarNotificacion('Por favor selecciona al menos un juego', 'advertencia');
        return;
    }
    
    if (espacioTotalGB <= 0) {
        mostrarNotificacion('⚠️ Debes especificar el espacio disponible de tu dispositivo primero', 'advertencia');
        document.getElementById('espacio-total').focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    
    const gbUsado = juegosSeleccionados.reduce((sum, j) => sum + j.peso_gb, 0);
    
    if (gbUsado > espacioTotalGB) {
        const espacioRestante = (espacioTotalGB - 0).toFixed(1);
        mostrarNotificacion(`❌ No tienes espacio suficiente. Los juegos usan ${gbUsado.toFixed(1)}GB pero solo tienes ${espacioRestante}GB disponibles`, 'advertencia');
        return;
    }
    
    try {
        const usuario = obtenerUsuario();
        const consola = juegosSeleccionados[0]?.consola || 'PS4';
        
        const datosTrabajo = {
            cliente_id: usuario.id,
            empleado_id: null,
            tipo_servicio: 'instalacion',
            consola: consola,
            juegos_instalados: juegosSeleccionados.map(j => j.id),
            total_gb: parseFloat(espacioTotalGB),
            descripcion: `${juegosSeleccionados.length} juego(s): ${juegosSeleccionados.map(j => j.nombre).join(', ')} | ${gbUsado.toFixed(1)}GB`,
            costo: 0
        };
        
        mostrarCarga(true);
        await crearTrabajoAPI(datosTrabajo);
        mostrarCarga(false);
        
        mostrarNotificacion('¡Solicitud enviada! Un empleado se pondrá en contacto', 'exito');
        
        // Limpiar selección
        setTimeout(() => {
            limpiarSeleccion();
            cargarHistorial();
        }, 1500);
        
    } catch (error) {
        mostrarCarga(false);
        mostrarNotificacion('Error al enviar solicitud: ' + (error?.mensaje || error), 'error');
    }
}

/**
 * Genera los botones de edición según el estado
 */
function generarBotonesEdicion(registroId, esEnEdicion, trabajoEnEdicionGlobal) {
    if (esEnEdicion) {
        return '<div class="flex gap-2">' +
                '<button class="cancelar-edicion px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs font-bold transition" data-trabajo-id="' + registroId + '">' +
                '❌ Cancelar Edición' +
                '</button>' +
                '<button class="guardar-edicion px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-bold transition" data-trabajo-id="' + registroId + '">' +
                '✅ Guardar Cambios' +
                '</button>' +
                '</div>';
    } else {
        const deshabilitado = trabajoEnEdicionGlobal ? 'disabled' : '';
        return '<div class="flex gap-2">' +
                '<button class="editar-trabajo px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-bold transition" data-trabajo-id="' + registroId + '" ' + deshabilitado + '>' +
                '✏️ Editar' +
                '</button>' +
                '<button class="eliminar-trabajo px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-bold transition" data-trabajo-id="' + registroId + '" ' + deshabilitado + '>' +
                '🗑️ Eliminar' +
                '</button>' +
                '</div>';
    }
}

/**
 * Carga el historial de trabajos del cliente
 */
async function cargarHistorial() {
    try {
        const usuario = obtenerUsuario();
        const respuesta = await obtenerTrabajoPorClienteAPI(usuario.id);
        
        const contenedor = document.getElementById('historial-container');
        contenedor.innerHTML = '';
        
        if (respuesta.registros.length === 0) {
            contenedor.innerHTML = '<p class="text-gray-400 text-center py-4">Aún no tienes servicios registrados</p>';
            return;
        }
        
        // Obtener todos los juegos disponibles
        const respuestaTodosJuegos = await obtenerTodosJuegosAPI();
        const todosLosJuegos = respuestaTodosJuegos.juegos || [];
        
        respuesta.registros.forEach(registro => {
            const elemento = document.createElement('div');
            // Si es el trabajo en edición, remarcar con color diferente
            const esTrabajoEnEdicion = trabajoEnEdicion === registro.id;
            elemento.className = `rounded-lg p-4 border-l-4 transition ${
                esTrabajoEnEdicion 
                    ? 'bg-blue-900 border-blue-400 ring-2 ring-blue-400' 
                    : 'bg-gray-700 border-purple-500'
            }`;
            
            // Solo permitir editar/eliminar si está en estado "pendiente"
            const puedeEditar = registro.estado === 'pendiente';
            
            // Generar descripción detallada con nombres de juegos y GB
            let descripcionDetallada = '';
            let gbTotalJuegos = 0;
            
            if (registro.juegos_instalados && registro.juegos_instalados.length > 0) {
                const juegosDetallados = registro.juegos_instalados.map(juegoId => {
                    const juego = todosLosJuegos.find(j => j.id === juegoId || j._id === juegoId);
                    if (juego) {
                        gbTotalJuegos += juego.peso_gb;
                        return `${juego.nombre} (${juego.peso_gb}GB)`;
                    }
                    return `Juego no encontrado`;
                });
                descripcionDetallada = juegosDetallados.join(', ');
            } else {
                descripcionDetallada = registro.descripcion || 'Sin especificar';
            }
            
            // Usar el total calculado de los juegos, o fallback a total_gb
            const gbFinal = gbTotalJuegos > 0 ? gbTotalJuegos : (registro.total_gb || 0);
            
            // Crear notificación especial si está en edición
            const etiquetaEdicion = esTrabajoEnEdicion 
                ? '<p class="text-xs text-blue-300 font-bold mb-2">🔄 EN EDICIÓN</p>'
                : '';
            
            elemento.innerHTML = `
                ${etiquetaEdicion}
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="font-bold text-purple-300">${registro.tipo_servicio.toUpperCase()}</p>
                        <p class="text-sm text-gray-400">${formatearFecha(registro.fecha_creacion)}</p>
                    </div>
                    <span class="px-3 py-1 rounded text-xs font-bold ${obtenerColorEstado(registro.estado)} bg-opacity-20">
                        ${registro.estado.toUpperCase()}
                    </span>
                </div>
                <p class="text-sm text-gray-300 mb-2"><strong>📀 Juegos:</strong> ${descripcionDetallada}</p>
                <p class="text-sm text-gray-400 mb-4">💾 ${gbFinal.toFixed(1)}GB en ${registro.consola || 'Desconocida'}</p>
                ${puedeEditar ? generarBotonesEdicion(registro.id, esTrabajoEnEdicion, trabajoEnEdicion) : ''}
            `;
            contenedor.appendChild(elemento);
        });
        
        // Agregar event listeners a los botones
        document.querySelectorAll('.editar-trabajo').forEach(btn => {
            btn.addEventListener('click', function() {
                if (!trabajoEnEdicion) {
                    editarTrabajo(this.getAttribute('data-trabajo-id'));
                }
            });
        });
        
        document.querySelectorAll('.eliminar-trabajo').forEach(btn => {
            btn.addEventListener('click', function() {
                if (!trabajoEnEdicion) {
                    eliminarTrabajo(this.getAttribute('data-trabajo-id'));
                }
            });
        });
        
        document.querySelectorAll('.cancelar-edicion').forEach(btn => {
            btn.addEventListener('click', function() {
                cancelarEdicion();
            });
        });
        
        document.querySelectorAll('.guardar-edicion').forEach(btn => {
            btn.addEventListener('click', function() {
                guardarEdicion(this.getAttribute('data-trabajo-id'));
            });
        });
        
    } catch (error) {
        console.error('Error al cargar historial:', error);
    }
}

/**
 * Bloquea o desbloquea los botones de solicitud y limpieza
 */
function bloquearBotonesPrincipales(bloqueado) {
    const solicitarBtn = document.getElementById('solicitar-btn');
    const limpiarBtn = document.getElementById('limpiar-btn');
    
    if (bloqueado) {
        // Bloquear botones
        if (solicitarBtn) {
            solicitarBtn.disabled = true;
            solicitarBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        if (limpiarBtn) {
            limpiarBtn.disabled = true;
            limpiarBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    } else {
        // Desbloquear botones
        if (solicitarBtn) {
            solicitarBtn.disabled = juegosSeleccionados.length === 0;
            solicitarBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        if (limpiarBtn) {
            limpiarBtn.disabled = false;
            limpiarBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

/**
 * Edita un trabajo (solicitud) existente - Modo exclusivo
 */
async function editarTrabajo(trabajoId) {
    try {
        const usuario = obtenerUsuario();
        const respuesta = await obtenerTrabajoPorClienteAPI(usuario.id);
        const trabajo = respuesta.registros.find(r => r.id === trabajoId);
        
        if (!trabajo) {
            mostrarNotificacion('No se encontró la solicitud', 'error');
            return;
        }
        
        // Obtener todos los juegos
        const respuestaTodosJuegos = await obtenerTodosJuegosAPI();
        const todosLosJuegos = respuestaTodosJuegos.juegos || [];
        
        // Entrar en modo edición PRIMERO
        trabajoEnEdicion = trabajoId;
        
        // Fijar el espacio
        espacioTotalGB = trabajo.total_gb;
        
        // Actualizar selector de espacio (SIN deshabilitar, solo mostrar el valor)
        const espacioSelect = document.getElementById('espacio-total');
        espacioSelect.value = trabajo.total_gb;
        espacioSelect.style.backgroundColor = '#9354ff'; // Color indicador de que está fijado
        
        // Mostrar la consola correcta basada en el trabajo
        const consolaDelTrabajo = trabajo.consola || 'PS4';
        
        // Cargar juegos de esa consola CON mantenerSeleccion = true
        await mostrarJuegosConsola(consolaDelTrabajo, true);
        
        // AHORA con los juegos cargados, buscar y seleccionar los del trabajo
        juegosSeleccionados = [];
        trabajo.juegos_instalados.forEach(juegoId => {
            const juego = juegosCargados.find(j => j.id === juegoId || j._id === juegoId);
            if (juego) {
                juegosSeleccionados.push(juego);
            }
        });
        
        // Si no encontró, buscar en TODOS los juegos
        if (juegosSeleccionados.length === 0) {
            trabajo.juegos_instalados.forEach(juegoId => {
                const juego = todosLosJuegos.find(j => j.id === juegoId || j._id === juegoId);
                if (juego) {
                    juegosSeleccionados.push(juego);
                }
            });
        }
        
        // Actualizar UI
        actualizarBarraProgreso();
        actualizarTarjetas();
        
        // BLOQUEAR los botones de solicitud y limpieza
        bloquearBotonesPrincipales(true);
        
        // Recargar historial para mostrar botones de edición
        await cargarHistorial();
        
        // Scroll a los juegos
        document.getElementById('juegos-grid').scrollIntoView({ behavior: 'smooth' });
        
        // Mostrar notificación con detalles de los juegos
        const detallesJuegos = juegosSeleccionados
            .map(j => `${j.nombre} (${j.peso_gb}GB)`)
            .join(', ');
        mostrarNotificacion('✏️ Editando: ' + detallesJuegos, 'info');
    } catch (error) {
        console.error('Error en editarTrabajo:', error);
        mostrarNotificacion('Error al cargar la solicitud: ' + (error?.mensaje || error?.message || error), 'error');
    }
}

/**
 * Cancela la edición actual
 */
function cancelarEdicion() {
    if (!trabajoEnEdicion) return;
    
    if (confirm('¿Deseas cancelar la edición? Se perderán todos los cambios.')) {
        trabajoEnEdicion = null;
        juegosSeleccionados = [];
        espacioTotalGB = 0;
        
        // Limpiar formulario y restaurar estado normal del selector de espacio
        const espacioSelect = document.getElementById('espacio-total');
        espacioSelect.value = '';
        espacioSelect.style.backgroundColor = ''; // Restaurar color original
        document.getElementById('resumen-solicitud').classList.add('hidden');
        
        // Recargar interfaz
        actualizarBarraProgreso();
        actualizarTarjetas();
        
        // DESBLOQUEAR los botones de solicitud y limpieza
        bloquearBotonesPrincipales(false);
        
        cargarHistorial();
        mostrarJuegosConsola('PS4');
        
        mostrarNotificacion('❌ Edición cancelada', 'info');
    }
}

/**
 * Guarda los cambios de la edición
 */
async function guardarEdicion(trabajoId) {
    if (!trabajoEnEdicion || trabajoEnEdicion !== trabajoId) {
        mostrarNotificacion('Error: No hay solicitud en edición', 'error');
        return;
    }
    
    // Validar que tenga al menos un juego
    if (juegosSeleccionados.length === 0) {
        mostrarNotificacion('Debes seleccionar al menos un juego', 'error');
        return;
    }
    
    // Validar que tenga espacio asignado
    if (espacioTotalGB <= 0) {
        mostrarNotificacion('Debes asignar un espacio válido', 'error');
        return;
    }
    
    try {
        mostrarCarga(true);
        
        const usuario = obtenerUsuario();
        
        // Obtener la consola correcta del primer juego
        const consola = juegosSeleccionados[0]?.consola || 'PS4';
        
        // Crear descripción con resumen de juegos
        const juegosLista = juegosSeleccionados.map(j => j.nombre).join(', ');
        const gbUsado = juegosSeleccionados.reduce((sum, j) => sum + j.peso_gb, 0);
        
        // Preparar datos para actualizar
        const datosSolicitud = {
            cliente_id: usuario.id,
            tipo_servicio: 'instalacion',
            consola: consola,
            juegos_instalados: juegosSeleccionados.map(j => j.id || j._id),
            total_gb: parseFloat(espacioTotalGB),
            descripcion: `${juegosSeleccionados.length} juego(s): ${juegosLista} | ${gbUsado.toFixed(1)}GB`
        };
        
        console.log('Guardando solicitud editada:', datosSolicitud);
        
        // Actualizar la solicitud directamente
        const responseUpdate = await fetch(`/api/trabajos/${trabajoId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosSolicitud)
        });
        
        if (!responseUpdate.ok) {
            const error = await responseUpdate.json();
            console.error('Error al actualizar:', error);
            mostrarNotificacion('Error al actualizar: ' + (error.error || 'desconocido'), 'error');
            mostrarCarga(false);
            return;
        }
        
        const resultado = await responseUpdate.json();
        console.log('Respuesta de actualización:', resultado);
        
        // Salir del modo edición
        trabajoEnEdicion = null;
        juegosSeleccionados = [];
        espacioTotalGB = 0;
        
        // Limpiar formulario y restaurar estado normal del selector de espacio
        const espacioSelect = document.getElementById('espacio-total');
        espacioSelect.value = '';
        espacioSelect.style.backgroundColor = ''; // Restaurar color original
        
        // DESBLOQUEAR los botones de solicitud y limpieza
        bloquearBotonesPrincipales(false);
        
        // Recargar interfaz
        await cargarHistorial();
        actualizarBarraProgreso();
        actualizarTarjetas();
        mostrarJuegosConsola('PS4');
        
        mostrarNotificacion('✅ Solicitud actualizada correctamente', 'success');
        mostrarCarga(false);
    } catch (error) {
        console.error('Error en guardarEdicion:', error);
        mostrarNotificacion('Error al guardar cambios: ' + (error?.mensaje || error?.message || error), 'error');
        mostrarCarga(false);
    }
}

/**
 * Obtiene la consola seleccionada actualmente
 */
function obtenerConsolaSeleccionada() {
    const btnActivo = document.querySelector('.consola-btn.bg-purple-600');
    return btnActivo ? btnActivo.getAttribute('data-consola') : 'PS4';
}

/**
 * Elimina un trabajo (solicitud)
 */
async function eliminarTrabajo(trabajoId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta solicitud? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        mostrarCarga(true);
        
        // Aquí se asume que existe una API para eliminar trabajos
        // Si no existe, habrá que crearla en el backend
        const response = await fetch(`/api/trabajos/${trabajoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw {mensaje: error.mensaje || 'Error al eliminar la solicitud'};
        }
        
        mostrarCarga(false);
        mostrarNotificacion('✓ Solicitud eliminada correctamente', 'exito');
        
        // Recargar historial
        setTimeout(() => {
            cargarHistorial();
        }, 1000);
        
    } catch (error) {
        mostrarCarga(false);
        mostrarNotificacion('Error al eliminar la solicitud: ' + error.mensaje, 'error');
    }
}

/**
 * Obtiene el color del estado
 */
function obtenerColorEstado(estado) {
    const colores = {
        'pendiente': 'text-yellow-300',
        'en_progreso': 'text-blue-300',
        'completado': 'text-green-300',
        'cancelado': 'text-red-300'
    };
    return colores[estado] || 'text-gray-300';
}

/**
 * Configura los eventos
 */
function configurarEventos() {
    // Botones principales
    const solicitarBtn = document.getElementById('solicitar-btn');
    const limpiarBtn = document.getElementById('limpiar-btn');
    const espacioSelect = document.getElementById('espacio-total');
    
    if (solicitarBtn) solicitarBtn.addEventListener('click', solicitarInstalacion);
    if (limpiarBtn) limpiarBtn.addEventListener('click', limpiarSeleccion);
    
    // Event listeners para búsqueda y ordenamiento
    const buscarInput = document.getElementById('buscar-juego');
    const ordenarSelect = document.getElementById('ordenar-juegos');
    const btnAnterior = document.getElementById('pagina-anterior');
    const btnSiguiente = document.getElementById('pagina-siguiente');
    
    if (buscarInput) {
        buscarInput.addEventListener('input', function(e) {
            textoBusqueda = this.value;
            aplicarFiltroYOrden();
            renderizarPagina();
        });
    }
    
    if (ordenarSelect) {
        ordenarSelect.addEventListener('change', function(e) {
            ordenActual = this.value;
            aplicarFiltroYOrden();
            renderizarPagina();
        });
    }
    
    if (btnAnterior) {
        btnAnterior.addEventListener('click', function() {
            if (paginaActual > 1) {
                paginaActual--;
                renderizarPagina();
                document.getElementById('juegos-grid').scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    if (btnSiguiente) {
        btnSiguiente.addEventListener('click', function() {
            const totalPaginas = Math.ceil(juegosFiltrados.length / JUEGOS_POR_PAGINA);
            if (paginaActual < totalPaginas) {
                paginaActual++;
                renderizarPagina();
                document.getElementById('juegos-grid').scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Event listener para cambios en el selector de espacio
    if (espacioSelect) {
        espacioSelect.addEventListener('change', function(e) {
            const valor = parseFloat(this.value);
            
            if (!this.value) {
                // Si se selecciona la opción vacía, quitar el límite
                espacioTotalGB = 0;
                juegosSeleccionados = [];
                actualizarBarraProgreso();
                actualizarTarjetas();
                mostrarNotificacion('Límite de espacio removido', 'info');
                return;
            }
            
            // Verificar si hay juegos seleccionados que superarían el nuevo límite
            const gbUsado = juegosSeleccionados.reduce((sum, j) => sum + j.peso_gb, 0);
            
            if (gbUsado > valor && juegosSeleccionados.length > 0) {
                // El espacio nuevo es insuficiente para los juegos ya seleccionados
                juegosSeleccionados = [];
                espacioTotalGB = valor;
                const textoOpcion = this.options[this.selectedIndex].text;
                
                actualizarBarraProgreso();
                actualizarTarjetas();
                mostrarNotificacion(`Los juegos seleccionados superaban el nuevo límite. Se limpió la selección. Espacio fijado en: ${textoOpcion}`, 'advertencia');
                return;
            }
            
            // Fijar el nuevo espacio
            espacioTotalGB = valor;
            const textoOpcion = this.options[this.selectedIndex].text;
            
            actualizarBarraProgreso();
            actualizarTarjetas();
            mostrarNotificacion(`✓ Espacio fijado en: ${textoOpcion}`, 'exito');
        });
    } else {
        console.error('No se encontró el elemento de espacio disponible');
    }
}

/**
 * Configura el polling automático para refrescar juegos
 * Detecta cambios en la disponibilidad de juegos (habilitar/deshabilitar)
 */
function configurarPollingJuegos() {
    // Limpiar intervalo anterior si existe
    if (intervaloRefreshJuegos) {
        clearInterval(intervaloRefreshJuegos);
    }
    
    // Configurar nuevo intervalo
    intervaloRefreshJuegos = setInterval(async () => {
        try {
            // Obtener la consola actualmente seleccionada
            const consolaActiva = document.querySelector('.consola-btn.bg-purple-600')?.getAttribute('data-consola');
            
            if (!consolaActiva) return;
            
            // Obtener juegos actuales
            const respuesta = await obtenerJuegosPorConsolaAPI(consolaActiva);
            const juegosActuales = respuesta.juegos || [];
            
            // Crear hash de los juegos actuales para detectar cambios
            const hashActual = JSON.stringify(juegosActuales.map(j => ({
                id: j.id,
                disponible: j.disponible,
                nombre: j.nombre
            })));
            
            // Si no hay cambios, no hacer nada
            if (ultimoHashJuegos === hashActual) {
                return;
            }
            
            // Detectar cambios
            const cambiosDetectados = detectarCambiosJuegos(juegosCargados, juegosActuales);
            
            if (cambiosDetectados.eliminados.length > 0 || 
                cambiosDetectados.nuevos.length > 0 || 
                cambiosDetectados.cambiadosDisponibilidad.length > 0) {
                
                console.log('📢 Cambios detectados en juegos:', cambiosDetectados);
                
                // Actualizar lista de juegos
                juegosCargados = juegosActuales;
                ultimoHashJuegos = hashActual;
                
                // Re-renderizar la página actual manteniendo la posición
                aplicarFiltroYOrden();
                renderizarPagina();
                
                // Mostrar notificación según el tipo de cambio
                if (cambiosDetectados.eliminados.length > 0) {
                    mostrarNotificacion(`⚠️ ${cambiosDetectados.eliminados.length} juego(s) fue/fueron eliminado(s)`, 'advertencia');
                }
                
                if (cambiosDetectados.nuevos.length > 0) {
                    mostrarNotificacion(`✨ ¡${cambiosDetectados.nuevos.length} nuevo(s) juego(s) disponible(s)!`, 'exito');
                }
                
                if (cambiosDetectados.cambiadosDisponibilidad.length > 0) {
                    const habilitados = cambiosDetectados.cambiadosDisponibilidad.filter(c => c.disponible).length;
                    const deshabilitados = cambiosDetectados.cambiadosDisponibilidad.length - habilitados;
                    
                    if (habilitados > 0) {
                        mostrarNotificacion(`🟢 ${habilitados} juego(s) fue/fueron habilitado(s)`, 'info');
                    }
                    if (deshabilitados > 0) {
                        mostrarNotificacion(`🔴 ${deshabilitados} juego(s) fue/fueron deshabilitado(s)`, 'info');
                    }
                }
            }
            
        } catch (error) {
            // No mostrar errores en el polling, solo en consola
            console.log('[DEBUG] Error en polling de juegos (silenciado):', error);
        }
    }, TIEMPO_REFRESH_JUEGOS);
}

/**
 * Detecta cambios entre dos listas de juegos
 */
function detectarCambiosJuegos(juegosAnteriores, juegosActuales) {
    const cambios = {
        nuevos: [],
        eliminados: [],
        cambiadosDisponibilidad: []
    };
    
    // Crear mapas para búsqueda rápida
    const mapaAnterior = {};
    const mapaActual = {};
    
    juegosAnteriores.forEach(j => {
        mapaAnterior[j.id] = j;
    });
    
    juegosActuales.forEach(j => {
        mapaActual[j.id] = j;
    });
    
    // Detectar nuevos juegos
    Object.keys(mapaActual).forEach(id => {
        if (!mapaAnterior[id]) {
            cambios.nuevos.push(mapaActual[id]);
        }
    });
    
    // Detectar juegos eliminados
    Object.keys(mapaAnterior).forEach(id => {
        if (!mapaActual[id]) {
            cambios.eliminados.push(mapaAnterior[id]);
        }
    });
    
    // Detectar cambios de disponibilidad
    Object.keys(mapaAnterior).forEach(id => {
        if (mapaActual[id] && mapaAnterior[id].disponible !== mapaActual[id].disponible) {
            cambios.cambiadosDisponibilidad.push({
                id: id,
                nombre: mapaActual[id].nombre,
                disponible: mapaActual[id].disponible
            });
        }
    });
    
    return cambios;
}

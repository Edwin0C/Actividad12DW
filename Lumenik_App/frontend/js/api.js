/**
 * api.js - Funciones para comunicación con la API backend
 */

const API_URL = 'http://localhost:5000/api';

/**
 * Hacer una solicitud a la API
 * @param {string} endpoint - Ruta del endpoint
 * @param {string} metodo - GET, POST, PUT, DELETE
 * @param {object} datos - Datos a enviar (para POST/PUT)
 * @returns {Promise}
 */
async function llamarAPI(endpoint, metodo = 'GET', datos = null) {
    try {
        mostrarCarga(true);
        
        const opciones = {
            method: metodo,
            headers: obtenerHeadersAutenticacion()
        };
        
        console.log(`[DEBUG] Llamando API - Endpoint: ${endpoint}, Método: ${metodo}`);
        console.log('[DEBUG] Headers:', opciones.headers);
        
        if (datos && (metodo === 'POST' || metodo === 'PUT')) {
            opciones.body = JSON.stringify(datos);
            console.log('[DEBUG] Body:', datos);
        }
        
        const respuesta = await fetch(`${API_URL}${endpoint}`, opciones);
        const resultado = await respuesta.json();
        
        mostrarCarga(false);
        
        console.log(`[DEBUG] Respuesta - Status: ${respuesta.status}, Resultado:`, resultado);
        
        if (!respuesta.ok) {
            throw {
                codigo: respuesta.status,
                mensaje: resultado.error || resultado.mensaje || 'Error desconocido'
            };
        }
        
        return resultado;
    } catch (error) {
        mostrarCarga(false);
        console.error('Error en API:', error);
        throw error;
    }
}

// ===== AUTENTICACIÓN =====

async function loginAPI(nombreUsuario, contraseña) {
    return await llamarAPI('/auth/login', 'POST', {
        nombre_usuario: nombreUsuario,
        contraseña: contraseña
    });
}

async function registrarUsuarioAPI(datosUsuario) {
    return await llamarAPI('/auth/registrar', 'POST', datosUsuario);
}

async function cambiarContraseñaAPI(contraseñaActual, contraseñaNueva) {
    return await llamarAPI('/auth/cambiar-contraseña', 'POST', {
        contraseña_actual: contraseñaActual,
        contraseña_nueva: contraseñaNueva
    });
}

async function validarTokenAPI(token) {
    return await llamarAPI('/auth/validar-token', 'POST', { token });
}

// ===== USUARIOS =====

async function obtenerTodosUsuariosAPI() {
    return await llamarAPI('/usuarios');
}

async function obtenerUsuarioAPI(usuarioId) {
    return await llamarAPI(`/usuarios/${usuarioId}`);
}

async function obtenerUsuariosPorRolAPI(rol) {
    return await llamarAPI(`/usuarios/rol/${rol}`);
}

async function crearUsuarioAPI(datosUsuario) {
    return await llamarAPI('/usuarios', 'POST', datosUsuario);
}

async function actualizarUsuarioAPI(usuarioId, datos) {
    return await llamarAPI(`/usuarios/${usuarioId}`, 'PUT', datos);
}

// Alias para editar usuario
async function editarUsuarioAPI(usuarioId, datos) {
    return await actualizarUsuarioAPI(usuarioId, datos);
}

async function cambiarEstadoUsuarioAPI(usuarioId, estado) {
    return await llamarAPI(`/usuarios/${usuarioId}/cambiar-estado`, 'POST', { estado });
}

async function eliminarUsuarioAPI(usuarioId) {
    return await llamarAPI(`/usuarios/${usuarioId}`, 'DELETE');
}

async function obtenerEstadisticasUsuariosAPI() {
    return await llamarAPI('/usuarios/estadisticas');
}

// ===== JUEGOS =====

async function obtenerTodosJuegosAPI() {
    return await llamarAPI('/juegos');
}

async function obtenerJuegosPorConsolaAPI(consola) {
    return await llamarAPI(`/juegos/consola/${consola}`);
}

async function obtenerTodasLasConsolasAPI() {
    return await llamarAPI('/juegos/todas-consolas');
}

async function obtenerJuegoAPI(juegoId) {
    return await llamarAPI(`/juegos/${juegoId}`);
}

async function crearJuegoAPI(datosJuego) {
    return await llamarAPI('/juegos', 'POST', datosJuego);
}

async function actualizarJuegoAPI(juegoId, datos) {
    return await llamarAPI(`/juegos/${juegoId}`, 'PUT', datos);
}

async function cambiarDisponibilidadJuegoAPI(juegoId, disponible) {
    return await llamarAPI(`/juegos/${juegoId}/disponibilidad`, 'POST', { disponible });
}

async function eliminarJuegoAPI(juegoId) {
    return await llamarAPI(`/juegos/${juegoId}`, 'DELETE');
}

async function buscarJuegosAPI(termino) {
    return await llamarAPI(`/juegos/buscar/${termino}`);
}

async function obtenerEstadisticasJuegosAPI() {
    return await llamarAPI('/juegos/estadisticas');
}

// ===== TRABAJOS =====

async function obtenerTodosTrabajoAPI() {
    return await llamarAPI('/trabajos');
}

async function obtenerTrabajoAPI(registroId) {
    return await llamarAPI(`/trabajos/${registroId}`);
}

async function obtenerTrabajoPorClienteAPI(clienteId) {
    return await llamarAPI(`/trabajos/cliente/${clienteId}`);
}

async function obtenerTrabajoPorEmpleadoAPI(empleadoId) {
    return await llamarAPI(`/trabajos/empleado/${empleadoId}`);
}

async function obtenerTrabajosPendientesAPI(empleadoId = null) {
    let endpoint = '/trabajos/pendientes';
    if (empleadoId) {
        endpoint += `?empleado_id=${empleadoId}`;
    }
    return await llamarAPI(endpoint);
}

async function crearTrabajoAPI(datosTrabajo) {
    return await llamarAPI('/trabajos', 'POST', datosTrabajo);
}

async function actualizarTrabajoAPI(registroId, datos) {
    return await llamarAPI(`/trabajos/${registroId}`, 'PUT', datos);
}

async function cambiarEstadoTrabajoAPI(registroId, estado) {
    return await llamarAPI(`/trabajos/${registroId}/cambiar-estado`, 'POST', { estado });
}

async function registrarPagoTrabajoAPI(registroId, monto) {
    return await llamarAPI(`/trabajos/${registroId}/registrar-pago`, 'POST', { monto });
}

async function asignarDeudaTotalAPI(registroId, nuevoCosto) {
    return await llamarAPI(`/trabajos/${registroId}/asignar-deuda`, 'POST', { nuevo_costo: nuevoCosto });
}

async function limpiarPagosTrabajoAPI(registroId) {
    return await llamarAPI(`/trabajos/${registroId}/limpiar-pagos`, 'POST', {});
}

async function obtenerEstadisticasTrabajoAPI() {
    return await llamarAPI('/trabajos/estadisticas');
}

// ===== UTILIDADES API =====

async function verificarSaludAPI() {
    try {
        const respuesta = await fetch(`${API_URL.replace('/api', '')}/api/health`);
        return respuesta.ok;
    } catch {
        return false;
    }
}

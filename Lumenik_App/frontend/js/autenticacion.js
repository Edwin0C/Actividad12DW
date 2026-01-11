/**
 * autenticacion.js - Manejo de autenticación y login
 */

document.addEventListener('DOMContentLoaded', () => {
    // Solo redirigir en la página de login si ya está autenticado
    const formLogin = document.getElementById('login-form');
    
    if (estaAutenticado() && formLogin) {
        // Si está en login y está autenticado, redirigir
        const usuario = obtenerUsuario();
        redirigirSegunRol(usuario.rol);
        return;
    }
    
    // Configurar formulario de login
    if (formLogin) {
        formLogin.addEventListener('submit', manejarLogin);
    }
});

/**
 * Maneja el envío del formulario de login
 */
async function manejarLogin(evento) {
    evento.preventDefault();
    
    const usuario = document.getElementById('usuario').value.trim();
    const contraseña = document.getElementById('contraseña').value;
    const mensajeError = document.getElementById('error-message');
    
    // Validaciones básicas
    if (!usuario || !contraseña) {
        mostrarError('Por favor completa todos los campos');
        return;
    }
    
    try {
        mostrarCarga(true);
        
        const respuesta = await loginAPI(usuario, contraseña);
        
        // Guardar token y información de usuario
        guardarToken(respuesta.token);
        guardarUsuario({
            id: respuesta.usuario_id,
            nombre_usuario: respuesta.nombre_usuario,
            nombre_completo: respuesta.nombre_completo,
            rol: respuesta.rol
        });
        
        mostrarCarga(false);
        mostrarNotificacion('¡Bienvenido! Redirigiendo...', 'exito');
        
        // Redirigir según rol
        setTimeout(() => {
            redirigirSegunRol(respuesta.rol);
        }, 1000);
        
    } catch (error) {
        mostrarCarga(false);
        mostrarError(error.mensaje || 'Error al iniciar sesión');
    }
}

/**
 * Muestra error en el formulario
 */
function mostrarError(mensaje) {
    const mensajeError = document.getElementById('error-message');
    if (mensajeError) {
        mensajeError.textContent = mensaje;
        mensajeError.classList.remove('hidden');
    }
    mostrarNotificacion(mensaje, 'error');
}

/**
 * Redirige al usuario según su rol
 */
function redirigirSegunRol(rol) {
    const rutas = {
        'cliente': '/dashboard_cliente.html',
        'empleado': '/dashboard_empleado.html',
        'administrador': '/dashboard_admin.html'
    };
    
    const ruta = rutas[rol] || '/index.html';
    window.location.href = ruta;
}

/**
 * Configura logout en las páginas de dashboard
 */
function configurarLogout() {
    const btnLogout = document.getElementById('logout-btn');
    if (btnLogout) {
        btnLogout.addEventListener('click', manejarLogout);
    }
    
    // Mostrar nombre del usuario
    const usuario = obtenerUsuario();
    const usuarioNombre = document.getElementById('usuario-nombre');
    if (usuario && usuarioNombre) {
        usuarioNombre.textContent = `Hola, ${usuario.nombre_completo}`;
    }
}

/**
 * Maneja el logout del usuario
 */
function manejarLogout() {
    if (confirm('¿Estás seguro de que quieres salir?')) {
        limpiarSesion();
        mostrarNotificacion('Sesión cerrada correctamente', 'exito');
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1000);
    }
}

/**
 * Verifica que el usuario está autenticado
 */
function verificarAutenticacion() {
    if (!estaAutenticado()) {
        mostrarNotificacion('Sesión expirada. Inicia sesión nuevamente', 'advertencia');
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2000);
        return false;
    }
    
    const usuario = obtenerUsuario();
    if (!usuario) {
        limpiarSesion();
        window.location.href = '/index.html';
        return false;
    }
    
    return true;
}

/**
 * Requiere un rol específico
 */
function requerirRol(rolRequerido) {
    const usuario = obtenerUsuario();
    if (!usuario || usuario.rol !== rolRequerido) {
        mostrarNotificacion('No tienes permiso para acceder a esta página', 'error');
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2000);
        return false;
    }
    return true;
}

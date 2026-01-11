/**
 * utilidades.js - Funciones auxiliares globales
 */

// Guardar token JWT en localStorage
function guardarToken(token) {
    localStorage.setItem('token_lumenik', token);
}

// Obtener token JWT de localStorage
function obtenerToken() {
    return localStorage.getItem('token_lumenik');
}

// Eliminar token JWT
function eliminarToken() {
    localStorage.removeItem('token_lumenik');
}

// Verificar si el usuario está autenticado
function estaAutenticado() {
    return !!obtenerToken();
}

// Guardar información del usuario
function guardarUsuario(usuario) {
    localStorage.setItem('usuario_lumenik', JSON.stringify(usuario));
}

// Obtener información del usuario
function obtenerUsuario() {
    const usuario = localStorage.getItem('usuario_lumenik');
    return usuario ? JSON.parse(usuario) : null;
}

// Limpiar sesión (logout)
function limpiarSesion() {
    eliminarToken();
    localStorage.removeItem('usuario_lumenik');
    localStorage.removeItem('juegos_seleccionados');
}

// Mostrar notificación (toast)
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notif = document.createElement('div');
    notif.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-semibold z-50 animate-pulse`;
    
    // Establecer color según tipo
    const colores = {
        'exito': 'bg-green-600',
        'error': 'bg-red-600',
        'info': 'bg-blue-600',
        'advertencia': 'bg-yellow-600'
    };
    notif.className += ` ${colores[tipo] || colores.info}`;
    
    notif.textContent = mensaje;
    document.body.appendChild(notif);
    
    // Eliminar después de 3 segundos
    setTimeout(() => {
        notif.remove();
    }, 3000);
}

// Formatear fecha a formato legible
function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Formatear dinero
function formatearDinero(cantidad) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
    }).format(cantidad);
}

// Validar email
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Obtener header de autenticación
function obtenerHeadersAutenticacion() {
    const token = obtenerToken();
    console.log('[DEBUG] obtenerHeadersAutenticacion() - Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    
    if (!token) {
        console.error('[ERROR] No hay token en localStorage. Usuario no autenticado.');
    }
    
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Redirigir a página de login
function irAlLogin() {
    window.location.href = '/index.html';
}

// Verificar y redirigir según rol
function verificarYRedirigir(rol) {
    const usuario = obtenerUsuario();
    if (!usuario || usuario.rol !== rol) {
        mostrarNotificacion('Acceso denegado', 'error');
        setTimeout(irAlLogin, 2000);
        return false;
    }
    return true;
}

// Spinner de carga
function mostrarCarga(mostrar = true) {
    let spinner = document.getElementById('spinner-carga');
    if (mostrar && !spinner) {
        spinner = document.createElement('div');
        spinner.id = 'spinner-carga';
        spinner.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40';
        spinner.innerHTML = `
            <div class="animate-spin">
                <div class="w-12 h-12 border-4 border-purple-600 border-t-pink-600 rounded-full"></div>
            </div>
        `;
        document.body.appendChild(spinner);
    } else if (!mostrar && spinner) {
        spinner.remove();
    }
}

// Función para navegar entre pestañas
function activarTab(nombreTab) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remover clase activa de botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('border-purple-500');
        btn.classList.add('border-transparent');
    });
    
    // Mostrar tab activo
    const tabActual = document.getElementById(`${nombreTab}-tab`);
    if (tabActual) {
        tabActual.classList.remove('hidden');
    }
    
    // Marcar botón como activo
    const btnActual = document.querySelector(`[data-tab="${nombreTab}"]`);
    if (btnActual) {
        btnActual.classList.remove('border-transparent');
        btnActual.classList.add('border-purple-500');
    }
}

// Agregar evento a todos los botones de tab
function inicializarTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            activarTab(tab);
        });
    });
    
    // Activar primer tab por defecto
    const primerTab = document.querySelector('.tab-btn');
    if (primerTab) {
        const tab = primerTab.getAttribute('data-tab');
        activarTab(tab);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarTabs);

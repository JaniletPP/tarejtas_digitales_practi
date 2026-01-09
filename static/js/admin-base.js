// ============================================
// ADMIN BASE - NAVEGACIÓN SIMPLE Y FUNCIONAL
// ============================================
// Solo maneja: cambiar secciones y dropdowns del menú
// NO formularios, NO fetch, NO QR

console.log('[Admin Base] Cargando...');

// ============================================
// FUNCIÓN PARA CAMBIAR DE SECCIÓN (GLOBAL)
// ============================================
window.cambiarSeccion = function cambiarSeccion(sectionName) {
    console.log('[Admin Base] Cambiando a sección:', sectionName);
    
    // Validar que la sección existe
    const seccionObjetivo = document.getElementById('section-' + sectionName);
    if (!seccionObjetivo) {
        console.error('[Admin Base] No se encontró la sección:', sectionName);
        return;
    }
    
    // Ocultar todas las secciones (solo cambiar clases CSS, NO destruir DOM)
    const todasLasSecciones = document.querySelectorAll('.admin-section');
    todasLasSecciones.forEach(sec => {
        sec.classList.add('hidden');
        sec.classList.remove('active');
    });
    
    // Mostrar la sección seleccionada
    seccionObjetivo.classList.remove('hidden');
    seccionObjetivo.classList.add('active');
    console.log('[Admin Base] Sección mostrada:', sectionName);
    
    // Actualizar navegación activa
    document.querySelectorAll('.nav-link, .dropdown-item').forEach(nav => {
        nav.classList.remove('active');
        if (nav.getAttribute('data-section') === sectionName) {
            nav.classList.add('active');
        }
    });
    
    // Cerrar todos los dropdowns
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        dropdown.classList.remove('active');
    });
    
    // NO cambiar hash en la URL
    // NO recargar la página
    // NO eliminar nodos del DOM
}

// ============================================
// FUNCIÓN PARA TOGGLE DE DROPDOWNS
// ============================================
function toggleDropdown(dropdownElement) {
    if (!dropdownElement) {
        console.error('[Admin Base] No se proporcionó elemento dropdown');
        return;
    }
    
    const isActive = dropdownElement.classList.contains('active');
    
    // Cerrar otros dropdowns
    document.querySelectorAll('.dropdown').forEach(d => {
        if (d !== dropdownElement) {
            d.classList.remove('active');
        }
    });
    
    // Toggle del dropdown actual
    if (isActive) {
        dropdownElement.classList.remove('active');
        console.log('[Admin Base] Dropdown cerrado');
    } else {
        dropdownElement.classList.add('active');
        console.log('[Admin Base] Dropdown abierto');
    }
}

// ============================================
// FUNCIONES PARA MODALES
// ============================================
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        console.log('[Admin Base] Modal abierto:', modalId);
    } else {
        console.error('[Admin Base] No se encontró el modal:', modalId);
    }
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        console.log('[Admin Base] Modal cerrado:', modalId);
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
let listenerGlobalAgregado = false;

function inicializarAdminBase() {
    console.log('[Admin Base] Inicializando...');
    
    // 1. Inicializar navegación por secciones (solo items que NO son dropdown-toggle)
    const navLinks = document.querySelectorAll('.nav-link[data-section]:not(.dropdown-toggle), .dropdown-item[data-section]');
    console.log('[Admin Base] Encontrados', navLinks.length, 'enlaces de navegación');
    
    navLinks.forEach(link => {
        // Remover listeners anteriores si existen
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
        
        newLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const section = this.getAttribute('data-section');
            if (section) {
                cambiarSeccion(section);
            }
        }, true);
    });
    
    // 2. Inicializar dropdowns del menú
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    console.log('[Admin Base] Encontrados', dropdownToggles.length, 'dropdown toggles');
    
    if (dropdownToggles.length === 0) {
        console.warn('[Admin Base] No se encontraron dropdown toggles');
        return;
    }
    
    dropdownToggles.forEach(toggle => {
        // Remover listeners anteriores si existen
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
        
        newToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const dropdown = this.closest('.dropdown');
            if (dropdown) {
                toggleDropdown(dropdown);
            } else {
                console.error('[Admin Base] No se encontró el dropdown padre');
            }
        }, true);
    });
    
    // 3. Cerrar dropdowns al hacer clic fuera (solo agregar una vez)
    if (!listenerGlobalAgregado) {
        document.addEventListener('click', function(e) {
            const target = e.target;
            
            // Si el click fue en el sidebar-nav o dentro de un dropdown, no hacer nada
            if (target.closest('.sidebar-nav') || target.closest('.dropdown')) {
                return;
            }
            
            // Si el click fue fuera de cualquier dropdown, cerrarlos todos
            document.querySelectorAll('.dropdown').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }, true);
        
        listenerGlobalAgregado = true;
        console.log('[Admin Base] Listener global agregado');
    }
    
    // 4. Inicializar botones de modales
    const btnNuevoAsistente = document.getElementById('btnNuevoAsistente');
    if (btnNuevoAsistente) {
        btnNuevoAsistente.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            abrirModal('modalAsistenteAdmin');
        });
        console.log('[Admin Base] Botón Nuevo Asistente inicializado');
    }
    
    const btnNuevoProducto = document.getElementById('btnNuevoProductoAdmin');
    if (btnNuevoProducto) {
        btnNuevoProducto.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            abrirModal('modalProductoAdmin');
        });
        console.log('[Admin Base] Botón Nuevo Producto inicializado');
    }
    
    // 5. Inicializar botones de cerrar modales
    const cerrarModalAsistente = document.getElementById('cerrarModalAsistenteAdmin');
    if (cerrarModalAsistente) {
        cerrarModalAsistente.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            cerrarModal('modalAsistenteAdmin');
        });
    }
    
    const cerrarModalProducto = document.getElementById('cerrarModalProductoAdmin');
    if (cerrarModalProducto) {
        cerrarModalProducto.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            cerrarModal('modalProductoAdmin');
        });
    }
    
    // Botones de cancelar en modales
    const btnCancelarAsistente = document.getElementById('btnCancelarAsistenteAdmin');
    if (btnCancelarAsistente) {
        btnCancelarAsistente.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            cerrarModal('modalAsistenteAdmin');
        });
        console.log('[Admin Base] Botón Cancelar Asistente inicializado');
    }
    
    const btnCancelarProducto = document.getElementById('btnCancelarProductoAdmin');
    if (btnCancelarProducto) {
        btnCancelarProducto.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            cerrarModal('modalProductoAdmin');
        });
        console.log('[Admin Base] Botón Cancelar Producto inicializado');
    }
    
    // 6. Cerrar modales al hacer clic fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
    
    // 7. Prevenir que formularios de reportes cambien de sección
    const formFiltrosVentas = document.getElementById('formFiltrosVentas');
    if (formFiltrosVentas) {
        formFiltrosVentas.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('[Admin Base] Formulario de filtros de ventas - submit prevenido para mantener sección');
            // Aquí se puede agregar la lógica de consulta sin cambiar de sección
        });
    }
    
    const formFiltrosTransacciones = document.getElementById('formFiltrosTransacciones');
    if (formFiltrosTransacciones) {
        formFiltrosTransacciones.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('[Admin Base] Formulario de filtros de transacciones - submit prevenido para mantener sección');
            // Aquí se puede agregar la lógica de consulta sin cambiar de sección
        });
    }
    
    // Prevenir que otros formularios cambien de sección accidentalmente
    document.querySelectorAll('form').forEach(form => {
        if (form.id !== 'formFiltrosVentas' && form.id !== 'formFiltrosTransacciones') {
            form.addEventListener('submit', function(e) {
                // Solo prevenir propagación, no el submit (para que funcione el backend)
                e.stopPropagation();
            });
        }
    });
    
    // 8. Cargar sección inicial (dashboard)
    cambiarSeccion('dashboard');
    
    console.log('[Admin Base] Inicialización completa');
}

// ============================================
// EJECUTAR CUANDO EL DOM ESTÉ LISTO
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAdminBase);
} else {
    // DOM ya está listo
    inicializarAdminBase();
}

// También ejecutar después de un delay (útil después de redirecciones/login)
setTimeout(() => {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    if (dropdownToggles.length > 0) {
        console.log('[Admin Base] Re-inicializando después del delay (post-login)...');
        inicializarAdminBase();
    } else {
        console.warn('[Admin Base] No se encontraron dropdowns después del delay');
    }
}, 500);

// Re-inicializar cuando la página esté completamente cargada
window.addEventListener('load', () => {
    setTimeout(() => {
        const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
        if (dropdownToggles.length > 0) {
            console.log('[Admin Base] Re-inicializando después de window.load...');
            inicializarAdminBase();
        }
    }, 300);
});

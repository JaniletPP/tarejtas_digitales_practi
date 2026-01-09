// Script para panel de administración

// Variables globales para navegación
let ignorarHashChange = false;
let seccionActual = null;

// Función para hacer peticiones (soporta FormData)
async function hacerPeticion(url, options = {}) {
    try {
        const headers = { ...options.headers };
        
        // Si el body es FormData, no establecer Content-Type (el navegador lo hace automáticamente)
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
        
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        const data = await response.json();
        return { response, data };
    } catch (error) {
        return { error: error.message };
    }
}

// Función para cambiar de sección (disponible globalmente)
window.cambiarSeccion = function cambiarSeccion(sectionName, actualizarHash = true) {
    console.log('[Navegación] Cambiando a sección:', sectionName, 'Actualizar hash:', actualizarHash);
    
    // Si ya estamos en esa sección, no hacer nada
    if (seccionActual === sectionName) {
        console.log('[Navegación] Ya estamos en la sección', sectionName);
        return;
    }
    
    seccionActual = sectionName;
    
    // Actualizar navegación activa
    document.querySelectorAll('.nav-link, .dropdown-item').forEach(nav => {
        nav.classList.remove('active');
        if (nav.getAttribute('data-section') === sectionName) {
            nav.classList.add('active');
        }
    });
    
    // Cerrar otros dropdowns
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        dropdown.classList.remove('active');
    });
    
    // Mostrar sección correspondiente
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
    const targetSection = document.getElementById(`section-${sectionName}`);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Actualizar título de la página
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = targetSection.querySelector('h2')?.textContent || 'Dashboard General';
        }
        
        // Actualizar hash solo si se solicita (para evitar loops)
        if (actualizarHash) {
            ignorarHashChange = true;
            const currentHash = window.location.hash.substring(1);
            if (currentHash !== sectionName) {
                window.location.hash = sectionName;
            }
            // Resetear la bandera después de un tiempo
            setTimeout(() => {
                ignorarHashChange = false;
            }, 100);
        }
        
        console.log('[Navegación] Sección cambiada exitosamente a:', sectionName);
    } else {
        console.error('[Navegación] No se encontró la sección:', sectionName);
    }
}

// Variable para controlar si el listener global ya está agregado
let listenerGlobalAgregado = false;

// Inicializar navegación y dropdowns (función global)
window.inicializarNavegacion = function inicializarNavegacion() {
    console.log('[Navegación] Inicializando...');
    
    // Navegación entre secciones (solo para items que no son dropdown-toggle)
    const navItems = document.querySelectorAll('.nav-link:not(.dropdown-toggle), .dropdown-item');
    console.log('[Navegación] Encontrados', navItems.length, 'items de navegación');
    
    navItems.forEach(item => {
        // Remover listeners anteriores si existen
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const section = this.getAttribute('data-section');
            
            if (!section) {
                console.warn('[Navegación] Item sin data-section:', this);
                return;
            }
            
            console.log('[Navegación] Click en item de navegación, sección:', section);
            
            // Cambiar sección
            if (typeof window.cambiarSeccion === 'function') {
                window.cambiarSeccion(section, false);
            } else {
                console.error('[Navegación] cambiarSeccion no está disponible');
            }
            
            // Cerrar dropdowns después de seleccionar
            document.querySelectorAll('.dropdown').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }, true);
    });

    // Manejo de menús desplegables
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    console.log('[Navegación] Encontrados', dropdownToggles.length, 'dropdown toggles');
    
    if (dropdownToggles.length === 0) {
        console.warn('[Navegación] No se encontraron dropdown toggles - puede que el DOM no esté listo');
        return;
    }
    
    dropdownToggles.forEach((toggle, index) => {
        // Remover listeners anteriores
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
        
        newToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const dropdown = this.closest('.dropdown');
            if (!dropdown) {
                console.error('[Navegación] No se encontró el dropdown padre');
                return;
            }
            
            const menu = dropdown.querySelector('.dropdown-menu');
            if (!menu) {
                console.error('[Navegación] No se encontró el menú dropdown');
                return;
            }
            
            console.log('[Navegación] Click en dropdown toggle', index);
            
            // Cerrar otros dropdowns
            document.querySelectorAll('.dropdown').forEach(d => {
                if (d !== dropdown) {
                    d.classList.remove('active');
                }
            });
            
            // Toggle del dropdown actual
            dropdown.classList.toggle('active');
            const isActive = dropdown.classList.contains('active');
            
            console.log('[Navegación] Dropdown ahora está:', isActive ? 'activo' : 'inactivo');
            console.log('[Navegación] Menú display:', window.getComputedStyle(menu).display);
            console.log('[Navegación] Menú visibility:', window.getComputedStyle(menu).visibility);
        }, true);
    });

    // Cerrar dropdowns al hacer clic fuera (solo agregar una vez)
    if (!listenerGlobalAgregado) {
        document.addEventListener('click', function(e) {
            const target = e.target;
            
            // Ignorar clicks en elementos del sidebar (incluyendo dropdowns)
            if (target.closest('.sidebar-nav') || target.closest('.dropdown')) {
                return;
            }
            
            // Ignorar clicks en elementos interactivos dentro de secciones
            if (target.closest('.admin-section')) {
                const isButton = target.tagName === 'BUTTON' || target.closest('button');
                const isInput = target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA';
                const isForm = target.tagName === 'FORM' || target.closest('form');
                const isModal = target.closest('.modal');
                
                if (isButton || isInput || isForm || isModal) {
                    return;
                }
            }
            
            // Si el click fue fuera de cualquier dropdown, cerrarlos todos
            document.querySelectorAll('.dropdown').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }, true);
        
        listenerGlobalAgregado = true;
        console.log('[Navegación] Listener global agregado');
    }
    
    console.log('[Navegación] Inicialización completa');
}

// Función para inicializar navegación de forma segura
function inicializarNavegacionSegura() {
    // Verificar que los elementos existan
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    if (dropdownToggles.length === 0) {
        console.warn('[Navegación] Elementos no encontrados, reintentando...');
        setTimeout(inicializarNavegacionSegura, 200);
        return;
    }
    
    console.log('[Navegación] Elementos encontrados, inicializando...');
    inicializarNavegacion();
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarNavegacionSegura);
} else {
    // DOM ya está listo
    inicializarNavegacionSegura();
}

// También ejecutar después de un pequeño delay para asegurar que todo esté cargado (especialmente después del login)
setTimeout(() => {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    if (dropdownToggles.length > 0) {
        console.log('[Navegación] Re-inicializando después del delay (post-login)...');
        inicializarNavegacion();
    } else {
        console.warn('[Navegación] No se encontraron dropdowns después del delay');
    }
}, 500);

// Re-inicializar cuando la página esté completamente cargada (útil después de redirecciones)
window.addEventListener('load', () => {
    setTimeout(() => {
        const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
        if (dropdownToggles.length > 0) {
            console.log('[Navegación] Re-inicializando después de window.load...');
            inicializarNavegacion();
        }
    }, 300);
});

// Verificar si hay un hash en la URL para cargar sección específica (solo al cargar)
window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash;
    if (hash) {
        const sectionName = hash.substring(1);
        seccionActual = sectionName;
        setTimeout(() => {
            if (typeof window.cambiarSeccion === 'function') {
                window.cambiarSeccion(sectionName);
            }
        }, 100);
    } else {
        // Si no hay hash, mostrar dashboard por defecto
        seccionActual = 'dashboard';
        if (typeof window.cambiarSeccion === 'function') {
            window.cambiarSeccion('dashboard');
        }
    }
});

// Escuchar cambios en el hash (pero solo si no lo ignoramos)
window.addEventListener('hashchange', (e) => {
    if (ignorarHashChange) {
        ignorarHashChange = false;
        return;
    }
    
    const hash = window.location.hash;
    if (hash) {
        const sectionName = hash.substring(1);
        // Solo cambiar si es diferente a la sección actual
        if (sectionName !== seccionActual) {
            seccionActual = sectionName;
            if (typeof window.cambiarSeccion === 'function') {
                window.cambiarSeccion(sectionName);
            }
        }
    }
});

// Cargar estadísticas del dashboard
async function cargarEstadisticas() {
    try {
        // Cargar asistentes
        const { data: asistentesData } = await hacerPeticion('/api/asistentes', { method: 'GET' });
        if (asistentesData.success) {
            document.getElementById('totalAsistentes').textContent = asistentesData.data.length;
        }
        
        // TODO: Agregar endpoints para otras estadísticas
        document.getElementById('totalTarjetas').textContent = '-';
        document.getElementById('totalSaldo').textContent = '-';
        document.getElementById('totalTransacciones').textContent = '-';
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Función para abrir modal de nuevo asistente (disponible globalmente)
function abrirModalNuevoAsistente() {
    const modal = document.getElementById('modalAsistenteAdmin');
    if (!modal) {
        console.error('No se encontró el modal de asistentes');
        if (typeof showAlert !== 'undefined') {
            showAlert('error', 'No se encontró el modal de asistentes');
        }
        return;
    }
    
    // Limpiar formulario
    const form = document.getElementById('formAsistenteAdmin');
    if (form) {
        form.reset();
    }
    
    // Limpiar errores
    document.querySelectorAll('#formAsistenteAdmin .form-group').forEach(group => {
        group.classList.remove('error');
    });
    
    // Actualizar título
    const titulo = document.getElementById('modalAsistenteTitulo');
    if (titulo) {
        titulo.textContent = '➕ Registrar Nuevo Asistente';
    }
    
    // Actualizar botón
    const btnGuardar = document.getElementById('btnGuardarAsistenteAdmin');
    if (btnGuardar) {
        btnGuardar.innerHTML = '<span class="btn-text">Registrar Asistente</span><span class="btn-loader" style="display: none;">⏳</span>';
    }
    
    // Abrir modal
    modal.classList.add('show');
    
    // Focus en nombre
    setTimeout(() => {
        const inputNombre = document.getElementById('asistenteNombreAdmin');
        if (inputNombre) inputNombre.focus();
    }, 100);
}

// Hacer función global
window.abrirModalNuevoAsistente = abrirModalNuevoAsistente;

// Cerrar modal de asistente
function cerrarModalAsistente() {
    const modal = document.getElementById('modalAsistenteAdmin');
    if (modal) {
        modal.classList.remove('show');
        document.getElementById('formAsistenteAdmin')?.reset();
        
        // Limpiar errores
        document.querySelectorAll('#formAsistenteAdmin .form-group').forEach(group => {
            group.classList.remove('error');
        });
    }
}

// Función para registrar asistente (disponible globalmente)
async function registrarAsistenteAdmin(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }
    
    console.log('[Asistentes] Iniciando registro de asistente...');
    
    const nombreInput = document.getElementById('asistenteNombreAdmin');
    const emailInput = document.getElementById('asistenteEmailAdmin');
    const telefonoInput = document.getElementById('asistenteTelefonoAdmin');
    
    if (!nombreInput) {
        console.error('[Asistentes] No se encontró el input de nombre');
        showAlert('error', 'Error: No se encontró el formulario');
        return;
    }
    
    const nombre = nombreInput.value.trim();
    const email = emailInput ? emailInput.value.trim() || null : null;
    const telefono = telefonoInput ? telefonoInput.value.trim() || null : null;
    
    console.log('[Asistentes] Datos del formulario:', { nombre, email, telefono });
    
    // Validación
    if (!nombre) {
        console.warn('[Asistentes] Validación fallida: nombre vacío');
        showAlert('error', 'El nombre es obligatorio');
        const nombreGroup = nombreInput.closest('.form-group');
        if (nombreGroup) {
            nombreGroup.classList.add('error');
            const errorElement = nombreGroup.querySelector('.form-error');
            if (errorElement) {
                errorElement.textContent = 'El nombre es obligatorio';
            }
        }
        return;
    }
    
    // Validar email si se proporciona
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.warn('[Asistentes] Validación fallida: email inválido');
        showAlert('error', 'El formato del email no es válido');
        return;
    }
    
    // Deshabilitar botón
    const btnGuardar = document.getElementById('btnGuardarAsistenteAdmin');
    if (!btnGuardar) {
        console.error('[Asistentes] No se encontró el botón de guardar');
        showAlert('error', 'Error: No se encontró el botón de guardar');
        return;
    }
    
    const btnText = btnGuardar.querySelector('.btn-text');
    const btnLoader = btnGuardar.querySelector('.btn-loader');
    const wasDisabled = btnGuardar.disabled;
    btnGuardar.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'inline-block';
    
    try {
        const formData = {
            nombre,
            email,
            telefono
        };
        
        console.log('[Asistentes] Enviando petición POST a /api/asistentes con datos:', formData);
        
        const { response, data, error } = await hacerPeticion('/api/asistentes', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        console.log('[Asistentes] Respuesta recibida:', { response, data, error });
        
        if (error) {
            console.error('[Asistentes] Error en la petición:', error);
            showAlert('error', `Error de conexión: ${error}`);
            return;
        }
        
        if (!response) {
            console.error('[Asistentes] No se recibió respuesta del servidor');
            showAlert('error', 'No se recibió respuesta del servidor');
            return;
        }
        
        if (!response.ok) {
            console.error('[Asistentes] Respuesta del servidor no OK:', response.status, response.statusText);
            const errorMessage = data?.error || `Error del servidor (${response.status})`;
            showAlert('error', errorMessage);
            return;
        }
        
        if (!data || !data.success) {
            console.error('[Asistentes] Respuesta sin éxito:', data);
            const errorMessage = data?.error || 'Error al registrar el asistente';
            showAlert('error', errorMessage);
            return;
        }
        
        console.log('[Asistentes] Asistente registrado exitosamente:', data.data);
        
        showAlert('success', `Asistente "${nombre}" registrado correctamente. ID: ${data.data.id}`, 'Registro Exitoso');
        
        // Cerrar modal
        cerrarModalAsistente();
        
        // Recargar lista si está visible
        const listaDiv = document.getElementById('listaAsistentesAdmin');
        if (listaDiv && listaDiv.classList.contains('show')) {
            console.log('[Asistentes] Recargando lista de asistentes...');
            const btnCargar = document.getElementById('btnCargarAsistentes');
            if (btnCargar) {
                btnCargar.click();
            }
        }
        
        // Actualizar estadísticas
        if (typeof cargarEstadisticas === 'function') {
            cargarEstadisticas();
        }
        
    } catch (error) {
        console.error('[Asistentes] Excepción al registrar asistente:', error);
        showAlert('error', `Error inesperado: ${error.message || 'Error al registrar el asistente'}`);
    } finally {
        // Rehabilitar botón
        if (btnGuardar) {
            btnGuardar.disabled = wasDisabled;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';
        }
    }
}

// Registrar asistente desde admin - Inicializar event listener
function inicializarFormularioAsistente() {
    console.log('[Asistentes] Inicializando formulario de asistente...');
    
    const formAsistenteAdmin = document.getElementById('formAsistenteAdmin');
    if (!formAsistenteAdmin) {
        console.warn('[Asistentes] Formulario no encontrado, reintentando...');
        setTimeout(inicializarFormularioAsistente, 200);
        return;
    }
    
    console.log('[Asistentes] Formulario encontrado, agregando event listener...');
    
    // Remover listeners anteriores si existen
    const newForm = formAsistenteAdmin.cloneNode(true);
    formAsistenteAdmin.parentNode.replaceChild(newForm, formAsistenteAdmin);
    
    newForm.addEventListener('submit', registrarAsistenteAdmin, true);
    
    console.log('[Asistentes] Event listener agregado correctamente');
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarFormularioAsistente);
} else {
    inicializarFormularioAsistente();
}

// También ejecutar después de un delay para asegurar que el modal esté disponible
setTimeout(inicializarFormularioAsistente, 500);
    
    // Cerrar modal
    const cerrarModalAsistenteBtn = document.getElementById('cerrarModalAsistenteAdmin');
    if (cerrarModalAsistenteBtn) {
        cerrarModalAsistenteBtn.addEventListener('click', cerrarModalAsistente);
    }
    
    const btnCancelarAsistente = document.getElementById('btnCancelarAsistenteAdmin');
    if (btnCancelarAsistente) {
        btnCancelarAsistente.addEventListener('click', cerrarModalAsistente);
    }
    
    // Cerrar modal al hacer clic fuera
    const modalAsistente = document.getElementById('modalAsistenteAdmin');
    if (modalAsistente) {
        modalAsistente.addEventListener('click', (e) => {
            if (e.target.id === 'modalAsistenteAdmin') {
                cerrarModalAsistente();
            }
        });
    }
    
    // La función ya es global, no necesitamos asignarla de nuevo
});

// Cargar estadísticas al entrar al dashboard
document.addEventListener('DOMContentLoaded', () => {
    cargarEstadisticas();
    
    // Asegurar que los botones tengan event listeners
    const btnNuevoAsistente = document.getElementById('btnNuevoAsistente');
    if (btnNuevoAsistente) {
        btnNuevoAsistente.addEventListener('click', function(e) {
            e.preventDefault();
            if (window.abrirModalNuevoAsistente) {
                window.abrirModalNuevoAsistente();
            } else {
                console.error('❌ abrirModalNuevoAsistente no está disponible');
            }
        });
        console.log('✅ Event listener agregado a btnNuevoAsistente');
    } else {
        console.error('❌ No se encontró btnNuevoAsistente');
    }
    
    // Verificar que los scripts se cargaron
    console.log('Admin.js cargado correctamente');
    console.log('showAlert disponible:', typeof showAlert !== 'undefined');
    console.log('hacerPeticion disponible:', typeof hacerPeticion !== 'undefined');
});

// Gestión de asistentes en admin
document.getElementById('btnCargarAsistentes')?.addEventListener('click', async () => {
    const { response, data, error } = await hacerPeticion('/api/asistentes', { method: 'GET' });
    
    if (error) {
        showAlert('error', `Error: ${error}`);
        return;
    }
    
    if (data.success) {
        const listaDiv = document.getElementById('listaAsistentesAdmin');
        
        if (data.data.length === 0) {
            listaDiv.className = 'resultado show info';
            listaDiv.textContent = 'No hay asistentes registrados.';
            return;
        }
        
        let tablaHTML = '<table><thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Fecha</th></tr></thead><tbody>';
        
        data.data.forEach(asistente => {
            tablaHTML += `
                <tr>
                    <td>${asistente.id}</td>
                    <td>${asistente.nombre}</td>
                    <td>${asistente.email || 'N/A'}</td>
                    <td>${asistente.telefono || 'N/A'}</td>
                    <td>${new Date(asistente.fecha_registro).toLocaleString('es-ES')}</td>
                </tr>
            `;
        });
        
        tablaHTML += '</tbody></table>';
        listaDiv.className = 'resultado show success';
        listaDiv.innerHTML = `<p><strong>Total:</strong> ${data.data.length} asistente(s)</p>${tablaHTML}`;
    }
});

// ============================================
// GESTIÓN MEJORADA DE ASIGNACIÓN DE TARJETAS
// ============================================

let listaAsistentes = [];
let asistenteSeleccionado = null;
let tarjetaEstado = null;

// Cargar lista de asistentes sin tarjeta al iniciar
async function cargarAsistentes() {
    try {
        const { data, error } = await hacerPeticion('/api/asistentes/sin-tarjeta', { method: 'GET' });
        if (error || !data.success) {
            console.error('Error cargando asistentes:', error || data.error);
            return;
        }
        listaAsistentes = data.data || [];
    } catch (error) {
        console.error('Error cargando asistentes:', error);
    }
}

// Búsqueda de asistentes
function buscarAsistentes(termino) {
    if (!termino || termino.length < 2) {
        return [];
    }
    
    const busqueda = termino.toLowerCase();
    return listaAsistentes.filter(asistente => {
        const nombre = (asistente.nombre || '').toLowerCase();
        const email = (asistente.email || '').toLowerCase();
        const telefono = (asistente.telefono || '').toLowerCase();
        const id = String(asistente.id || '');
        
        return nombre.includes(busqueda) || 
               email.includes(busqueda) || 
               telefono.includes(busqueda) ||
               id.includes(busqueda);
    }).slice(0, 10); // Limitar a 10 resultados
}

// Mostrar dropdown de asistentes
function mostrarDropdownAsistentes(resultados) {
    const dropdown = document.getElementById('asistenteDropdown');
    if (!dropdown) return;
    
    if (resultados.length === 0) {
        dropdown.innerHTML = '<div class="asistente-dropdown-empty">No se encontraron asistentes sin tarjeta</div>';
        dropdown.classList.add('show');
        return;
    }
    
    dropdown.innerHTML = resultados.map(asistente => {
        const contacto = asistente.email || asistente.telefono || 'Sin contacto';
        const contactoLabel = asistente.email ? '📧 ' : asistente.telefono ? '📱 ' : '';
        return `
            <div class="asistente-dropdown-item" data-id="${asistente.id}">
                <div class="asistente-dropdown-info">
                    <span class="asistente-dropdown-nombre">${asistente.nombre}</span>
                    <span class="asistente-dropdown-contacto">${contactoLabel}${contacto}</span>
                </div>
                <span class="asistente-dropdown-badge">Sin tarjeta</span>
            </div>
        `;
    }).join('');
    
    dropdown.classList.add('show');
    
    // Agregar event listeners a los items
    dropdown.querySelectorAll('.asistente-dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.getAttribute('data-id'));
            seleccionarAsistente(id);
        });
    });
}

// Seleccionar asistente
function seleccionarAsistente(asistenteId) {
    const asistente = listaAsistentes.find(a => a.id === asistenteId);
    if (!asistente) return;
    
    asistenteSeleccionado = asistente;
    
    // Ocultar dropdown y campo de búsqueda
    document.getElementById('asistenteDropdown').classList.remove('show');
    document.getElementById('buscarAsistenteAdmin').style.display = 'none';
    
    // Mostrar asistente seleccionado
    document.getElementById('asistente_id_admin').value = asistente.id;
    document.getElementById('asistenteNombreMostrar').textContent = asistente.nombre;
    const contacto = asistente.email || asistente.telefono || 'Sin contacto';
    const contactoLabel = asistente.email ? '📧 ' : asistente.telefono ? '📱 ' : '';
    document.getElementById('asistenteContactoMostrar').textContent = contactoLabel + contacto;
    document.getElementById('asistenteSeleccionado').style.display = 'flex';
    
    actualizarVistaPrevia();
}

// Limpiar selección de asistente
function limpiarAsistente() {
    asistenteSeleccionado = null;
    document.getElementById('asistente_id_admin').value = '';
    document.getElementById('buscarAsistenteAdmin').value = '';
    document.getElementById('buscarAsistenteAdmin').style.display = 'block';
    document.getElementById('asistenteSeleccionado').style.display = 'none';
    document.getElementById('asistenteDropdown').classList.remove('show');
    actualizarVistaPrevia();
}

// Verificar estado de tarjeta
async function verificarTarjeta(numeroTarjeta) {
    if (!numeroTarjeta || numeroTarjeta.length < 11) {
        tarjetaEstado = null;
        ocultarEstadoTarjeta();
        return;
    }
    
    // Validar formato básico
    if (!numeroTarjeta.match(/^TARJ-\d{6}$/)) {
        mostrarEstadoTarjeta('error', 'Formato inválido. Debe ser TARJ-XXXXXX');
        tarjetaEstado = { existe: false, activa: false, asignada: false };
        actualizarVistaPrevia();
        return;
    }
    
    try {
        const { data, error } = await hacerPeticion(`/api/tarjetas/verificar/${numeroTarjeta}`, {
            method: 'GET'
        });
        
        if (error) {
            mostrarEstadoTarjeta('error', 'Error al verificar tarjeta');
            tarjetaEstado = null;
            return;
        }
        
        if (data.success) {
            tarjetaEstado = data.data;
            
            if (!tarjetaEstado.existe) {
                mostrarEstadoTarjeta('info', '✅ Tarjeta disponible. Puede ser asignada.');
            } else if (tarjetaEstado.asignada && tarjetaEstado.activa) {
                mostrarEstadoTarjeta('warning', `⚠️ Tarjeta ya asignada a: ${tarjetaEstado.asistente_nombre}`);
            } else if (!tarjetaEstado.activa) {
                mostrarEstadoTarjeta('info', 'ℹ️ Tarjeta inactiva. Se reactivará al asignar.');
            } else {
                mostrarEstadoTarjeta('success', '✅ Tarjeta disponible');
            }
            
            actualizarVistaPrevia();
        }
    } catch (error) {
        console.error('Error verificando tarjeta:', error);
        mostrarEstadoTarjeta('error', 'Error al verificar tarjeta');
    }
}

// Mostrar estado de tarjeta
function mostrarEstadoTarjeta(tipo, mensaje) {
    const estadoDiv = document.getElementById('tarjetaEstado');
    if (!estadoDiv) return;
    
    estadoDiv.className = `tarjeta-estado ${tipo}`;
    estadoDiv.textContent = mensaje;
    estadoDiv.style.display = 'block';
}

// Ocultar estado de tarjeta
function ocultarEstadoTarjeta() {
    const estadoDiv = document.getElementById('tarjetaEstado');
    if (estadoDiv) {
        estadoDiv.style.display = 'none';
    }
}

// Actualizar vista previa
function actualizarVistaPrevia() {
    const vistaPrevia = document.getElementById('vistaPreviaAsignacion');
    if (!vistaPrevia) return;
    
    const tieneAsistente = asistenteSeleccionado !== null;
    const tieneTarjeta = document.getElementById('numero_tarjeta_admin').value.trim().length >= 11;
    
    // Mostrar información del asistente incluso si no hay tarjeta
    if (tieneAsistente) {
        document.getElementById('previewAsistente').textContent = asistenteSeleccionado.nombre;
        const contacto = asistenteSeleccionado.email || asistenteSeleccionado.telefono || 'Sin contacto';
        const contactoLabel = asistenteSeleccionado.email ? '📧 ' : asistenteSeleccionado.telefono ? '📱 ' : '';
        
        // Actualizar información de contacto
        const previewContacto = document.getElementById('previewContacto');
        if (previewContacto) {
            previewContacto.textContent = contactoLabel + contacto;
        }
        
        // Mostrar estado del asistente
        const previewEstadoAsistente = document.getElementById('previewEstadoAsistente');
        if (previewEstadoAsistente) {
            previewEstadoAsistente.textContent = '✅ Este asistente no tiene tarjeta asignada';
            previewEstadoAsistente.className = 'preview-value success';
        }
    }
    
    if (!tieneAsistente) {
        vistaPrevia.style.display = 'none';
        return;
    }
    
    // Si hay asistente pero no tarjeta, mostrar mensaje
    if (!tieneTarjeta) {
        document.getElementById('previewTarjeta').textContent = 'Pendiente';
        document.getElementById('previewEstado').textContent = '⏳ Ingresa el número de tarjeta';
        document.getElementById('previewEstado').className = 'preview-value info';
        vistaPrevia.style.display = 'block';
        return;
    }
    
    const numeroTarjeta = document.getElementById('numero_tarjeta_admin').value.trim().toUpperCase();
    
    // Actualizar información de tarjeta
    document.getElementById('previewTarjeta').textContent = numeroTarjeta;
    
    // Estado
    let estadoTexto = '';
    let estadoClass = '';
    
    if (tarjetaEstado) {
        if (!tarjetaEstado.existe) {
            estadoTexto = '✅ Nueva tarjeta - Lista para asignar';
            estadoClass = 'success';
        } else if (tarjetaEstado.asignada && tarjetaEstado.activa) {
            estadoTexto = `⚠️ Ya asignada a: ${tarjetaEstado.asistente_nombre}`;
            estadoClass = 'warning';
        } else if (!tarjetaEstado.activa) {
            estadoTexto = 'ℹ️ Tarjeta inactiva - Se reactivará';
            estadoClass = 'info';
        } else {
            estadoTexto = '✅ Disponible';
            estadoClass = 'success';
        }
    } else {
        estadoTexto = '⏳ Verificando...';
        estadoClass = 'info';
    }
    
    document.getElementById('previewEstado').textContent = estadoTexto;
    document.getElementById('previewEstado').className = `preview-value ${estadoClass}`;
    
    vistaPrevia.style.display = 'block';
}

// Limpiar formulario
function limpiarFormularioAsignacion() {
    limpiarAsistente();
    document.getElementById('numero_tarjeta_admin').value = '';
    tarjetaEstado = null;
    ocultarEstadoTarjeta();
    document.getElementById('vistaPreviaAsignacion').style.display = 'none';
    document.getElementById('resultadoAsignarAdmin').className = 'resultado';
    document.getElementById('resultadoAsignarAdmin').innerHTML = '';
}

// Inicializar eventos de asignación de tarjeta
document.addEventListener('DOMContentLoaded', () => {
    // Cargar asistentes al iniciar
    cargarAsistentes();
    
    // Búsqueda de asistentes
    const buscarInput = document.getElementById('buscarAsistenteAdmin');
    if (buscarInput) {
        buscarInput.addEventListener('input', (e) => {
            const termino = e.target.value.trim();
            if (termino.length >= 2) {
                const resultados = buscarAsistentes(termino);
                mostrarDropdownAsistentes(resultados);
            } else {
                document.getElementById('asistenteDropdown').classList.remove('show');
            }
        });
        
        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.asistente-selector-container')) {
                document.getElementById('asistenteDropdown').classList.remove('show');
            }
        });
    }
    
    // Limpiar selección de asistente
    const btnClearAsistente = document.getElementById('btnClearAsistente');
    if (btnClearAsistente) {
        btnClearAsistente.addEventListener('click', limpiarAsistente);
    }
    
    // Verificar tarjeta al escribir
    const numeroTarjetaInput = document.getElementById('numero_tarjeta_admin');
    if (numeroTarjetaInput) {
        numeroTarjetaInput.addEventListener('input', (e) => {
            const valor = e.target.value.trim().toUpperCase();
            e.target.value = valor;
            
            // Formatear automáticamente
            if (valor.length > 4 && valor[4] !== '-') {
                const parte1 = valor.substring(0, 4);
                const parte2 = valor.substring(4).replace(/\D/g, '').substring(0, 6);
                e.target.value = parte1 + (parte2 ? '-' + parte2 : '');
            }
            
            verificarTarjeta(e.target.value);
            actualizarVistaPrevia();
        });
        
        numeroTarjetaInput.addEventListener('blur', () => {
            actualizarVistaPrevia();
        });
    }
    
});

// Inicializar eventos cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    // Botón limpiar formulario
    const btnLimpiar = document.getElementById('btnLimpiarFormulario');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFormularioAsignacion);
    }
});

// Asignar tarjeta desde admin (versión mejorada)
document.getElementById('formAsignarTarjetaAdmin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    const asistente_id = document.getElementById('asistente_id_admin').value;
    const numero_tarjeta = document.getElementById('numero_tarjeta_admin').value.trim().toUpperCase();
    
    // Validaciones
    if (!asistente_id) {
        showAlert('error', 'Por favor selecciona un asistente');
        return;
    }
    
    if (!numero_tarjeta || numero_tarjeta.length !== 11) {
        showAlert('error', 'Por favor ingresa un número de tarjeta válido (TARJ-XXXXXX)');
        return;
    }
    
    // Validar formato
    if (!numero_tarjeta.match(/^TARJ-\d{6}$/)) {
        showAlert('error', 'Formato inválido. Debe ser TARJ-XXXXXX');
        return;
    }
    
    // Verificar si la tarjeta ya está asignada a otro asistente
    if (tarjetaEstado && tarjetaEstado.existe && tarjetaEstado.asignada && tarjetaEstado.activa) {
        if (tarjetaEstado.asistente_id !== parseInt(asistente_id)) {
            showAlert('error', `Esta tarjeta ya está asignada a: ${tarjetaEstado.asistente_nombre}`);
            return;
        }
    }
    
    // Deshabilitar botón
    const btnAsignar = document.getElementById('btnAsignarTarjeta');
    const btnText = btnAsignar.querySelector('.btn-text');
    const btnLoader = btnAsignar.querySelector('.btn-loader');
    btnAsignar.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'inline-block';
    
    try {
        const { response, data, error } = await hacerPeticion('/api/tarjetas/asignar', {
            method: 'POST',
            body: JSON.stringify({ 
                asistente_id: parseInt(asistente_id),
                numero_tarjeta: numero_tarjeta
            })
        });
        
        if (error) {
            showAlert('error', `Error: ${error}`);
            return;
        }
        
        if (data.success) {
            // Mostrar confirmación visual clara y profesional
            const resultadoDiv = document.getElementById('resultadoAsignarAdmin');
            resultadoDiv.className = 'resultado show success';
            resultadoDiv.innerHTML = `
                <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 12px; color: white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                    <div style="font-size: 64px; margin-bottom: 20px; animation: scaleIn 0.3s ease-out;">✅</div>
                    <h3 style="color: white; margin-bottom: 16px; font-size: 24px; font-weight: 600;">Tarjeta Asignada Correctamente</h3>
                    <div style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); border-radius: 8px; padding: 20px; margin: 20px 0; text-align: left; display: inline-block; min-width: 300px;">
                        <p style="font-size: 16px; margin-bottom: 12px; color: white;">
                            <strong style="display: inline-block; width: 140px;">💳 Tarjeta:</strong>
                            <span style="font-family: monospace; font-size: 18px; font-weight: 600;">${data.data.numero_tarjeta}</span>
                        </p>
                        <p style="font-size: 16px; margin-bottom: 12px; color: white;">
                            <strong style="display: inline-block; width: 140px;">👤 Asignada a:</strong>
                            <span style="font-weight: 500;">${data.data.asistente_nombre}</span>
                        </p>
                        <p style="font-size: 14px; color: rgba(255, 255, 255, 0.9); margin-top: 16px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 12px;">
                            La tarjeta ha sido asignada exitosamente al asistente.
                        </p>
                    </div>
                </div>
            `;
            
            showAlert('success', `Tarjeta ${data.data.numero_tarjeta} asignada correctamente a ${data.data.asistente_nombre}`, 'Asignación Exitosa');
            
            // Recargar lista de asistentes (para excluir al que ya tiene tarjeta)
            cargarAsistentes();
            
            // Limpiar formulario después de 4 segundos
            setTimeout(() => {
                limpiarFormularioAsignacion();
            }, 4000);
            
            // Actualizar estadísticas
            cargarEstadisticas();
        } else {
            showAlert('error', data.error || 'Error al asignar la tarjeta');
        }
    } catch (error) {
        showAlert('error', 'Error de conexión al asignar la tarjeta');
        console.error('Error:', error);
    } finally {
        // Rehabilitar botón
        btnAsignar.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoader) btnLoader.style.display = 'none';
    }
});

// Consultar tarjeta desde admin
document.getElementById('formConsultarTarjetaAdmin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
    const numero_tarjeta = document.getElementById('numero_tarjeta_consulta_admin').value.trim().toUpperCase();
    
    if (!numero_tarjeta || !numero_tarjeta.match(/^TARJ-\d{6}$/)) {
        showAlert('error', 'Formato inválido. Debe ser TARJ-XXXXXX');
        return;
    }
    
    const { response, data, error } = await hacerPeticion(`/api/tarjetas/saldo/${numero_tarjeta}`, {
        method: 'GET'
    });
    
    if (error) {
        showAlert('error', `Error: ${error}`);
        return;
    }
    
    if (data.success) {
        const resultado = document.getElementById('resultadoConsultaAdmin');
        resultado.className = 'resultado show success';
        resultado.innerHTML = `
            <p><strong>Tarjeta:</strong> ${data.data.numero_tarjeta}</p>
            <p><strong>Asistente:</strong> ${data.data.asistente}</p>
            <p><strong>Saldo:</strong> <span style="font-size: 1.5em; color: #28a745; font-weight: bold;">${data.data.saldo_formateado}</span></p>
        `;
    } else {
        showAlert('error', data.error);
    }
});

// ============================================
// GESTIÓN DE REPORTES
// ============================================

let puntosVentaList = [];

// Cargar puntos de venta para los filtros
async function cargarPuntosVentaReportes() {
    try {
        const { data, error } = await hacerPeticion('/api/puntos-venta', { method: 'GET' });
        if (error || !data.success) {
            console.error('Error cargando puntos de venta:', error || data.error);
            return;
        }
        puntosVentaList = data.data || [];
        
        // Llenar selectores
        const selectVentas = document.getElementById('puntoVentaVentas');
        const selectTransacciones = document.getElementById('puntoVentaTransacciones');
        
        if (selectVentas) {
            selectVentas.innerHTML = '<option value="">Todos los puntos de venta</option>' +
                puntosVentaList.map(pv => `<option value="${pv.id}">${pv.nombre}</option>`).join('');
        }
        
        if (selectTransacciones) {
            selectTransacciones.innerHTML = '<option value="">Todos los puntos de venta</option>' +
                puntosVentaList.map(pv => `<option value="${pv.id}">${pv.nombre}</option>`).join('');
        }
    } catch (error) {
        console.error('Error cargando puntos de venta:', error);
    }
}

// Formatear moneda
function formatearMoneda(monto) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);
}

// Formatear número
function formatearNumero(num) {
    return new Intl.NumberFormat('es-MX').format(num);
}

// Cargar reporte de ventas
async function cargarReporteVentas() {
    const fechaInicio = document.getElementById('fechaInicioVentas').value;
    const fechaFin = document.getElementById('fechaFinVentas').value;
    const puntoVentaId = document.getElementById('puntoVentaVentas').value;
    
    try {
        const params = new URLSearchParams();
        if (fechaInicio) params.append('fecha_inicio', fechaInicio);
        if (fechaFin) params.append('fecha_fin', fechaFin);
        if (puntoVentaId) params.append('punto_venta_id', puntoVentaId);
        
        const { data, error } = await hacerPeticion(`/api/reportes/ventas?${params.toString()}`, {
            method: 'GET'
        });
        
        if (error || !data.success) {
            showAlert('error', data?.error || 'Error al cargar el reporte de ventas');
            return;
        }
        
        mostrarReporteVentas(data.data);
    } catch (error) {
        console.error('Error:', error);
        showAlert('error', 'Error al cargar el reporte de ventas');
    }
}

// Mostrar reporte de ventas
function mostrarReporteVentas(datos) {
    const ventas = datos.ventas || [];
    const resumen = datos.resumen || {};
    
    // Mostrar resumen
    document.getElementById('totalVentas').textContent = formatearNumero(resumen.total_ventas || 0);
    document.getElementById('montoTotalVentas').textContent = formatearMoneda(resumen.total_monto || 0);
    document.getElementById('promedioVenta').textContent = formatearMoneda(resumen.promedio_venta || 0);
    document.getElementById('resumenVentas').style.display = 'block';
    
    // Mostrar tabla
    const tbody = document.getElementById('tbodyVentas');
    tbody.innerHTML = '';
    
    if (ventas.length === 0) {
        document.getElementById('tablaVentasContainer').style.display = 'none';
        document.getElementById('sinDatosVentas').style.display = 'block';
        document.getElementById('resumenDetalladoVentas').style.display = 'none';
        return;
    }
    
    document.getElementById('tablaVentasContainer').style.display = 'block';
    document.getElementById('sinDatosVentas').style.display = 'none';
    document.getElementById('contadorVentas').textContent = `${ventas.length} registro(s)`;
    document.getElementById('btnExportarVentas').style.display = 'inline-block';
    
    ventas.forEach(venta => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${venta.fecha_hora || 'N/A'}</td>
            <td>${venta.punto_venta || 'N/A'}</td>
            <td>${venta.producto || 'N/A'}</td>
            <td>${formatearNumero(venta.cantidad || 0)}</td>
            <td>${venta.precio_unitario ? formatearMoneda(venta.precio_unitario) : 'N/A'}</td>
            <td><strong>${formatearMoneda(venta.total || 0)}</strong></td>
            <td>****${venta.tarjeta_ultimos_4 || 'N/A'}</td>
            <td>${venta.asistente || 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Mostrar resumen por punto de venta
    const tbodyPV = document.getElementById('tbodyVentasPorPV');
    tbodyPV.innerHTML = '';
    (resumen.ventas_por_punto_venta || []).forEach(pv => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${pv.punto_venta || 'N/A'}</td>
            <td>${formatearNumero(pv.total_ventas || 0)}</td>
            <td><strong>${formatearMoneda(pv.total_monto || 0)}</strong></td>
        `;
        tbodyPV.appendChild(row);
    });
    
    // Mostrar productos más vendidos
    const tbodyProductos = document.getElementById('tbodyProductosMasVendidos');
    tbodyProductos.innerHTML = '';
    (resumen.productos_mas_vendidos || []).forEach(prod => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${prod.producto || 'N/A'}</td>
            <td>${formatearNumero(prod.cantidad || 0)}</td>
            <td><strong>${formatearMoneda(prod.total || 0)}</strong></td>
        `;
        tbodyProductos.appendChild(row);
    });
    
    document.getElementById('resumenDetalladoVentas').style.display = 'grid';
}

// Cargar reporte de transacciones
async function cargarReporteTransacciones() {
    const fechaInicio = document.getElementById('fechaInicioTransacciones').value;
    const fechaFin = document.getElementById('fechaFinTransacciones').value;
    const tipo = document.getElementById('tipoTransaccion').value;
    const puntoVentaId = document.getElementById('puntoVentaTransacciones').value;
    
    try {
        const params = new URLSearchParams();
        if (fechaInicio) params.append('fecha_inicio', fechaInicio);
        if (fechaFin) params.append('fecha_fin', fechaFin);
        if (tipo) params.append('tipo', tipo);
        if (puntoVentaId) params.append('punto_venta_id', puntoVentaId);
        
        const { data, error } = await hacerPeticion(`/api/reportes/transacciones?${params.toString()}`, {
            method: 'GET'
        });
        
        if (error || !data.success) {
            showAlert('error', data?.error || 'Error al cargar el reporte de transacciones');
            return;
        }
        
        mostrarReporteTransacciones(data.data);
    } catch (error) {
        console.error('Error:', error);
        showAlert('error', 'Error al cargar el reporte de transacciones');
    }
}

// Mostrar reporte de transacciones
function mostrarReporteTransacciones(datos) {
    const transacciones = datos.transacciones || [];
    const resumen = datos.resumen || {};
    
    // Mostrar resumen
    document.getElementById('totalTransaccionesReporte').textContent = formatearNumero(resumen.total_transacciones || 0);
    document.getElementById('totalRecargas').textContent = formatearNumero(resumen.total_recargas || 0);
    document.getElementById('totalPagos').textContent = formatearNumero(resumen.total_pagos || 0);
    document.getElementById('diferenciaTransacciones').textContent = formatearMoneda(resumen.diferencia || 0);
    document.getElementById('resumenTransacciones').style.display = 'block';
    
    // Mostrar tabla
    const tbody = document.getElementById('tbodyTransacciones');
    tbody.innerHTML = '';
    
    if (transacciones.length === 0) {
        document.getElementById('tablaTransaccionesContainer').style.display = 'none';
        document.getElementById('sinDatosTransacciones').style.display = 'block';
        return;
    }
    
    document.getElementById('tablaTransaccionesContainer').style.display = 'block';
    document.getElementById('sinDatosTransacciones').style.display = 'none';
    document.getElementById('contadorTransacciones').textContent = `${transacciones.length} registro(s)`;
    document.getElementById('btnExportarTransacciones').style.display = 'inline-block';
    
    transacciones.forEach(trans => {
        const row = document.createElement('tr');
        const tipoClass = trans.tipo === 'recarga' ? 'tipo-recarga' : 'tipo-pago';
        const tipoIcon = trans.tipo === 'recarga' ? '➕' : '➖';
        const estadoClass = trans.estado === 'exitosa' ? 'estado-exitosa' : 
                           trans.estado === 'saldo_insuficiente' ? 'estado-error' : 'estado-rechazada';
        const estadoTexto = trans.estado === 'exitosa' ? '✅ Exitosa' :
                            trans.estado === 'saldo_insuficiente' ? '⚠️ Saldo Insuficiente' : '❌ Rechazada';
        
        row.innerHTML = `
            <td>${trans.fecha_hora || 'N/A'}</td>
            <td><span class="tipo-badge ${tipoClass}">${tipoIcon} ${trans.tipo.toUpperCase()}</span></td>
            <td><strong>${trans.monto_formateado || formatearMoneda(trans.monto || 0)}</strong></td>
            <td>****${trans.tarjeta_ultimos_4 || 'N/A'}</td>
            <td>${trans.asistente || 'N/A'}</td>
            <td>${trans.punto_venta || (trans.tipo === 'pago' ? 'N/A' : '-')}</td>
            <td><span class="estado-badge ${estadoClass}">${estadoTexto}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Event listeners para reportes
document.addEventListener('DOMContentLoaded', () => {
    // Cargar puntos de venta al iniciar
    cargarPuntosVentaReportes();
    
    // Formulario de filtros de ventas
    const formFiltrosVentas = document.getElementById('formFiltrosVentas');
    if (formFiltrosVentas) {
        formFiltrosVentas.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            await cargarReporteVentas();
        });
    }
    
    // Botón limpiar filtros ventas
    const btnLimpiarVentas = document.getElementById('btnLimpiarFiltrosVentas');
    if (btnLimpiarVentas) {
        btnLimpiarVentas.addEventListener('click', () => {
            document.getElementById('fechaInicioVentas').value = '';
            document.getElementById('fechaFinVentas').value = '';
            document.getElementById('puntoVentaVentas').value = '';
            document.getElementById('resumenVentas').style.display = 'none';
            document.getElementById('tablaVentasContainer').style.display = 'none';
            document.getElementById('sinDatosVentas').style.display = 'block';
            document.getElementById('resumenDetalladoVentas').style.display = 'none';
            document.getElementById('btnExportarVentas').style.display = 'none';
        });
    }
    
    // Formulario de filtros de transacciones
    const formFiltrosTransacciones = document.getElementById('formFiltrosTransacciones');
    if (formFiltrosTransacciones) {
        formFiltrosTransacciones.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault();
            await cargarReporteTransacciones();
        });
    }
    
    // Botón limpiar filtros transacciones
    const btnLimpiarTransacciones = document.getElementById('btnLimpiarFiltrosTransacciones');
    if (btnLimpiarTransacciones) {
        btnLimpiarTransacciones.addEventListener('click', () => {
            document.getElementById('fechaInicioTransacciones').value = '';
            document.getElementById('fechaFinTransacciones').value = '';
            document.getElementById('tipoTransaccion').value = '';
            document.getElementById('puntoVentaTransacciones').value = '';
            document.getElementById('resumenTransacciones').style.display = 'none';
            document.getElementById('tablaTransaccionesContainer').style.display = 'none';
            document.getElementById('sinDatosTransacciones').style.display = 'block';
            document.getElementById('btnExportarTransacciones').style.display = 'none';
        });
    }
});

// ============================================
// GESTIÓN DE PERFIL DE USUARIO
// ============================================

let perfilOriginal = null;

// Cargar perfil al iniciar
async function cargarPerfil() {
    try {
        const { data, error } = await hacerPeticion('/api/perfil', { method: 'GET' });
        if (error || !data.success) {
            console.error('Error cargando perfil:', error || data.error);
            return;
        }
        
        perfilOriginal = data.data;
        mostrarPerfil(perfilOriginal);
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}

// Mostrar perfil en el formulario
function mostrarPerfil(perfil) {
    document.getElementById('perfilNombreCompleto').value = perfil.nombre_completo || '';
    document.getElementById('perfilEmail').value = perfil.email || '';
    document.getElementById('perfilTelefono').value = perfil.telefono || '';
    document.getElementById('perfilUsuario').value = perfil.usuario || '';
    document.getElementById('perfilRol').value = perfil.rol === 'admin' ? 'Administrador' : perfil.rol;
    
    // Mostrar foto de perfil
    if (perfil.foto_perfil) {
        document.getElementById('fotoPerfilImg').src = perfil.foto_perfil;
        document.getElementById('fotoPerfilImg').style.display = 'block';
        document.getElementById('fotoPerfilPlaceholder').style.display = 'none';
        document.getElementById('btnEliminarFoto').style.display = 'inline-block';
    } else {
        document.getElementById('fotoPerfilImg').style.display = 'none';
        document.getElementById('fotoPerfilPlaceholder').style.display = 'flex';
        document.getElementById('btnEliminarFoto').style.display = 'none';
    }
}

// Inicializar eventos de perfil
document.addEventListener('DOMContentLoaded', () => {
    // Cargar perfil cuando se muestra la sección
    const perfilLink = document.querySelector('[data-section="perfil"]');
    if (perfilLink) {
        perfilLink.addEventListener('click', () => {
            cargarPerfil();
        });
    }
    
    // Preview de foto antes de subir
    const inputFoto = document.getElementById('inputFotoPerfil');
    if (inputFoto) {
        inputFoto.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Validar tamaño (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showAlert('error', 'El archivo es demasiado grande. Máximo 5MB');
                    e.target.value = '';
                    return;
                }
                
                // Validar tipo
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                    showAlert('error', 'Formato no permitido. Use JPG, PNG o GIF');
                    e.target.value = '';
                    return;
                }
                
                // Mostrar preview
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('fotoPerfilImg').src = event.target.result;
                    document.getElementById('fotoPerfilImg').style.display = 'block';
                    document.getElementById('fotoPerfilPlaceholder').style.display = 'none';
                    document.getElementById('btnEliminarFoto').style.display = 'inline-block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Eliminar foto
    const btnEliminarFoto = document.getElementById('btnEliminarFoto');
    if (btnEliminarFoto) {
        btnEliminarFoto.addEventListener('click', () => {
            document.getElementById('fotoPerfilImg').src = '';
            document.getElementById('fotoPerfilImg').style.display = 'none';
            document.getElementById('fotoPerfilPlaceholder').style.display = 'flex';
            document.getElementById('btnEliminarFoto').style.display = 'none';
            document.getElementById('inputFotoPerfil').value = '';
        });
    }
    
    // Formulario de edición de perfil
    const formEditarPerfil = document.getElementById('formEditarPerfil');
    if (formEditarPerfil) {
        formEditarPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const btnGuardar = document.getElementById('btnGuardarPerfil');
            const btnText = btnGuardar.querySelector('.btn-text');
            const btnLoader = btnGuardar.querySelector('.btn-loader');
            btnGuardar.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'inline-block';
            
            try {
                const formData = new FormData();
                formData.append('nombre_completo', document.getElementById('perfilNombreCompleto').value.trim());
                formData.append('email', document.getElementById('perfilEmail').value.trim());
                formData.append('telefono', document.getElementById('perfilTelefono').value.trim());
                
                // Agregar foto si hay una seleccionada
                const inputFoto = document.getElementById('inputFotoPerfil');
                if (inputFoto.files[0]) {
                    formData.append('foto_perfil', inputFoto.files[0]);
                }
                
                const { response, data, error } = await hacerPeticion('/api/perfil', {
                    method: 'PUT',
                    body: formData
                });
                
                if (error) {
                    showAlert('error', `Error: ${error}`);
                    return;
                }
                
                if (data.success) {
                    showAlert('success', 'Perfil actualizado correctamente', 'Éxito');
                    perfilOriginal = data.data;
                    mostrarPerfil(data.data);
                    
                    // Actualizar avatar en sidebar si existe
                    const sidebarAvatar = document.querySelector('.user-avatar');
                    if (sidebarAvatar && data.data.foto_perfil) {
                        sidebarAvatar.innerHTML = `<img src="${data.data.foto_perfil}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                    }
                } else {
                    showAlert('error', data.error || 'Error al actualizar el perfil');
                }
            } catch (error) {
                showAlert('error', 'Error de conexión al actualizar el perfil');
                console.error('Error:', error);
            } finally {
                btnGuardar.disabled = false;
                if (btnText) btnText.style.display = 'inline';
                if (btnLoader) btnLoader.style.display = 'none';
            }
        });
    }
    
    // Botón cancelar
    const btnCancelar = document.getElementById('btnCancelarPerfil');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            if (perfilOriginal) {
                mostrarPerfil(perfilOriginal);
                document.getElementById('inputFotoPerfil').value = '';
            }
        });
    }
});

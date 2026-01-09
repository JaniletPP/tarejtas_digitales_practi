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
    
    // Inicializar sección específica
    if (sectionName === 'productos') {
        // Cargar productos, tipos y puntos de venta cuando se entra a la sección
        cargarTiposProductos();
        cargarProductosAdmin();
        cargarPuntosVenta();
    }
    
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
        
        // Si es el modal de productos, cargar puntos de venta
        if (modalId === 'modalProductoAdmin') {
            cargarPuntosVenta();
        }
    } else {
        console.error('[Admin Base] No se encontró el modal:', modalId);
    }
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        
        // Limpiar formulario si existe
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
        
        console.log('[Admin Base] Modal cerrado:', modalId);
    }
}

// ============================================
// FUNCIÓN PARA HACER PETICIONES AL BACKEND
// ============================================
async function hacerPeticion(url, options = {}) {
    try {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const response = await fetch(url, { ...defaultOptions, ...options });
        const data = await response.json();
        
        return { response, data };
    } catch (error) {
        console.error('[Admin Base] Error en petición:', error);
        return { error: error.message };
    }
}

// ============================================
// REGISTRO DE ASISTENTES
// ============================================
async function registrarAsistente(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    console.log('[Admin Base] Registrando asistente...');
    
    // Obtener datos del formulario
    const nombre = document.getElementById('asistenteNombreAdmin')?.value.trim();
    const email = document.getElementById('asistenteEmailAdmin')?.value.trim() || null;
    const telefono = document.getElementById('asistenteTelefonoAdmin')?.value.trim() || null;
    
    // Validar
    if (!nombre) {
        if (typeof showAlert === 'function') {
            showAlert('error', 'El nombre es obligatorio');
        } else {
            alert('El nombre es obligatorio');
        }
        return;
    }
    
    // Deshabilitar botón
    const btnGuardar = document.getElementById('btnGuardarAsistenteAdmin');
    const btnText = btnGuardar?.querySelector('.btn-text');
    const btnLoader = btnGuardar?.querySelector('.btn-loader');
    
    if (btnGuardar) {
        btnGuardar.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'inline-block';
    }
    
    try {
        const formData = { nombre, email, telefono };
        
        console.log('[Admin Base] Enviando datos:', formData);
        
        const { response, data, error } = await hacerPeticion('/api/asistentes', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (error) {
            if (typeof showAlert === 'function') {
                showAlert('error', `Error: ${error}`);
            } else {
                alert(`Error: ${error}`);
            }
            return;
        }
        
        if (response.ok && data.success) {
            console.log('[Admin Base] Asistente registrado:', data.data);
            
            if (typeof showAlert === 'function') {
                showAlert('success', `Asistente "${nombre}" registrado correctamente`, 'Registro Exitoso');
            } else {
                alert(`Asistente "${nombre}" registrado correctamente`);
            }
            
            // Cerrar modal
            cerrarModal('modalAsistenteAdmin');
            
        } else {
            const errorMsg = data?.error || 'Error al registrar el asistente';
            if (typeof showAlert === 'function') {
                showAlert('error', errorMsg);
            } else {
                alert(errorMsg);
            }
        }
        
    } catch (error) {
        console.error('[Admin Base] Error al registrar:', error);
        if (typeof showAlert === 'function') {
            showAlert('error', `Error inesperado: ${error.message}`);
        } else {
            alert(`Error: ${error.message}`);
        }
    } finally {
        // Rehabilitar botón
        if (btnGuardar) {
            btnGuardar.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';
        }
    }
}

// ============================================
// CARGAR PUNTOS DE VENTA
// ============================================
async function cargarPuntosVenta() {
    try {
        const { response, data, error } = await hacerPeticion('/api/puntos-venta', { method: 'GET' });
        
        if (error || !data.success) {
            console.error('[Admin Base] Error cargando puntos de venta:', error || data.error);
            return;
        }
        
        const select = document.getElementById('productoPuntoVentaAdmin');
        if (!select) {
            console.warn('[Admin Base] No se encontró el select de punto de venta');
            return;
        }
        
        // Limpiar opciones excepto la primera (placeholder)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Agregar opciones
        data.data.forEach(pv => {
            const option = document.createElement('option');
            option.value = pv.id;
            option.textContent = pv.nombre;
            select.appendChild(option);
        });
        
        console.log('[Admin Base] Puntos de venta cargados:', data.data.length);
    } catch (error) {
        console.error('[Admin Base] Error cargando puntos de venta:', error);
    }
}

// ============================================
// REGISTRO DE PRODUCTOS
// ============================================
async function registrarProducto(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    console.log('[Admin Base] Registrando producto...');
    
    // Obtener datos del formulario
    const nombre = document.getElementById('productoNombreAdmin')?.value.trim();
    const tipo = document.getElementById('productoTipoAdmin')?.value.trim();
    const precio = parseFloat(document.getElementById('productoPrecioAdmin')?.value);
    const disponible = document.getElementById('productoDisponibleAdmin')?.checked;
    const puntoVentaId = document.getElementById('productoPuntoVentaAdmin')?.value || null;
    
    // Validar
    if (!nombre || !tipo || isNaN(precio) || precio <= 0) {
        if (typeof showAlert === 'function') {
            showAlert('error', 'Por favor completa todos los campos correctamente');
        } else {
            alert('Por favor completa todos los campos correctamente');
        }
        return;
    }
    
    // Deshabilitar botón
    const btnGuardar = document.getElementById('btnGuardarProductoAdmin');
    const btnText = btnGuardar?.querySelector('.btn-text');
    const btnLoader = btnGuardar?.querySelector('.btn-loader');
    
    if (btnGuardar) {
        btnGuardar.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'inline-block';
    }
    
    try {
        const formData = { 
            nombre, 
            tipo, 
            precio, 
            disponible,
            punto_venta_id: puntoVentaId ? parseInt(puntoVentaId) : null
        };
        
        console.log('[Admin Base] Enviando datos:', formData);
        
        const { response, data, error } = await hacerPeticion('/api/productos', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (error) {
            if (typeof showAlert === 'function') {
                showAlert('error', `Error: ${error}`);
            } else {
                alert(`Error: ${error}`);
            }
            return;
        }
        
        if (response.ok && data.success) {
            console.log('[Admin Base] Producto registrado:', data.data);
            
            if (typeof showAlert === 'function') {
                showAlert('success', `Producto "${nombre}" registrado correctamente`, 'Registro Exitoso');
            } else {
                alert(`Producto "${nombre}" registrado correctamente`);
            }
            
            // Cerrar modal
            cerrarModal('modalProductoAdmin');
            
            // Recargar lista de productos
            cargarProductosAdmin();
            
        } else {
            const errorMsg = data?.error || 'Error al registrar el producto';
            if (typeof showAlert === 'function') {
                showAlert('error', errorMsg);
            } else {
                alert(errorMsg);
            }
        }
        
    } catch (error) {
        console.error('[Admin Base] Error al registrar:', error);
        if (typeof showAlert === 'function') {
            showAlert('error', `Error inesperado: ${error.message}`);
        } else {
            alert(`Error: ${error.message}`);
        }
    } finally {
        // Rehabilitar botón
        if (btnGuardar) {
            btnGuardar.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';
        }
    }
}

// ============================================
// GESTIÓN DE PRODUCTOS (CARGAR Y BUSCAR)
// ============================================
let productosAdmin = [];
let tiposProductosAdmin = [];
let filtroTipoActual = '';
let busquedaActual = '';

// Cargar tipos de productos
async function cargarTiposProductos() {
    try {
        const { response, data, error } = await hacerPeticion('/api/productos', { method: 'GET' });
        
        if (error || !data.success) {
            console.error('[Admin Base] Error cargando tipos:', error || data.error);
            return;
        }
        
        // Extraer tipos únicos
        const tipos = [...new Set(data.data.map(p => p.tipo))];
        tiposProductosAdmin = tipos;
        
        // Llenar select de filtro
        const selectFiltro = document.getElementById('filtroTipoProductosAdmin');
        if (selectFiltro) {
            // Limpiar excepto primera opción
            while (selectFiltro.children.length > 1) {
                selectFiltro.removeChild(selectFiltro.lastChild);
            }
            
            tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo;
                option.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
                selectFiltro.appendChild(option);
            });
        }
        
        console.log('[Admin Base] Tipos de productos cargados:', tipos.length);
    } catch (error) {
        console.error('[Admin Base] Error cargando tipos:', error);
    }
}

// Cargar productos
async function cargarProductosAdmin() {
    try {
        const { response, data, error } = await hacerPeticion('/api/productos', { method: 'GET' });
        
        if (error || !data.success) {
            console.error('[Admin Base] Error cargando productos:', error || data.error);
            return;
        }
        
        productosAdmin = data.data || [];
        mostrarProductosAdmin();
        console.log('[Admin Base] Productos cargados:', productosAdmin.length);
    } catch (error) {
        console.error('[Admin Base] Error cargando productos:', error);
    }
}

// Mostrar productos filtrados
function mostrarProductosAdmin() {
    const container = document.getElementById('productosPorTipoAdmin');
    if (!container) {
        console.warn('[Admin Base] No se encontró el contenedor de productos');
        return;
    }
    
    // Filtrar productos
    let productosFiltrados = productosAdmin;
    
    // Filtro por tipo
    if (filtroTipoActual) {
        productosFiltrados = productosFiltrados.filter(p => p.tipo === filtroTipoActual);
    }
    
    // Filtro por búsqueda
    if (busquedaActual) {
        const busqueda = busquedaActual.toLowerCase();
        productosFiltrados = productosFiltrados.filter(p => 
            p.nombre.toLowerCase().includes(busqueda)
        );
    }
    
    if (productosFiltrados.length === 0) {
        container.innerHTML = '<p class="info-message">No se encontraron productos con los filtros seleccionados.</p>';
        return;
    }
    
    // Agrupar por tipo
    const productosPorTipo = {};
    productosFiltrados.forEach(producto => {
        if (!productosPorTipo[producto.tipo]) {
            productosPorTipo[producto.tipo] = [];
        }
        productosPorTipo[producto.tipo].push(producto);
    });
    
    // Generar HTML
    let html = '';
    Object.keys(productosPorTipo).forEach(tipo => {
        html += `<div class="tipo-producto-section">
            <h3>${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h3>
            <div class="productos-grid">`;
        
        productosPorTipo[tipo].forEach(producto => {
            const estado = producto.disponible ? '✅ Disponible' : '❌ No disponible';
            const precio = parseFloat(producto.precio).toFixed(2);
            
            html += `
                <div class="producto-card">
                    <div class="producto-header">
                        <h4>${producto.nombre}</h4>
                        <span class="producto-estado">${estado}</span>
                    </div>
                    <div class="producto-info">
                        <p><strong>Precio:</strong> $${precio}</p>
                        <p><strong>ID:</strong> ${producto.id}</p>
                        ${producto.punto_venta_id ? `<p><strong>Punto de Venta ID:</strong> ${producto.punto_venta_id}</p>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`;
    });
    
    container.innerHTML = html;
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
                const newBtn = btnNuevoAsistente.cloneNode(true);
                btnNuevoAsistente.parentNode.replaceChild(newBtn, btnNuevoAsistente);
                
                newBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    abrirModal('modalAsistenteAdmin');
                });
                console.log('[Admin Base] Botón Nuevo Asistente inicializado');
            }

            const btnNuevoProducto = document.getElementById('btnNuevoProductoAdmin');
            if (btnNuevoProducto) {
                const newBtn = btnNuevoProducto.cloneNode(true);
                btnNuevoProducto.parentNode.replaceChild(newBtn, btnNuevoProducto);
                
                newBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    abrirModal('modalProductoAdmin');
                });
                console.log('[Admin Base] Botón Nuevo Producto inicializado');
            }
    
    // 5. Inicializar formularios de modales
    const formAsistenteAdmin = document.getElementById('formAsistenteAdmin');
    if (formAsistenteAdmin) {
        const newForm = formAsistenteAdmin.cloneNode(true);
        formAsistenteAdmin.parentNode.replaceChild(newForm, formAsistenteAdmin);
        
        newForm.addEventListener('submit', registrarAsistente, true);
        console.log('[Admin Base] Formulario de asistente inicializado');
    } else {
        console.error('[Admin Base] No se encontró el formulario de asistente');
    }

    const formProductoAdmin = document.getElementById('formProductoAdmin');
    if (formProductoAdmin) {
        const newForm = formProductoAdmin.cloneNode(true);
        formProductoAdmin.parentNode.replaceChild(newForm, formProductoAdmin);
        
        newForm.addEventListener('submit', registrarProducto, true);
        console.log('[Admin Base] Formulario de producto inicializado');
    } else {
        console.error('[Admin Base] No se encontró el formulario de producto');
    }
    
    // 6. Inicializar botones de cerrar modales
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
    
    // 6.5. Inicializar botón de cargar lista de asistentes
    const btnCargarAsistentes = document.getElementById('btnCargarAsistentes');
    if (btnCargarAsistentes) {
        const newBtn = btnCargarAsistentes.cloneNode(true);
        btnCargarAsistentes.parentNode.replaceChild(newBtn, btnCargarAsistentes);
        
        newBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            console.log('[Admin Base] Cargando lista de asistentes...');
            
            // Deshabilitar botón mientras carga
            newBtn.disabled = true;
            const originalText = newBtn.textContent;
            newBtn.textContent = '⏳ Cargando...';
            
            try {
                const { response, data, error } = await hacerPeticion('/api/asistentes', { method: 'GET' });
                
                if (error) {
                    if (typeof showAlert === 'function') {
                        showAlert('error', `Error de conexión: ${error}`);
                    } else {
                        alert(`Error: ${error}`);
                    }
                    return;
                }
                
                const listaDiv = document.getElementById('listaAsistentesAdmin');
                if (!listaDiv) {
                    console.error('[Admin Base] No se encontró el contenedor de lista');
                    return;
                }
                
                if (data.success) {
                    if (data.data.length === 0) {
                        listaDiv.className = 'resultado show info';
                        listaDiv.textContent = 'No hay asistentes registrados.';
                        if (typeof showAlert === 'function') {
                            showAlert('info', 'No hay asistentes registrados en el sistema');
                        }
                    } else {
                        // Crear tabla
                        let tablaHTML = '<table><thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Fecha Registro</th><th>Estado</th></tr></thead><tbody>';
                        
                        data.data.forEach(asistente => {
                            const estado = asistente.activo ? '✅ Activo' : '❌ Inactivo';
                            const fecha = new Date(asistente.fecha_registro).toLocaleString('es-ES');
                            
                            tablaHTML += `
                                <tr>
                                    <td>${asistente.id}</td>
                                    <td>${asistente.nombre}</td>
                                    <td>${asistente.email || 'N/A'}</td>
                                    <td>${asistente.telefono || 'N/A'}</td>
                                    <td>${fecha}</td>
                                    <td>${estado}</td>
                                </tr>
                            `;
                        });
                        
                        tablaHTML += '</tbody></table>';
                        listaDiv.className = 'resultado show success';
                        listaDiv.innerHTML = `<p><strong>Total de asistentes:</strong> ${data.data.length}</p>${tablaHTML}`;
                        
                        if (typeof showAlert === 'function') {
                            showAlert('success', `Se encontraron ${data.data.length} asistente(s)`, 'Lista cargada');
                        }
                    }
                } else {
                    listaDiv.className = 'resultado show error';
                    listaDiv.textContent = data.error || 'Error al cargar la lista';
                    if (typeof showAlert === 'function') {
                        showAlert('error', data.error || 'Error al cargar la lista');
                    }
                }
            } catch (error) {
                console.error('[Admin Base] Error al cargar lista:', error);
                const listaDiv = document.getElementById('listaAsistentesAdmin');
                if (listaDiv) {
                    listaDiv.className = 'resultado show error';
                    listaDiv.textContent = `Error: ${error.message}`;
                }
                if (typeof showAlert === 'function') {
                    showAlert('error', `Error inesperado: ${error.message}`);
                }
            } finally {
                // Rehabilitar botón
                newBtn.disabled = false;
                newBtn.textContent = originalText;
            }
        });
        console.log('[Admin Base] Botón Cargar Lista de Asistentes inicializado');
    }
    
    // 7. Cerrar modales al hacer clic fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
    
            // 8. Inicializar filtros y búsqueda de productos
            const filtroTipoProductos = document.getElementById('filtroTipoProductosAdmin');
            if (filtroTipoProductos) {
                filtroTipoProductos.addEventListener('change', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    filtroTipoActual = e.target.value;
                    mostrarProductosAdmin();
                });
                console.log('[Admin Base] Filtro de tipo de productos inicializado');
            }
            
            const buscarProducto = document.getElementById('buscarProductoAdmin');
            if (buscarProducto) {
                buscarProducto.addEventListener('input', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    busquedaActual = e.target.value.trim();
                    mostrarProductosAdmin();
                });
                console.log('[Admin Base] Búsqueda de productos inicializada');
            }
            
            // 9. Prevenir que formularios de reportes cambien de sección
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
    
            // 10. Cargar sección inicial (dashboard)
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

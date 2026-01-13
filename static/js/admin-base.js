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
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.remove('show');
    });
    
    // Inicializar sección específica
    if (sectionName === 'productos') {
        // Cargar productos, tipos y puntos de venta cuando se entra a la sección
        cargarTiposProductos();
        cargarProductosAdmin();
        cargarPuntosVenta();
    } else if (sectionName === 'reportes' || sectionName === 'reportes-ventas' || sectionName === 'reportes-transacciones') {
        // Cargar puntos de venta cuando se entra a reportes
        cargarPuntosVentaReportes();
    } else if (sectionName === 'tarjetas') {
        // Cargar asistentes sin tarjeta cuando se entra a la sección de tarjetas
        inicializarModuloTarjetas();
    }
    
    // NO cambiar hash en la URL
    // NO recargar la página
    // NO eliminar nodos del DOM
}

// ============================================
// FUNCIÓN PARA TOGGLE DE DROPDOWNS (con clase 'show')
// ============================================
function toggleDropdown(dropdownElement) {
    if (!dropdownElement) {
        console.error('[Admin Base] No se proporcionó elemento dropdown');
        return;
    }
    
    const dropdownMenu = dropdownElement.querySelector('.dropdown-menu');
    if (!dropdownMenu) {
        console.error('[Admin Base] No se encontró .dropdown-menu dentro del dropdown');
        return;
    }
    
    const isShowing = dropdownMenu.classList.contains('show');
    
    // Cerrar otros dropdowns
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu !== dropdownMenu) {
            menu.classList.remove('show');
        }
    });
    
    // Toggle del dropdown actual
    if (isShowing) {
        dropdownMenu.classList.remove('show');
        console.log('[Admin Base] Dropdown cerrado');
    } else {
        dropdownMenu.classList.add('show');
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
            headers: {}
        };
        
        // Solo agregar Content-Type si no es FormData
        if (!(options.body instanceof FormData)) {
            defaultOptions.headers['Content-Type'] = 'application/json';
        }
        
        const finalOptions = { ...defaultOptions, ...options };
        // Si hay headers personalizados, combinarlos
        if (options.headers) {
            finalOptions.headers = { ...defaultOptions.headers, ...options.headers };
        }
        
        const response = await fetch(url, finalOptions);
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
    
    // Obtener estado del filtro de disponibles
    const mostrarNoDisponibles = document.getElementById('mostrarNoDisponibles')?.checked !== false;
    
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
    
    // Filtro por disponibilidad
    if (!mostrarNoDisponibles) {
        productosFiltrados = productosFiltrados.filter(p => p.disponible);
    }
    
    if (productosFiltrados.length === 0) {
        container.innerHTML = '<div class="info-message"><p>No se encontraron productos con los filtros seleccionados.</p></div>';
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
    
    // Generar HTML con diseño mejorado
    let html = '';
    Object.keys(productosPorTipo).sort().forEach(tipo => {
        const tipoCapitalizado = tipo.charAt(0).toUpperCase() + tipo.slice(1);
        html += `
            <div class="tipo-producto-section">
                <div class="tipo-producto-header">
                    <h3>${tipoCapitalizado}</h3>
                    <span class="tipo-producto-count">${productosPorTipo[tipo].length} producto(s)</span>
                </div>
                <div class="productos-grid-admin">
        `;
        
        productosPorTipo[tipo].forEach(producto => {
            const disponible = producto.disponible;
            const precio = parseFloat(producto.precio).toFixed(2);
            const claseDisponible = disponible ? 'disponible' : 'no-disponible';
            
            html += `
                <div class="producto-card-admin ${claseDisponible}">
                    <div class="producto-card-header">
                        <h4 class="producto-nombre">${producto.nombre}</h4>
                        <span class="producto-badge ${disponible ? 'badge-success' : 'badge-danger'}">
                            ${disponible ? '✓ Disponible' : '✗ No disponible'}
                        </span>
                    </div>
                    <div class="producto-card-body">
                        <div class="producto-precio">
                            <span class="precio-label">Precio:</span>
                            <span class="precio-valor">$${precio}</span>
                        </div>
                        <div class="producto-meta">
                            <span class="meta-item">ID: ${producto.id}</span>
                            ${producto.punto_venta_id ? `<span class="meta-item">PV: ${producto.punto_venta_id}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================
// FUNCIONES AUXILIARES PARA REPORTES
// ============================================
function formatearMoneda(monto) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    }).format(monto || 0);
}

function formatearNumero(num) {
    return new Intl.NumberFormat('es-MX').format(num || 0);
}

// ============================================
// CARGAR PUNTOS DE VENTA PARA REPORTES
// ============================================
async function cargarPuntosVentaReportes() {
    try {
        const { response, data, error } = await hacerPeticion('/api/puntos-venta', { method: 'GET' });
        
        if (error || !data.success) {
            console.error('[Admin Base] Error cargando puntos de venta para reportes:', error || data.error);
            return;
        }
        
        // Llenar select de ventas
        const selectVentas = document.getElementById('puntoVentaVentas');
        if (selectVentas) {
            while (selectVentas.children.length > 1) {
                selectVentas.removeChild(selectVentas.lastChild);
            }
            data.data.forEach(pv => {
                const option = document.createElement('option');
                option.value = pv.id;
                option.textContent = pv.nombre;
                selectVentas.appendChild(option);
            });
        }
        
        // Llenar select de transacciones
        const selectTransacciones = document.getElementById('puntoVentaTransacciones');
        if (selectTransacciones) {
            while (selectTransacciones.children.length > 1) {
                selectTransacciones.removeChild(selectTransacciones.lastChild);
            }
            data.data.forEach(pv => {
                const option = document.createElement('option');
                option.value = pv.id;
                option.textContent = pv.nombre;
                selectTransacciones.appendChild(option);
            });
        }
        
        console.log('[Admin Base] Puntos de venta cargados para reportes:', data.data.length);
    } catch (error) {
        console.error('[Admin Base] Error cargando puntos de venta:', error);
    }
}

// ============================================
// REPORTE DE VENTAS
// ============================================
async function cargarReporteVentas() {
    console.log('[Admin Base] Cargando reporte de ventas...');
    
    const fechaInicio = document.getElementById('fechaInicioVentas')?.value;
    const fechaFin = document.getElementById('fechaFinVentas')?.value;
    const puntoVentaId = document.getElementById('puntoVentaVentas')?.value;
    
    try {
        const params = new URLSearchParams();
        if (fechaInicio) params.append('fecha_inicio', fechaInicio);
        if (fechaFin) params.append('fecha_fin', fechaFin);
        if (puntoVentaId) params.append('punto_venta_id', puntoVentaId);
        
        const { response, data, error } = await hacerPeticion(`/api/reportes/ventas?${params.toString()}`, {
            method: 'GET'
        });
        
        if (error || !data.success) {
            if (typeof showAlert === 'function') {
                showAlert('error', data?.error || 'Error al cargar el reporte de ventas');
            } else {
                alert(data?.error || 'Error al cargar el reporte de ventas');
            }
            return;
        }
        
        mostrarReporteVentas(data.data);
    } catch (error) {
        console.error('[Admin Base] Error cargando reporte de ventas:', error);
        if (typeof showAlert === 'function') {
            showAlert('error', 'Error al cargar el reporte de ventas');
        } else {
            alert('Error al cargar el reporte de ventas');
        }
    }
}

function mostrarReporteVentas(datos) {
    const ventas = datos.ventas || [];
    const resumen = datos.resumen || {};
    
    // Mostrar resumen
    const totalVentasEl = document.getElementById('totalVentas');
    const montoTotalEl = document.getElementById('montoTotalVentas');
    const promedioEl = document.getElementById('promedioVenta');
    const resumenEl = document.getElementById('resumenVentas');
    
    if (totalVentasEl) totalVentasEl.textContent = formatearNumero(resumen.total_ventas || 0);
    if (montoTotalEl) montoTotalEl.textContent = formatearMoneda(resumen.total_monto || 0);
    if (promedioEl) promedioEl.textContent = formatearMoneda(resumen.promedio_venta || 0);
    if (resumenEl) resumenEl.style.display = 'block';
    
    // Mostrar tabla
    const tbody = document.getElementById('tbodyVentas');
    const tablaContainer = document.getElementById('tablaVentasContainer');
    const sinDatos = document.getElementById('sinDatosVentas');
    const contador = document.getElementById('contadorVentas');
    const btnExportar = document.getElementById('btnExportarVentas');
    
    if (!tbody) {
        console.error('[Admin Base] No se encontró tbody de ventas');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (ventas.length === 0) {
        if (tablaContainer) tablaContainer.style.display = 'none';
        if (sinDatos) sinDatos.style.display = 'block';
        return;
    }
    
    if (tablaContainer) tablaContainer.style.display = 'block';
    if (sinDatos) sinDatos.style.display = 'none';
    if (contador) contador.textContent = `${ventas.length} registro(s)`;
    if (btnExportar) btnExportar.style.display = 'inline-block';
    
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
    
    console.log('[Admin Base] Reporte de ventas mostrado:', ventas.length, 'registros');
}

// ============================================
// REPORTE DE TRANSACCIONES
// ============================================
async function cargarReporteTransacciones() {
    console.log('[Admin Base] Cargando reporte de transacciones...');
    
    const fechaInicio = document.getElementById('fechaInicioTransacciones')?.value;
    const fechaFin = document.getElementById('fechaFinTransacciones')?.value;
    const tipo = document.getElementById('tipoTransaccion')?.value;
    const puntoVentaId = document.getElementById('puntoVentaTransacciones')?.value;
    
    try {
        const params = new URLSearchParams();
        if (fechaInicio) params.append('fecha_inicio', fechaInicio);
        if (fechaFin) params.append('fecha_fin', fechaFin);
        if (tipo) params.append('tipo', tipo);
        if (puntoVentaId) params.append('punto_venta_id', puntoVentaId);
        
        const { response, data, error } = await hacerPeticion(`/api/reportes/transacciones?${params.toString()}`, {
            method: 'GET'
        });
        
        if (error || !data.success) {
            if (typeof showAlert === 'function') {
                showAlert('error', data?.error || 'Error al cargar el reporte de transacciones');
            } else {
                alert(data?.error || 'Error al cargar el reporte de transacciones');
            }
            return;
        }
        
        mostrarReporteTransacciones(data.data);
    } catch (error) {
        console.error('[Admin Base] Error cargando reporte de transacciones:', error);
        if (typeof showAlert === 'function') {
            showAlert('error', 'Error al cargar el reporte de transacciones');
        } else {
            alert('Error al cargar el reporte de transacciones');
        }
    }
}

function mostrarReporteTransacciones(datos) {
    const transacciones = datos.transacciones || [];
    const resumen = datos.resumen || {};
    
    // Mostrar resumen
    const totalTransEl = document.getElementById('totalTransaccionesReporte');
    const totalRecargasEl = document.getElementById('totalRecargas');
    const totalPagosEl = document.getElementById('totalPagos');
    const diferenciaEl = document.getElementById('diferenciaTransacciones');
    const resumenEl = document.getElementById('resumenTransacciones');
    
    if (totalTransEl) totalTransEl.textContent = formatearNumero(resumen.total_transacciones || 0);
    if (totalRecargasEl) totalRecargasEl.textContent = formatearNumero(resumen.total_recargas || 0);
    if (totalPagosEl) totalPagosEl.textContent = formatearNumero(resumen.total_pagos || 0);
    if (diferenciaEl) diferenciaEl.textContent = formatearMoneda(resumen.diferencia || 0);
    if (resumenEl) resumenEl.style.display = 'block';
    
    // Mostrar tabla
    const tbody = document.getElementById('tbodyTransacciones');
    const tablaContainer = document.getElementById('tablaTransaccionesContainer');
    const sinDatos = document.getElementById('sinDatosTransacciones');
    const contador = document.getElementById('contadorTransacciones');
    const btnExportar = document.getElementById('btnExportarTransacciones');
    
    if (!tbody) {
        console.error('[Admin Base] No se encontró tbody de transacciones');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (transacciones.length === 0) {
        if (tablaContainer) tablaContainer.style.display = 'none';
        if (sinDatos) sinDatos.style.display = 'block';
        return;
    }
    
    if (tablaContainer) tablaContainer.style.display = 'block';
    if (sinDatos) sinDatos.style.display = 'none';
    if (contador) contador.textContent = `${transacciones.length} registro(s)`;
    if (btnExportar) btnExportar.style.display = 'inline-block';
    
    transacciones.forEach(trans => {
        const row = document.createElement('tr');
        const tipoBadge = trans.tipo === 'recarga' 
            ? '<span style="background: #d4edda; color: #155724; padding: 3px 8px; border-radius: 4px; font-size: 11px;">➕ Recarga</span>'
            : '<span style="background: #f8d7da; color: #721c24; padding: 3px 8px; border-radius: 4px; font-size: 11px;">➖ Pago</span>';
        
        const estadoBadge = trans.estado === 'exitosa'
            ? '<span style="background: #d4edda; color: #155724; padding: 3px 8px; border-radius: 4px; font-size: 11px;">✓ Exitosa</span>'
            : '<span style="background: #f8d7da; color: #721c24; padding: 3px 8px; border-radius: 4px; font-size: 11px;">✗ ' + (trans.estado || 'Error') + '</span>';
        
        row.innerHTML = `
            <td>${trans.fecha_hora || 'N/A'}</td>
            <td>${tipoBadge}</td>
            <td><strong>${formatearMoneda(trans.monto || 0)}</strong></td>
            <td>****${trans.tarjeta_ultimos_4 || 'N/A'}</td>
            <td>${trans.asistente || 'N/A'}</td>
            <td>${trans.punto_venta || 'N/A'}</td>
            <td>${estadoBadge}</td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('[Admin Base] Reporte de transacciones mostrado:', transacciones.length, 'registros');
}

// ============================================
// MÓDULO DE TARJETAS - ASIGNACIÓN Y ESCANEO QR
// ============================================
let listaAsistentesTarjetas = [];
let asistenteSeleccionadoTarjetas = null;
let tarjetaEstadoTarjetas = null;
let html5QrCodeTarjetas = null;
let qrScannerActiveTarjetas = false;

// Inicializar módulo de tarjetas
async function inicializarModuloTarjetas() {
    console.log('[Admin Base] Inicializando módulo de tarjetas...');
    
    // Cargar asistentes sin tarjeta
    await cargarAsistentesSinTarjeta();
    
    // Inicializar búsqueda de asistentes
    const buscarAsistente = document.getElementById('buscarAsistenteAdmin');
    if (buscarAsistente) {
        buscarAsistente.addEventListener('input', function(e) {
            const termino = e.target.value.trim();
            if (termino.length >= 2) {
                const resultados = buscarAsistentesTarjetas(termino);
                mostrarDropdownAsistentesTarjetas(resultados);
            } else {
                const dropdown = document.getElementById('asistenteDropdown');
                if (dropdown) dropdown.classList.remove('show');
            }
        });
    }
    
    // Inicializar verificación de tarjeta al escribir
    const numeroTarjetaInput = document.getElementById('numero_tarjeta_admin');
    if (numeroTarjetaInput) {
        numeroTarjetaInput.addEventListener('input', function(e) {
            const numero = e.target.value.trim().toUpperCase();
            if (numero.length >= 4) {
                verificarTarjetaAdmin(numero);
            } else {
                const estadoDiv = document.getElementById('tarjetaEstado');
                if (estadoDiv) estadoDiv.style.display = 'none';
            }
        });
    }
    
    // Inicializar botón de escanear QR
    const btnScanQR = document.getElementById('btnScanQRTarjeta');
    if (btnScanQR) {
        btnScanQR.addEventListener('click', iniciarEscaneoQRTarjeta);
    }
    
    // Inicializar botón de cerrar modal QR
    const btnCerrarQR = document.getElementById('cerrarModalScanQRTarjeta');
    if (btnCerrarQR) {
        btnCerrarQR.addEventListener('click', detenerEscaneoQRTarjeta);
    }
    
    // Cerrar modal QR al hacer clic fuera
    const modalQR = document.getElementById('modalScanQRTarjeta');
    if (modalQR) {
        modalQR.addEventListener('click', function(e) {
            if (e.target.id === 'modalScanQRTarjeta') {
                detenerEscaneoQRTarjeta();
            }
        });
    }
    
    // Inicializar formulario de asignación
    const formAsignar = document.getElementById('formAsignarTarjetaAdmin');
    if (formAsignar) {
        formAsignar.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            await asignarTarjetaAdmin();
        });
    }
    
    // Inicializar botón limpiar
    const btnLimpiar = document.getElementById('btnLimpiarFormulario');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarFormularioTarjetas);
    }
    
    // Inicializar botón clear asistente
    const btnClearAsistente = document.getElementById('btnClearAsistente');
    if (btnClearAsistente) {
        btnClearAsistente.addEventListener('click', limpiarAsistenteSeleccionado);
    }
    
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.asistente-selector-container')) {
            const dropdown = document.getElementById('asistenteDropdown');
            if (dropdown) dropdown.classList.remove('show');
        }
    });
    
    console.log('[Admin Base] Módulo de tarjetas inicializado');
}

// Cargar asistentes sin tarjeta
async function cargarAsistentesSinTarjeta() {
    try {
        const { response, data, error } = await hacerPeticion('/api/asistentes/sin-tarjeta', { method: 'GET' });
        if (error || !data.success) {
            console.error('[Admin Base] Error cargando asistentes sin tarjeta:', error || data.error);
            return;
        }
        listaAsistentesTarjetas = data.data || [];
        console.log('[Admin Base] Asistentes sin tarjeta cargados:', listaAsistentesTarjetas.length);
    } catch (error) {
        console.error('[Admin Base] Error cargando asistentes:', error);
    }
}

// Búsqueda de asistentes
function buscarAsistentesTarjetas(termino) {
    if (!termino || termino.length < 2) {
        return [];
    }
    
    const busqueda = termino.toLowerCase();
    return listaAsistentesTarjetas.filter(asistente => {
        const nombre = (asistente.nombre || '').toLowerCase();
        const email = (asistente.email || '').toLowerCase();
        const telefono = (asistente.telefono || '').toLowerCase();
        const id = String(asistente.id || '');
        
        return nombre.includes(busqueda) || 
               email.includes(busqueda) || 
               telefono.includes(busqueda) ||
               id.includes(busqueda);
    }).slice(0, 10);
}

// Mostrar dropdown de asistentes
function mostrarDropdownAsistentesTarjetas(resultados) {
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
    
    // Agregar event listeners
    dropdown.querySelectorAll('.asistente-dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.getAttribute('data-id'));
            seleccionarAsistenteTarjetas(id);
        });
    });
}

// Seleccionar asistente
function seleccionarAsistenteTarjetas(asistenteId) {
    const asistente = listaAsistentesTarjetas.find(a => a.id === asistenteId);
    if (!asistente) return;
    
    asistenteSeleccionadoTarjetas = asistente;
    
    const dropdown = document.getElementById('asistenteDropdown');
    const buscarInput = document.getElementById('buscarAsistenteAdmin');
    const asistenteIdInput = document.getElementById('asistente_id_admin');
    const asistenteNombreMostrar = document.getElementById('asistenteNombreMostrar');
    const asistenteContactoMostrar = document.getElementById('asistenteContactoMostrar');
    const asistenteSeleccionado = document.getElementById('asistenteSeleccionado');
    
    if (dropdown) dropdown.classList.remove('show');
    if (buscarInput) buscarInput.style.display = 'none';
    if (asistenteIdInput) asistenteIdInput.value = asistente.id;
    if (asistenteNombreMostrar) asistenteNombreMostrar.textContent = asistente.nombre;
    
    const contacto = asistente.email || asistente.telefono || 'Sin contacto';
    const contactoLabel = asistente.email ? '📧 ' : asistente.telefono ? '📱 ' : '';
    if (asistenteContactoMostrar) asistenteContactoMostrar.textContent = contactoLabel + contacto;
    if (asistenteSeleccionado) asistenteSeleccionado.style.display = 'flex';
    
    actualizarVistaPreviaTarjetas();
}

// Limpiar asistente seleccionado
function limpiarAsistenteSeleccionado() {
    asistenteSeleccionadoTarjetas = null;
    
    const buscarInput = document.getElementById('buscarAsistenteAdmin');
    const asistenteIdInput = document.getElementById('asistente_id_admin');
    const asistenteSeleccionado = document.getElementById('asistenteSeleccionado');
    
    if (buscarInput) {
        buscarInput.value = '';
        buscarInput.style.display = 'block';
    }
    if (asistenteIdInput) asistenteIdInput.value = '';
    if (asistenteSeleccionado) asistenteSeleccionado.style.display = 'none';
    
    actualizarVistaPreviaTarjetas();
}

// Verificar tarjeta
async function verificarTarjetaAdmin(numeroTarjeta) {
    if (!numeroTarjeta || numeroTarjeta.length < 4) return;
    
    const numero = numeroTarjeta.trim().toUpperCase();
    
    if (!numero.match(/^TARJ-\d{6}$/)) {
        const estadoDiv = document.getElementById('tarjetaEstado');
        if (estadoDiv) {
            estadoDiv.className = 'tarjeta-estado error';
            estadoDiv.textContent = 'Formato inválido. Debe ser TARJ-XXXXXX';
            estadoDiv.style.display = 'block';
        }
        tarjetaEstadoTarjetas = { existe: false, activa: false, asignada: false };
        actualizarVistaPreviaTarjetas();
        return;
    }
    
    try {
        const { response, data, error } = await hacerPeticion(`/api/tarjetas/verificar/${numero}`, {
            method: 'GET'
        });
        
        if (error) {
            const estadoDiv = document.getElementById('tarjetaEstado');
            if (estadoDiv) {
                estadoDiv.className = 'tarjeta-estado error';
                estadoDiv.textContent = 'Error al verificar tarjeta';
                estadoDiv.style.display = 'block';
            }
            tarjetaEstadoTarjetas = null;
            return;
        }
        
        if (data.success) {
            tarjetaEstadoTarjetas = data.data;
            const estadoDiv = document.getElementById('tarjetaEstado');
            
            if (!estadoDiv) return;
            
            if (!tarjetaEstadoTarjetas.existe) {
                estadoDiv.className = 'tarjeta-estado success';
                estadoDiv.textContent = '✅ Tarjeta disponible. Puede ser asignada.';
            } else if (tarjetaEstadoTarjetas.asignada && tarjetaEstadoTarjetas.activa) {
                estadoDiv.className = 'tarjeta-estado warning';
                estadoDiv.textContent = `⚠️ Tarjeta ya asignada a: ${tarjetaEstadoTarjetas.asistente_nombre || 'Otro asistente'}`;
            } else if (!tarjetaEstadoTarjetas.activa) {
                estadoDiv.className = 'tarjeta-estado info';
                estadoDiv.textContent = 'ℹ️ Tarjeta inactiva. Se reactivará al asignar.';
            } else {
                estadoDiv.className = 'tarjeta-estado success';
                estadoDiv.textContent = '✅ Tarjeta disponible';
            }
            
            estadoDiv.style.display = 'block';
            actualizarVistaPreviaTarjetas();
        }
    } catch (error) {
        console.error('[Admin Base] Error verificando tarjeta:', error);
        const estadoDiv = document.getElementById('tarjetaEstado');
        if (estadoDiv) {
            estadoDiv.className = 'tarjeta-estado error';
            estadoDiv.textContent = 'Error al verificar tarjeta';
            estadoDiv.style.display = 'block';
        }
    }
}

// Actualizar vista previa
function actualizarVistaPreviaTarjetas() {
    const vistaPrevia = document.getElementById('vistaPreviaAsignacion');
    if (!vistaPrevia) return;
    
    if (!asistenteSeleccionadoTarjetas) {
        vistaPrevia.style.display = 'none';
        return;
    }
    
    const numeroTarjeta = document.getElementById('numero_tarjeta_admin')?.value.trim().toUpperCase() || '';
    
    if (!numeroTarjeta) {
        vistaPrevia.style.display = 'none';
        return;
    }
    
    vistaPrevia.style.display = 'block';
    
    const previewAsistente = document.getElementById('previewAsistente');
    const previewContacto = document.getElementById('previewContacto');
    const previewEstadoAsistente = document.getElementById('previewEstadoAsistente');
    const previewTarjeta = document.getElementById('previewTarjeta');
    const previewEstado = document.getElementById('previewEstado');
    
    if (previewAsistente) previewAsistente.textContent = asistenteSeleccionadoTarjetas.nombre;
    
    const contacto = asistenteSeleccionadoTarjetas.email || asistenteSeleccionadoTarjetas.telefono || 'Sin contacto';
    const contactoLabel = asistenteSeleccionadoTarjetas.email ? '📧 ' : asistenteSeleccionadoTarjetas.telefono ? '📱 ' : '';
    if (previewContacto) previewContacto.textContent = contactoLabel + contacto;
    
    if (previewEstadoAsistente) {
        previewEstadoAsistente.textContent = '✅ Sin tarjeta asignada';
        previewEstadoAsistente.className = 'preview-value success';
    }
    
    if (previewTarjeta) previewTarjeta.textContent = numeroTarjeta;
    
    if (previewEstado && tarjetaEstadoTarjetas) {
        if (!tarjetaEstadoTarjetas.existe) {
            previewEstado.textContent = '✅ Disponible';
            previewEstado.className = 'preview-value success';
        } else if (tarjetaEstadoTarjetas.asignada && tarjetaEstadoTarjetas.activa) {
            previewEstado.textContent = `⚠️ Asignada a: ${tarjetaEstadoTarjetas.asistente_nombre || 'Otro'}`;
            previewEstado.className = 'preview-value warning';
        } else if (!tarjetaEstadoTarjetas.activa) {
            previewEstado.textContent = 'ℹ️ Inactiva (se reactivará)';
            previewEstado.className = 'preview-value info';
        } else {
            previewEstado.textContent = '✅ Disponible';
            previewEstado.className = 'preview-value success';
        }
    }
}

// Asignar tarjeta
async function asignarTarjetaAdmin() {
    const asistenteId = document.getElementById('asistente_id_admin')?.value;
    const numeroTarjeta = document.getElementById('numero_tarjeta_admin')?.value.trim().toUpperCase();
    
    if (!asistenteId) {
        if (typeof showAlert === 'function') {
            showAlert('error', 'Por favor selecciona un asistente');
        } else {
            alert('Por favor selecciona un asistente');
        }
        return;
    }
    
    if (!numeroTarjeta || !numeroTarjeta.match(/^TARJ-\d{6}$/)) {
        if (typeof showAlert === 'function') {
            showAlert('error', 'Por favor ingresa un número de tarjeta válido (TARJ-XXXXXX)');
        } else {
            alert('Por favor ingresa un número de tarjeta válido (TARJ-XXXXXX)');
        }
        return;
    }
    
    // Verificar si la tarjeta ya está asignada a otro asistente
    if (tarjetaEstadoTarjetas && tarjetaEstadoTarjetas.existe && tarjetaEstadoTarjetas.asignada && tarjetaEstadoTarjetas.activa) {
        if (tarjetaEstadoTarjetas.asistente_id !== parseInt(asistenteId)) {
            if (typeof showAlert === 'function') {
                showAlert('error', `Esta tarjeta ya está asignada a: ${tarjetaEstadoTarjetas.asistente_nombre}`);
            } else {
                alert(`Esta tarjeta ya está asignada a: ${tarjetaEstadoTarjetas.asistente_nombre}`);
            }
            return;
        }
    }
    
    const btnAsignar = document.getElementById('btnAsignarTarjeta');
    const btnText = btnAsignar?.querySelector('.btn-text');
    const btnLoader = btnAsignar?.querySelector('.btn-loader');
    
    if (btnAsignar) {
        btnAsignar.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'inline-block';
    }
    
    try {
        const { response, data, error } = await hacerPeticion('/api/tarjetas/asignar', {
            method: 'POST',
            body: JSON.stringify({
                asistente_id: parseInt(asistenteId),
                numero_tarjeta: numeroTarjeta
            })
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
            if (typeof showAlert === 'function') {
                showAlert('success', `Tarjeta ${numeroTarjeta} asignada correctamente a ${asistenteSeleccionadoTarjetas?.nombre || 'el asistente'}`, 'Asignación Exitosa');
            } else {
                alert(`Tarjeta ${numeroTarjeta} asignada correctamente`);
            }
            
            limpiarFormularioTarjetas();
            await cargarAsistentesSinTarjeta();
        } else {
            const errorMsg = data?.error || 'Error al asignar la tarjeta';
            if (typeof showAlert === 'function') {
                showAlert('error', errorMsg);
            } else {
                alert(errorMsg);
            }
        }
    } catch (error) {
        console.error('[Admin Base] Error asignando tarjeta:', error);
        if (typeof showAlert === 'function') {
            showAlert('error', `Error inesperado: ${error.message}`);
        } else {
            alert(`Error: ${error.message}`);
        }
    } finally {
        if (btnAsignar) {
            btnAsignar.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';
        }
    }
}

// Limpiar formulario
function limpiarFormularioTarjetas() {
    limpiarAsistenteSeleccionado();
    
    const numeroTarjetaInput = document.getElementById('numero_tarjeta_admin');
    const estadoDiv = document.getElementById('tarjetaEstado');
    const vistaPrevia = document.getElementById('vistaPreviaAsignacion');
    const resultadoDiv = document.getElementById('resultadoAsignarAdmin');
    
    if (numeroTarjetaInput) numeroTarjetaInput.value = '';
    if (estadoDiv) estadoDiv.style.display = 'none';
    if (vistaPrevia) vistaPrevia.style.display = 'none';
    if (resultadoDiv) resultadoDiv.innerHTML = '';
    
    tarjetaEstadoTarjetas = null;
}

// Escanear QR de tarjeta
async function iniciarEscaneoQRTarjeta() {
    // Verificar que Html5Qrcode esté disponible
    if (typeof Html5Qrcode === 'undefined') {
        if (typeof showAlert === 'function') {
            showAlert('error', 'La librería de escaneo QR no está disponible. Recarga la página.');
        } else {
            alert('La librería de escaneo QR no está disponible. Recarga la página.');
        }
        return;
    }
    
    // Verificar si el navegador soporta getUserMedia (cámara)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (typeof showAlert === 'function') {
            showAlert('error', 'Tu navegador no soporta acceso a la cámara. Por favor, usa Chrome, Firefox o Edge actualizado.');
        } else {
            alert('Tu navegador no soporta acceso a la cámara.');
        }
        return;
    }
    
    // Verificar si está en HTTPS (requerido para cámara)
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isSecure) {
        if (typeof showAlert === 'function') {
            showAlert('error', 'La cámara requiere HTTPS. Por favor, accede a la aplicación usando https:// en lugar de http://');
        } else {
            alert('La cámara requiere HTTPS. Por favor, accede usando https://');
        }
        return;
    }
    
    const modal = document.getElementById('modalScanQRTarjeta');
    const qrReader = document.getElementById('qr-reader-tarjeta');
    const qrStatus = document.getElementById('qr-reader-status-tarjeta');
    
    if (!modal || !qrReader) {
        if (typeof showAlert === 'function') {
            showAlert('error', 'No se encontró el modal de escaneo QR');
        } else {
            alert('No se encontró el modal de escaneo QR');
        }
        return;
    }
    
    // Limpiar contenido anterior del escáner
    qrReader.innerHTML = '';
    
    // Mostrar modal
    modal.style.display = 'flex';
    if (qrStatus) qrStatus.innerHTML = '<p>⏳ Iniciando cámara...</p>';
    
    try {
        // Detener escáner anterior si existe
        if (html5QrCodeTarjetas && qrScannerActiveTarjetas) {
            try {
                await html5QrCodeTarjetas.stop();
                html5QrCodeTarjetas.clear();
            } catch (e) {
                console.log('[Admin Base] Limpiando escáner anterior...');
            }
        }
        
        // Inicializar el escáner
        html5QrCodeTarjetas = new Html5Qrcode("qr-reader-tarjeta");
        
        // Obtener lista de cámaras disponibles
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
            throw new Error('No se encontraron cámaras disponibles');
        }
        
        console.log('[Admin Base] Cámaras disponibles:', devices.length);
        
        // Intentar primero con cámara trasera, luego frontal
        let cameraId = null;
        
        // Buscar cámara trasera
        const backCamera = devices.find(device => 
            device.label && device.label.toLowerCase().includes('back') ||
            device.label && device.label.toLowerCase().includes('rear') ||
            device.label && device.label.toLowerCase().includes('environment')
        );
        
        // Buscar cámara frontal
        const frontCamera = devices.find(device => 
            device.label && device.label.toLowerCase().includes('front') ||
            device.label && device.label.toLowerCase().includes('user')
        );
        
        // Usar la primera cámara disponible si no encontramos específicas
        cameraId = backCamera ? backCamera.id : (frontCamera ? frontCamera.id : devices[0].id);
        
        try {
            // Iniciar escaneo
            await html5QrCodeTarjetas.start(
                cameraId,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    videoConstraints: {
                        facingMode: backCamera ? "environment" : "user"
                    }
                },
                (decodedText, decodedResult) => {
                    // QR escaneado exitosamente
                    console.log('[Admin Base] QR escaneado:', decodedText);
                    detenerEscaneoQRTarjeta();
                    
                    // Validar formato
                    const numeroTarjeta = decodedText.trim().toUpperCase();
                    if (numeroTarjeta.match(/^TARJ-\d{6}$/)) {
                        // Asignar al input
                        const input = document.getElementById('numero_tarjeta_admin');
                        if (input) {
                            input.value = numeroTarjeta;
                            // Disparar evento input para verificar tarjeta
                            input.dispatchEvent(new Event('input'));
                            
                            if (typeof showAlert === 'function') {
                                showAlert('success', `Tarjeta escaneada: ${numeroTarjeta}`, 'Escaneo Exitoso');
                            } else {
                                alert(`Tarjeta escaneada: ${numeroTarjeta}`);
                            }
                        }
                    } else {
                        if (typeof showAlert === 'function') {
                            showAlert('error', `Formato inválido: ${numeroTarjeta}. Debe ser TARJ-XXXXXX`);
                        } else {
                            alert(`Formato inválido: ${numeroTarjeta}. Debe ser TARJ-XXXXXX`);
                        }
                    }
                },
                (errorMessage) => {
                    // Error al escanear (se ignora, es normal mientras busca)
                    // Solo loguear errores importantes
                    if (errorMessage && !errorMessage.includes('NotFoundException') && !errorMessage.includes('No QR code found')) {
                        console.log('[Admin Base] Escaneando...', errorMessage);
                    }
                }
            );
            
            qrScannerActiveTarjetas = true;
            if (qrStatus) qrStatus.innerHTML = '<p style="color: #28a745;">✅ Cámara activa - Escanea el código QR</p>';
            
        } catch (cameraError) {
            // Si falla, intentar con otra cámara
            console.log('[Admin Base] Error con primera cámara, intentando con otra...', cameraError);
            
            if (devices.length > 1) {
                // Intentar con la siguiente cámara disponible
                const nextCameraId = devices.find(d => d.id !== cameraId)?.id || devices[0].id;
                
                try {
                    await html5QrCodeTarjetas.start(
                        nextCameraId,
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0
                        },
                        (decodedText, decodedResult) => {
                            detenerEscaneoQRTarjeta();
                            const numeroTarjeta = decodedText.trim().toUpperCase();
                            if (numeroTarjeta.match(/^TARJ-\d{6}$/)) {
                                const input = document.getElementById('numero_tarjeta_admin');
                                if (input) {
                                    input.value = numeroTarjeta;
                                    input.dispatchEvent(new Event('input'));
                                    if (typeof showAlert === 'function') {
                                        showAlert('success', `Tarjeta escaneada: ${numeroTarjeta}`, 'Escaneo Exitoso');
                                    }
                                }
                            } else {
                                if (typeof showAlert === 'function') {
                                    showAlert('error', `Formato inválido: ${numeroTarjeta}. Debe ser TARJ-XXXXXX`);
                                }
                            }
                        },
                        (errorMessage) => {
                            // Ignorar errores normales de escaneo
                        }
                    );
                    
                    qrScannerActiveTarjetas = true;
                    if (qrStatus) qrStatus.innerHTML = '<p style="color: #28a745;">✅ Cámara activa - Escanea el código QR</p>';
                } catch (secondError) {
                    throw cameraError; // Lanzar el error original
                }
            } else {
                throw cameraError;
            }
        }
        
    } catch (error) {
        console.error('[Admin Base] Error iniciando escáner QR:', error);
        const errorMsg = error.message || error.toString() || 'Error desconocido';
        if (qrStatus) qrStatus.innerHTML = `<p style="color: #dc3545;">❌ Error: ${errorMsg}</p>`;
        
        // Mensaje más específico según el error
        let mensajeUsuario = 'No se pudo acceder a la cámara.';
        if (errorMsg.includes('Permission') || errorMsg.includes('permission') || errorMsg.includes('NotAllowed')) {
            mensajeUsuario = 'Permisos de cámara denegados. Por favor, permite el acceso a la cámara en la configuración del navegador.';
        } else if (errorMsg.includes('NotFound') || errorMsg.includes('not found') || errorMsg.includes('No cameras')) {
            mensajeUsuario = 'No se encontró ninguna cámara disponible. Verifica que tu dispositivo tenga cámara.';
        } else if (errorMsg.includes('streaming not supported') || errorMsg.includes('getUserMedia')) {
            mensajeUsuario = 'Tu navegador no soporta streaming de cámara. Por favor, usa Chrome, Firefox o Edge actualizado, y asegúrate de acceder mediante HTTPS.';
        } else if (errorMsg.includes('HTTPS') || errorMsg.includes('secure context')) {
            mensajeUsuario = 'La cámara requiere HTTPS. Por favor, accede a la aplicación usando https:// en lugar de http://';
        }
        
        if (typeof showAlert === 'function') {
            showAlert('error', mensajeUsuario);
        } else {
            alert(mensajeUsuario);
        }
        
        // Cerrar modal después de mostrar error
        setTimeout(() => {
            detenerEscaneoQRTarjeta();
        }, 2000);
    }
}

// Detener escaneo QR
function detenerEscaneoQRTarjeta() {
    if (html5QrCodeTarjetas && qrScannerActiveTarjetas) {
        html5QrCodeTarjetas.stop().then(() => {
            html5QrCodeTarjetas.clear();
            qrScannerActiveTarjetas = false;
            console.log('[Admin Base] Escáner detenido correctamente');
        }).catch((err) => {
            console.error('[Admin Base] Error deteniendo escáner:', err);
            // Forzar limpieza aunque haya error
            try {
                html5QrCodeTarjetas.clear();
            } catch (e) {
                console.log('[Admin Base] Limpiando escáner...');
            }
            qrScannerActiveTarjetas = false;
        });
    }
    
    const modal = document.getElementById('modalScanQRTarjeta');
    const qrReader = document.getElementById('qr-reader-tarjeta');
    const qrStatus = document.getElementById('qr-reader-status-tarjeta');
    
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Limpiar contenido del escáner
    if (qrReader) {
        qrReader.innerHTML = '';
    }
    
    if (qrStatus) {
        qrStatus.innerHTML = '<p>⏳ Iniciando cámara...</p>';
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
let listenerGlobalAgregado = false;

// ============================================
// MÓDULO DE PERFIL
// ============================================

let perfilOriginal = null;

async function cargarPerfil() {
    try {
        const { data, error } = await hacerPeticion('/api/perfil', { method: 'GET' });
        if (error || !data.success) {
            console.error('[Admin Base] Error cargando perfil:', error || data.error);
            showAlert('error', 'Error al cargar el perfil');
            return;
        }
        
        perfilOriginal = data.data;
        mostrarPerfil(perfilOriginal);
        console.log('[Admin Base] Perfil cargado correctamente');
    } catch (error) {
        console.error('[Admin Base] Error cargando perfil:', error);
        showAlert('error', 'Error de conexión al cargar el perfil');
    }
}

function mostrarPerfil(perfil) {
    const nombreInput = document.getElementById('perfilNombreCompleto');
    const emailInput = document.getElementById('perfilEmail');
    const telefonoInput = document.getElementById('perfilTelefono');
    const usuarioInput = document.getElementById('perfilUsuario');
    const rolInput = document.getElementById('perfilRol');
    const fotoImg = document.getElementById('fotoPerfilImg');
    const fotoPlaceholder = document.getElementById('fotoPerfilPlaceholder');
    const btnEliminarFoto = document.getElementById('btnEliminarFoto');
    
    if (nombreInput) nombreInput.value = perfil.nombre_completo || '';
    if (emailInput) emailInput.value = perfil.email || '';
    if (telefonoInput) telefonoInput.value = perfil.telefono || '';
    if (usuarioInput) usuarioInput.value = perfil.usuario || '';
    if (rolInput) rolInput.value = perfil.rol === 'admin' ? 'Administrador' : perfil.rol;
    
    // Mostrar foto de perfil
    if (fotoImg && fotoPlaceholder && btnEliminarFoto) {
        if (perfil.foto_perfil) {
            fotoImg.src = perfil.foto_perfil;
            fotoImg.style.display = 'block';
            fotoPlaceholder.style.display = 'none';
            btnEliminarFoto.style.display = 'inline-block';
        } else {
            fotoImg.style.display = 'none';
            fotoPlaceholder.style.display = 'flex';
            btnEliminarFoto.style.display = 'none';
        }
    }
}

async function actualizarPerfil() {
    const formEditarPerfil = document.getElementById('formEditarPerfil');
    if (!formEditarPerfil) {
        console.error('[Admin Base] Formulario de perfil no encontrado');
        return;
    }
    
    const btnGuardar = document.getElementById('btnGuardarPerfil');
    const btnText = btnGuardar ? btnGuardar.querySelector('.btn-text') : null;
    const btnLoader = btnGuardar ? btnGuardar.querySelector('.btn-loader') : null;
    
    if (btnGuardar) btnGuardar.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'inline-block';
    
    try {
        const formData = new FormData();
        const nombreInput = document.getElementById('perfilNombreCompleto');
        const emailInput = document.getElementById('perfilEmail');
        const telefonoInput = document.getElementById('perfilTelefono');
        const inputFoto = document.getElementById('inputFotoPerfil');
        
        if (nombreInput) formData.append('nombre_completo', nombreInput.value.trim());
        if (emailInput) formData.append('email', emailInput.value.trim());
        if (telefonoInput) formData.append('telefono', telefonoInput.value.trim());
        
        // Agregar foto si hay una seleccionada
        if (inputFoto && inputFoto.files[0]) {
            formData.append('foto_perfil', inputFoto.files[0]);
            console.log('[Admin Base] Foto agregada al FormData:', inputFoto.files[0].name);
        }
        
        console.log('[Admin Base] Enviando actualización de perfil...');
        console.log('[Admin Base] FormData tiene foto:', inputFoto && inputFoto.files[0] ? 'Sí' : 'No');
        
        const { response, data, error } = await hacerPeticion('/api/perfil', {
            method: 'PUT',
            body: formData
        });
        
        console.log('[Admin Base] Respuesta del servidor:', { response, data, error });
        
        if (error) {
            console.error('[Admin Base] Error en la petición:', error);
            showAlert('error', `Error: ${error}`);
            return;
        }
        
        if (!response) {
            console.error('[Admin Base] No hay respuesta del servidor');
            showAlert('error', 'No se recibió respuesta del servidor');
            return;
        }
        
        if (response.status !== 200) {
            console.error('[Admin Base] Error HTTP:', response.status);
            const errorMsg = data?.error || `Error ${response.status}`;
            showAlert('error', errorMsg);
            return;
        }
        
        if (data && data.success) {
            showAlert('success', 'Perfil actualizado correctamente', 'Éxito');
            perfilOriginal = data.data;
            mostrarPerfil(data.data);
            
            // Limpiar input de foto después de guardar
            if (inputFoto) inputFoto.value = '';
            
            // Actualizar avatar en sidebar si existe
            const sidebarAvatar = document.querySelector('.user-avatar');
            if (sidebarAvatar && data.data.foto_perfil) {
                sidebarAvatar.innerHTML = `<img src="${data.data.foto_perfil}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            }
            
            console.log('[Admin Base] Perfil actualizado correctamente:', data.data);
        } else {
            const errorMsg = data?.error || 'Error al actualizar el perfil';
            console.error('[Admin Base] Error del servidor:', errorMsg);
            showAlert('error', errorMsg);
        }
    } catch (error) {
        console.error('[Admin Base] Error actualizando perfil:', error);
        showAlert('error', 'Error de conexión al actualizar el perfil');
    } finally {
        if (btnGuardar) btnGuardar.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoader) btnLoader.style.display = 'none';
    }
}

// ============================================
// MÓDULO DE CAJA (RECARGAS)
// ============================================

let tarjetaActualCaja = null;

async function cargarInfoTarjetaCaja(numero_tarjeta) {
    if (!numero_tarjeta || numero_tarjeta.trim() === '') {
        return;
    }
    
    numero_tarjeta = numero_tarjeta.trim().toUpperCase();
    
    try {
        const { data, error } = await hacerPeticion(`/api/tarjetas/saldo/${numero_tarjeta}`, { method: 'GET' });
        
        if (error || !data.success) {
            const infoDiv = document.getElementById('infoTarjetaCaja');
            if (infoDiv) infoDiv.style.display = 'none';
            tarjetaActualCaja = null;
            return;
        }
        
        tarjetaActualCaja = data.data;
        mostrarInfoTarjetaCaja(tarjetaActualCaja);
        console.log('[Admin Base] Información de tarjeta cargada:', tarjetaActualCaja);
    } catch (error) {
        console.error('[Admin Base] Error cargando información de tarjeta:', error);
        const infoDiv = document.getElementById('infoTarjetaCaja');
        if (infoDiv) infoDiv.style.display = 'none';
        tarjetaActualCaja = null;
    }
}

function mostrarInfoTarjetaCaja(tarjeta) {
    const infoDiv = document.getElementById('infoTarjetaCaja');
    const asistenteNombre = document.getElementById('asistenteNombreCaja');
    const saldoActual = document.getElementById('saldoActualCaja');
    const estadoTarjeta = document.getElementById('estadoTarjetaCaja');
    const numeroTarjetaInfo = document.getElementById('numeroTarjetaInfoCaja');
    
    if (!infoDiv || !tarjeta) {
        return;
    }
    
    if (asistenteNombre) asistenteNombre.textContent = tarjeta.asistente_nombre || 'N/A';
    if (saldoActual) saldoActual.textContent = `$${parseFloat(tarjeta.saldo || 0).toFixed(2)}`;
    if (numeroTarjetaInfo) numeroTarjetaInfo.textContent = tarjeta.numero_tarjeta || 'N/A';
    
    // Estado de la tarjeta
    if (estadoTarjeta) {
        const activa = tarjeta.activa !== undefined ? tarjeta.activa : true;
        if (activa) {
            estadoTarjeta.innerHTML = '<span style="color: #28a745; font-weight: bold;">✅ Activa</span>';
        } else {
            estadoTarjeta.innerHTML = '<span style="color: #dc3545; font-weight: bold;">🔒 Bloqueada</span>';
        }
    }
    
    infoDiv.style.display = 'block';
}

async function recargarSaldoCaja() {
    const formRecargarCaja = document.getElementById('formRecargarCaja');
    if (!formRecargarCaja) {
        console.error('[Admin Base] Formulario de recarga no encontrado');
        return;
    }
    
    const numeroTarjeta = document.getElementById('numeroTarjetaCaja');
    const montoInput = document.getElementById('montoRecargaCaja');
    const btnRecargar = document.getElementById('btnRecargarCaja');
    const btnText = btnRecargar ? btnRecargar.querySelector('.btn-text') : null;
    const btnLoader = btnRecargar ? btnRecargar.querySelector('.btn-loader') : null;
    
    if (!numeroTarjeta || !montoInput) {
        showAlert('error', 'Campos requeridos no encontrados');
        return;
    }
    
    const numero_tarjeta = numeroTarjeta.value.trim().toUpperCase();
    const monto = parseFloat(montoInput.value);
    
    // Validaciones
    if (!numero_tarjeta || !numero_tarjeta.match(/^TARJ-\d{6}$/)) {
        showAlert('error', 'Número de tarjeta inválido. Debe ser TARJ-XXXXXX');
        return;
    }
    
    if (!monto || monto <= 0 || isNaN(monto)) {
        showAlert('error', 'El monto debe ser mayor a cero');
        return;
    }
    
    if (btnRecargar) btnRecargar.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'inline-block';
    
    try {
        const { response, data, error } = await hacerPeticion('/api/tarjetas/recargar', {
            method: 'POST',
            body: JSON.stringify({ numero_tarjeta, monto })
        });
        
        if (error) {
            showAlert('error', `Error de conexión: ${error}`);
            return;
        }
        
        if (!response) {
            showAlert('error', 'No se recibió respuesta del servidor');
            return;
        }
        
        if (response.status !== 200) {
            const errorMsg = data?.error || `Error ${response.status}`;
            showAlert('error', errorMsg);
            return;
        }
        
        if (data && data.success) {
            const mensaje = data.message || `Saldo recargado correctamente: $${monto.toFixed(2)}`;
            if (data.data.tarjeta_desbloqueada) {
                showAlert('success', mensaje + ' (Tarjeta desbloqueada)', 'Recarga Exitosa');
            } else {
                showAlert('success', mensaje, 'Recarga Exitosa');
            }
            
            // Actualizar información de tarjeta
            await cargarInfoTarjetaCaja(numero_tarjeta);
            
            // Agregar al historial
            agregarAlHistorialRecargas(data.data);
            
            // Limpiar formulario (mantener número de tarjeta)
            montoInput.value = '';
            montoInput.focus();
            
            console.log('[Admin Base] Recarga exitosa:', data.data);
        } else {
            showAlert('error', data?.error || 'Error al recargar saldo');
        }
    } catch (error) {
        console.error('[Admin Base] Error recargando saldo:', error);
        showAlert('error', 'Error de conexión al recargar saldo');
    } finally {
        if (btnRecargar) btnRecargar.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoader) btnLoader.style.display = 'none';
    }
}

function agregarAlHistorialRecargas(datosRecarga) {
    const historialDiv = document.getElementById('historialRecargasCaja');
    if (!historialDiv) return;
    
    // Si es el primer elemento, limpiar mensaje inicial
    if (historialDiv.querySelector('p[style*="text-align: center"]')) {
        historialDiv.innerHTML = '';
    }
    
    const fecha = new Date().toLocaleString('es-MX');
    const itemHistorial = document.createElement('div');
    itemHistorial.style.cssText = 'padding: 12px; margin-bottom: 10px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #28a745;';
    itemHistorial.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <strong style="color: #28a745;">💰 Recarga: $${parseFloat(datosRecarga.monto_recargado || 0).toFixed(2)}</strong>
            <small style="color: #666;">${fecha}</small>
        </div>
        <div style="font-size: 0.9em; color: #666;">
            <div><strong>Tarjeta:</strong> ${datosRecarga.tarjeta?.numero_tarjeta || 'N/A'}</div>
            <div><strong>Saldo anterior:</strong> $${parseFloat(datosRecarga.saldo_anterior || 0).toFixed(2)}</div>
            <div><strong>Saldo nuevo:</strong> <span style="color: #28a745; font-weight: bold;">$${parseFloat(datosRecarga.saldo_nuevo || 0).toFixed(2)}</span></div>
            ${datosRecarga.tarjeta_desbloqueada ? '<div style="color: #28a745; margin-top: 5px;">✅ Tarjeta desbloqueada</div>' : ''}
        </div>
    `;
    
    // Insertar al inicio
    historialDiv.insertBefore(itemHistorial, historialDiv.firstChild);
    
    // Limitar a 10 elementos
    while (historialDiv.children.length > 10) {
        historialDiv.removeChild(historialDiv.lastChild);
    }
}

// ============================================
// MÓDULO DE PUNTO DE VENTA
// ============================================

let tarjetaActualPOS = null;
let carritoPOS = [];
let productosPOS = [];
let puntoVentaSeleccionadoPOS = null;

async function cargarPuntosVentaPOS() {
    try {
        const { data, error } = await hacerPeticion('/api/puntos-venta', { method: 'GET' });
        
        if (error || !data.success) {
            console.error('[Admin Base] Error cargando puntos de venta:', error || data.error);
            return;
        }
        
        const select = document.getElementById('puntoVentaSelect');
        if (!select) return;
        
        // Limpiar opciones excepto la primera
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Agregar puntos de venta
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

async function cargarProductosPorPuntoVenta(punto_venta_id) {
    if (!punto_venta_id) {
        const container = document.getElementById('productosPOSContainer');
        if (container) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Seleccione un punto de venta para ver los productos</p>';
        }
        return;
    }
    
    try {
        const { data, error } = await hacerPeticion(`/api/productos?punto_venta_id=${punto_venta_id}`, { method: 'GET' });
        
        if (error || !data.success) {
            console.error('[Admin Base] Error cargando productos:', error || data.error);
            showAlert('error', 'Error al cargar productos');
            return;
        }
        
        productosPOS = (data.data || []).filter(p => p.activo);
        mostrarProductosPOS();
        console.log('[Admin Base] Productos cargados para punto de venta:', productosPOS.length);
    } catch (error) {
        console.error('[Admin Base] Error cargando productos:', error);
        showAlert('error', 'Error de conexión al cargar productos');
    }
}

function mostrarProductosPOS() {
    const container = document.getElementById('productosPOSContainer');
    if (!container) return;
    
    if (productosPOS.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No hay productos disponibles en este punto de venta</p>';
        return;
    }
    
    // Agrupar por tipo
    const productosPorTipo = {};
    productosPOS.forEach(producto => {
        if (!productosPorTipo[producto.tipo]) {
            productosPorTipo[producto.tipo] = [];
        }
        productosPorTipo[producto.tipo].push(producto);
    });
    
    let html = '';
    Object.keys(productosPorTipo).sort().forEach(tipo => {
        html += `<div style="margin-bottom: 20px;">`;
        html += `<h4 style="margin: 0 0 10px 0; color: var(--text-primary);">${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h4>`;
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;">`;
        
        productosPorTipo[tipo].forEach(producto => {
            html += `
                <div style="border: 1px solid var(--border); border-radius: 6px; padding: 10px; cursor: pointer; transition: all 0.2s; background: white;" 
                     onclick="agregarAlCarritoPOS(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', ${producto.precio})"
                     onmouseover="this.style.borderColor='var(--accent-blue)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'"
                     onmouseout="this.style.borderColor='var(--border)'; this.style.boxShadow='none'">
                    <div style="font-weight: bold; margin-bottom: 5px;">${producto.nombre}</div>
                    <div style="color: var(--accent-blue); font-size: 1.1em; font-weight: bold;">$${parseFloat(producto.precio || 0).toFixed(2)}</div>
                </div>
            `;
        });
        
        html += `</div></div>`;
    });
    
    container.innerHTML = html;
}

function agregarAlCarritoPOS(producto_id, nombre, precio) {
    if (!tarjetaActualPOS || !tarjetaActualPOS.activa) {
        showAlert('error', 'Debe buscar una tarjeta activa antes de agregar productos');
        return;
    }
    
    // Verificar si el producto ya está en el carrito
    const itemExistente = carritoPOS.find(item => item.id === producto_id);
    if (itemExistente) {
        itemExistente.cantidad += 1;
        itemExistente.subtotal = itemExistente.cantidad * itemExistente.precio;
    } else {
        carritoPOS.push({
            id: producto_id,
            nombre: nombre,
            precio: parseFloat(precio),
            cantidad: 1,
            subtotal: parseFloat(precio)
        });
    }
    
    actualizarCarritoPOS();
    console.log('[Admin Base] Producto agregado al carrito:', nombre);
}

function actualizarCarritoPOS() {
    const container = document.getElementById('carritoPOSContainer');
    const resumenDiv = document.getElementById('resumenCarritoPOS');
    const btnProcesar = document.getElementById('btnProcesarVentaPOS');
    
    if (!container) return;
    
    if (carritoPOS.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">El carrito está vacío. Agregue productos para continuar.</p>';
        if (resumenDiv) resumenDiv.style.display = 'none';
        if (btnProcesar) btnProcesar.disabled = true;
        return;
    }
    
    // Calcular totales
    const subtotal = carritoPOS.reduce((sum, item) => sum + item.subtotal, 0);
    const total = subtotal;
    
    // Mostrar items del carrito
    let html = '<div style="max-height: 300px; overflow-y: auto;">';
    carritoPOS.forEach((item, index) => {
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid var(--border);">
                <div style="flex: 1;">
                    <div style="font-weight: bold;">${item.nombre}</div>
                    <div style="font-size: 0.9em; color: #666;">$${item.precio.toFixed(2)} x ${item.cantidad}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button onclick="modificarCantidadPOS(${index}, -1)" style="background: #dc3545; color: white; border: none; border-radius: 4px; width: 30px; height: 30px; cursor: pointer;">-</button>
                    <span style="min-width: 30px; text-align: center;">${item.cantidad}</span>
                    <button onclick="modificarCantidadPOS(${index}, 1)" style="background: #28a745; color: white; border: none; border-radius: 4px; width: 30px; height: 30px; cursor: pointer;">+</button>
                    <span style="font-weight: bold; color: var(--accent-blue); min-width: 80px; text-align: right;">$${item.subtotal.toFixed(2)}</span>
                    <button onclick="eliminarDelCarritoPOS(${index})" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;">🗑️</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
    
    // Actualizar resumen
    if (resumenDiv) {
        const subtotalEl = document.getElementById('subtotalCarritoPOS');
        const totalEl = document.getElementById('totalCarritoPOS');
        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
        resumenDiv.style.display = 'block';
    }
    
    // Habilitar/deshabilitar botón procesar
    if (btnProcesar) {
        const saldoDisponible = parseFloat(tarjetaActualPOS?.saldo || 0);
        if (total > 0 && tarjetaActualPOS && tarjetaActualPOS.activa && saldoDisponible >= total) {
            btnProcesar.disabled = false;
        } else {
            btnProcesar.disabled = true;
        }
    }
}

function modificarCantidadPOS(index, cambio) {
    if (index < 0 || index >= carritoPOS.length) return;
    
    const item = carritoPOS[index];
    item.cantidad += cambio;
    
    if (item.cantidad <= 0) {
        carritoPOS.splice(index, 1);
    } else {
        item.subtotal = item.cantidad * item.precio;
    }
    
    actualizarCarritoPOS();
}

function eliminarDelCarritoPOS(index) {
    if (index < 0 || index >= carritoPOS.length) return;
    carritoPOS.splice(index, 1);
    actualizarCarritoPOS();
}

async function buscarTarjetaPOS(numero_tarjeta) {
    if (!numero_tarjeta || !numero_tarjeta.match(/^TARJ-\d{6}$/)) {
        showAlert('error', 'Número de tarjeta inválido. Debe ser TARJ-XXXXXX');
        return;
    }
    
    numero_tarjeta = numero_tarjeta.trim().toUpperCase();
    
    try {
        const { data, error } = await hacerPeticion(`/api/tarjetas/saldo/${numero_tarjeta}`, { method: 'GET' });
        
        if (error || !data.success) {
            const infoDiv = document.getElementById('infoTarjetaPOS');
            if (infoDiv) infoDiv.style.display = 'none';
            tarjetaActualPOS = null;
            showAlert('error', data?.error || 'Tarjeta no encontrada');
            return;
        }
        
        tarjetaActualPOS = data.data;
        mostrarInfoTarjetaPOS(tarjetaActualPOS);
        actualizarCarritoPOS(); // Actualizar estado del botón procesar
        console.log('[Admin Base] Tarjeta cargada para POS:', tarjetaActualPOS);
    } catch (error) {
        console.error('[Admin Base] Error cargando tarjeta:', error);
        showAlert('error', 'Error de conexión al buscar tarjeta');
    }
}

function mostrarInfoTarjetaPOS(tarjeta) {
    const infoDiv = document.getElementById('infoTarjetaPOS');
    const asistenteNombre = document.getElementById('asistenteNombrePOS');
    const saldoDisponible = document.getElementById('saldoDisponiblePOS');
    const estadoTarjeta = document.getElementById('estadoTarjetaPOS');
    const numeroTarjetaInfo = document.getElementById('numeroTarjetaInfoPOS');
    
    if (!infoDiv || !tarjeta) {
        return;
    }
    
    if (asistenteNombre) asistenteNombre.textContent = tarjeta.asistente_nombre || 'N/A';
    if (saldoDisponible) saldoDisponible.textContent = `$${parseFloat(tarjeta.saldo || 0).toFixed(2)}`;
    if (numeroTarjetaInfo) numeroTarjetaInfo.textContent = tarjeta.numero_tarjeta || 'N/A';
    
    // Estado de la tarjeta
    if (estadoTarjeta) {
        const activa = tarjeta.activa !== undefined ? tarjeta.activa : true;
        if (activa) {
            estadoTarjeta.innerHTML = '<span style="color: #28a745; font-weight: bold;">✅ Activa</span>';
        } else {
            estadoTarjeta.innerHTML = '<span style="color: #dc3545; font-weight: bold;">🔒 Bloqueada</span>';
        }
    }
    
    infoDiv.style.display = 'block';
}

async function procesarVentaPOS() {
    if (!tarjetaActualPOS || !tarjetaActualPOS.activa) {
        showAlert('error', 'Debe buscar una tarjeta activa antes de procesar la venta');
        return;
    }
    
    if (!puntoVentaSeleccionadoPOS) {
        showAlert('error', 'Debe seleccionar un punto de venta');
        return;
    }
    
    if (carritoPOS.length === 0) {
        showAlert('error', 'El carrito está vacío');
        return;
    }
    
    // Calcular total
    const total = carritoPOS.reduce((sum, item) => sum + item.subtotal, 0);
    const saldoDisponible = parseFloat(tarjetaActualPOS.saldo || 0);
    
    // Validar saldo
    if (saldoDisponible < total) {
        showAlert('error', `Saldo insuficiente. Saldo disponible: $${saldoDisponible.toFixed(2)}, Total: $${total.toFixed(2)}`);
        return;
    }
    
    const btnProcesar = document.getElementById('btnProcesarVentaPOS');
    if (btnProcesar) btnProcesar.disabled = true;
    
    try {
        // Procesar pago
        const descripcion = `Venta en ${puntoVentaSeleccionadoPOS.nombre}: ${carritoPOS.map(i => `${i.nombre} x${i.cantidad}`).join(', ')}`;
        
        const { response, data, error } = await hacerPeticion('/api/tarjetas/pagar', {
            method: 'POST',
            body: JSON.stringify({
                numero_tarjeta: tarjetaActualPOS.numero_tarjeta,
                punto_venta_id: puntoVentaSeleccionadoPOS.id,
                monto: total,
                descripcion: descripcion
            })
        });
        
        if (error) {
            showAlert('error', `Error de conexión: ${error}`);
            return;
        }
        
        if (!response || response.status !== 200) {
            const errorMsg = data?.error || `Error ${response?.status || 'desconocido'}`;
            showAlert('error', errorMsg);
            return;
        }
        
        if (data && data.success) {
            const mensaje = data.message || `Venta procesada correctamente: $${total.toFixed(2)}`;
            if (data.data.tarjeta_bloqueada) {
                showAlert('warning', mensaje + ' (Tarjeta bloqueada por saldo insuficiente)', 'Venta Procesada');
            } else {
                showAlert('success', mensaje, 'Venta Procesada');
            }
            
            // Actualizar información de tarjeta
            await buscarTarjetaPOS(tarjetaActualPOS.numero_tarjeta);
            
            // Agregar al historial
            agregarAlHistorialVentas(data.data, carritoPOS);
            
            // Limpiar carrito
            carritoPOS = [];
            actualizarCarritoPOS();
            
            console.log('[Admin Base] Venta procesada exitosamente:', data.data);
        } else {
            showAlert('error', data?.error || 'Error al procesar la venta');
        }
    } catch (error) {
        console.error('[Admin Base] Error procesando venta:', error);
        showAlert('error', 'Error de conexión al procesar la venta');
    } finally {
        if (btnProcesar) btnProcesar.disabled = false;
    }
}

function agregarAlHistorialVentas(datosVenta, itemsCarrito) {
    const historialDiv = document.getElementById('historialVentasPOS');
    if (!historialDiv) return;
    
    // Si es el primer elemento, limpiar mensaje inicial
    if (historialDiv.querySelector('p[style*="text-align: center"]')) {
        historialDiv.innerHTML = '';
    }
    
    const fecha = new Date().toLocaleString('es-MX');
    const itemHistorial = document.createElement('div');
    itemHistorial.style.cssText = 'padding: 12px; margin-bottom: 10px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #28a745;';
    
    const itemsTexto = itemsCarrito.map(i => `${i.nombre} x${i.cantidad}`).join(', ');
    itemHistorial.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <strong style="color: #28a745;">💳 Venta: $${parseFloat(datosVenta.monto_pagado || 0).toFixed(2)}</strong>
            <small style="color: #666;">${fecha}</small>
        </div>
        <div style="font-size: 0.9em; color: #666;">
            <div><strong>Tarjeta:</strong> ${datosVenta.tarjeta?.numero_tarjeta || 'N/A'}</div>
            <div><strong>Punto de Venta:</strong> ${datosVenta.punto_venta || 'N/A'}</div>
            <div><strong>Productos:</strong> ${itemsTexto}</div>
            <div><strong>Saldo anterior:</strong> $${parseFloat(datosVenta.saldo_anterior || 0).toFixed(2)}</div>
            <div><strong>Saldo nuevo:</strong> <span style="color: #28a745; font-weight: bold;">$${parseFloat(datosVenta.saldo_nuevo || 0).toFixed(2)}</span></div>
            ${datosVenta.tarjeta_bloqueada ? '<div style="color: #dc3545; margin-top: 5px;">🔒 Tarjeta bloqueada</div>' : ''}
        </div>
    `;
    
    // Insertar al inicio
    historialDiv.insertBefore(itemHistorial, historialDiv.firstChild);
    
    // Limitar a 10 elementos
    while (historialDiv.children.length > 10) {
        historialDiv.removeChild(historialDiv.lastChild);
    }
}

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
                
                // Cerrar menú móvil después de cambiar de sección
                if (window.innerWidth <= 768 && adminSidebar) {
                    setTimeout(() => {
                        adminSidebar.classList.remove('mobile-open');
                        if (mobileMenuToggle) mobileMenuToggle.classList.remove('active');
                        if (mobileOverlay) mobileOverlay.classList.remove('active');
                    }, 300);
                }
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
            
            const mostrarNoDisponibles = document.getElementById('mostrarNoDisponibles');
            if (mostrarNoDisponibles) {
                mostrarNoDisponibles.addEventListener('change', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    mostrarProductosAdmin();
                });
                console.log('[Admin Base] Filtro de disponibilidad inicializado');
            }
            
            // 9. Inicializar reportes
            // Cargar puntos de venta para reportes
            cargarPuntosVentaReportes();
            
            // Formulario de filtros de ventas
            const formFiltrosVentas = document.getElementById('formFiltrosVentas');
            if (formFiltrosVentas) {
                const newForm = formFiltrosVentas.cloneNode(true);
                formFiltrosVentas.parentNode.replaceChild(newForm, formFiltrosVentas);
                
                newForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    await cargarReporteVentas();
                });
                console.log('[Admin Base] Formulario de filtros de ventas inicializado');
            }
            
            // Botón limpiar filtros ventas
            const btnLimpiarVentas = document.getElementById('btnLimpiarFiltrosVentas');
            if (btnLimpiarVentas) {
                btnLimpiarVentas.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    document.getElementById('fechaInicioVentas').value = '';
                    document.getElementById('fechaFinVentas').value = '';
                    document.getElementById('puntoVentaVentas').value = '';
                    const resumenEl = document.getElementById('resumenVentas');
                    const tablaEl = document.getElementById('tablaVentasContainer');
                    const sinDatosEl = document.getElementById('sinDatosVentas');
                    const btnExportarEl = document.getElementById('btnExportarVentas');
                    if (resumenEl) resumenEl.style.display = 'none';
                    if (tablaEl) tablaEl.style.display = 'none';
                    if (sinDatosEl) sinDatosEl.style.display = 'block';
                    if (btnExportarEl) btnExportarEl.style.display = 'none';
                });
                console.log('[Admin Base] Botón limpiar filtros de ventas inicializado');
            }
            
            // Formulario de filtros de transacciones
            const formFiltrosTransacciones = document.getElementById('formFiltrosTransacciones');
            if (formFiltrosTransacciones) {
                const newForm = formFiltrosTransacciones.cloneNode(true);
                formFiltrosTransacciones.parentNode.replaceChild(newForm, formFiltrosTransacciones);
                
                newForm.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    await cargarReporteTransacciones();
                });
                console.log('[Admin Base] Formulario de filtros de transacciones inicializado');
            }
            
            // Botón limpiar filtros transacciones
            const btnLimpiarTransacciones = document.getElementById('btnLimpiarFiltrosTransacciones');
            if (btnLimpiarTransacciones) {
                btnLimpiarTransacciones.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    document.getElementById('fechaInicioTransacciones').value = '';
                    document.getElementById('fechaFinTransacciones').value = '';
                    document.getElementById('tipoTransaccion').value = '';
                    document.getElementById('puntoVentaTransacciones').value = '';
                    const resumenEl = document.getElementById('resumenTransacciones');
                    const tablaEl = document.getElementById('tablaTransaccionesContainer');
                    const sinDatosEl = document.getElementById('sinDatosTransacciones');
                    const btnExportarEl = document.getElementById('btnExportarTransacciones');
                    if (resumenEl) resumenEl.style.display = 'none';
                    if (tablaEl) tablaEl.style.display = 'none';
                    if (sinDatosEl) sinDatosEl.style.display = 'block';
                    if (btnExportarEl) btnExportarEl.style.display = 'none';
                });
                console.log('[Admin Base] Botón limpiar filtros de transacciones inicializado');
            }
    
    // Prevenir que otros formularios cambien de sección accidentalmente
    document.querySelectorAll('form').forEach(form => {
        if (form.id !== 'formFiltrosVentas' && form.id !== 'formFiltrosTransacciones' && form.id !== 'formEditarPerfil') {
            form.addEventListener('submit', function(e) {
                // Solo prevenir propagación, no el submit (para que funcione el backend)
                e.stopPropagation();
            });
        }
    });
    
            // 10. Inicializar módulo de perfil
            // Cargar perfil cuando se muestra la sección
            const perfilLink = document.querySelector('[data-section="perfil"]');
            if (perfilLink) {
                perfilLink.addEventListener('click', function() {
                    setTimeout(() => {
                        cargarPerfil();
                    }, 100);
                });
                console.log('[Admin Base] Listener de perfil inicializado');
            }
            
            // Preview de foto antes de subir
            const inputFoto = document.getElementById('inputFotoPerfil');
            if (inputFoto) {
                const newInput = inputFoto.cloneNode(true);
                inputFoto.parentNode.replaceChild(newInput, inputFoto);
                
                newInput.addEventListener('change', function(e) {
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
                        reader.onload = function(event) {
                            const fotoImg = document.getElementById('fotoPerfilImg');
                            const fotoPlaceholder = document.getElementById('fotoPerfilPlaceholder');
                            const btnEliminarFoto = document.getElementById('btnEliminarFoto');
                            
                            if (fotoImg) {
                                fotoImg.src = event.target.result;
                                fotoImg.style.display = 'block';
                            }
                            if (fotoPlaceholder) fotoPlaceholder.style.display = 'none';
                            if (btnEliminarFoto) btnEliminarFoto.style.display = 'inline-block';
                        };
                        reader.readAsDataURL(file);
                        console.log('[Admin Base] Preview de foto mostrado');
                    }
                });
                console.log('[Admin Base] Listener de preview de foto inicializado');
            }
            
            // Eliminar foto
            const btnEliminarFoto = document.getElementById('btnEliminarFoto');
            if (btnEliminarFoto) {
                btnEliminarFoto.addEventListener('click', function() {
                    const fotoImg = document.getElementById('fotoPerfilImg');
                    const fotoPlaceholder = document.getElementById('fotoPerfilPlaceholder');
                    const inputFoto = document.getElementById('inputFotoPerfil');
                    
                    if (fotoImg) {
                        fotoImg.src = '';
                        fotoImg.style.display = 'none';
                    }
                    if (fotoPlaceholder) fotoPlaceholder.style.display = 'flex';
                    if (inputFoto) inputFoto.value = '';
                    this.style.display = 'none';
                    console.log('[Admin Base] Foto eliminada del preview');
                });
                console.log('[Admin Base] Listener de eliminar foto inicializado');
            }
            
            // Formulario de edición de perfil
            const formEditarPerfil = document.getElementById('formEditarPerfil');
            if (formEditarPerfil) {
                const newForm = formEditarPerfil.cloneNode(true);
                formEditarPerfil.parentNode.replaceChild(newForm, formEditarPerfil);
                
                newForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    actualizarPerfil();
                });
                console.log('[Admin Base] Formulario de perfil inicializado');
            }
            
            // Botón cancelar perfil
            const btnCancelarPerfil = document.getElementById('btnCancelarPerfil');
            if (btnCancelarPerfil) {
                btnCancelarPerfil.addEventListener('click', function() {
                    if (perfilOriginal) {
                        mostrarPerfil(perfilOriginal);
                        const inputFoto = document.getElementById('inputFotoPerfil');
                        if (inputFoto) inputFoto.value = '';
                        console.log('[Admin Base] Perfil restaurado a valores originales');
                    }
                });
                console.log('[Admin Base] Botón cancelar perfil inicializado');
            }
            
            // ============================================
            // INICIALIZAR MÓDULO DE CAJA
            // ============================================
            
            // Cargar información de tarjeta cuando se ingresa número
            const numeroTarjetaCaja = document.getElementById('numeroTarjetaCaja');
            if (numeroTarjetaCaja) {
                let timeoutCaja = null;
                numeroTarjetaCaja.addEventListener('input', function() {
                    clearTimeout(timeoutCaja);
                    const numero = this.value.trim().toUpperCase();
                    if (numero.match(/^TARJ-\d{6}$/)) {
                        timeoutCaja = setTimeout(() => {
                            cargarInfoTarjetaCaja(numero);
                        }, 500);
                    } else {
                        const infoDiv = document.getElementById('infoTarjetaCaja');
                        if (infoDiv) infoDiv.style.display = 'none';
                        tarjetaActualCaja = null;
                    }
                });
                console.log('[Admin Base] Listener de número de tarjeta (Caja) inicializado');
            }
            
            // Formulario de recarga
            const formRecargarCaja = document.getElementById('formRecargarCaja');
            if (formRecargarCaja) {
                const newForm = formRecargarCaja.cloneNode(true);
                formRecargarCaja.parentNode.replaceChild(newForm, formRecargarCaja);
                
                newForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    recargarSaldoCaja();
                });
                console.log('[Admin Base] Formulario de recarga (Caja) inicializado');
            }
            
            // Botón limpiar
            const btnCancelarRecargaCaja = document.getElementById('btnCancelarRecargaCaja');
            if (btnCancelarRecargaCaja) {
                btnCancelarRecargaCaja.addEventListener('click', function() {
                    const numeroTarjeta = document.getElementById('numeroTarjetaCaja');
                    const montoInput = document.getElementById('montoRecargaCaja');
                    const infoDiv = document.getElementById('infoTarjetaCaja');
                    
                    if (numeroTarjeta) numeroTarjeta.value = '';
                    if (montoInput) montoInput.value = '';
                    if (infoDiv) infoDiv.style.display = 'none';
                    tarjetaActualCaja = null;
                });
                console.log('[Admin Base] Botón limpiar (Caja) inicializado');
            }
            
            // Botón escanear QR (placeholder por ahora)
            const btnEscanearQRCaja = document.getElementById('btnEscanearQRCaja');
            if (btnEscanearQRCaja) {
                btnEscanearQRCaja.addEventListener('click', function() {
                    showAlert('info', 'Funcionalidad de escaneo QR próximamente');
                });
                console.log('[Admin Base] Botón escanear QR (Caja) inicializado');
            }
            
            // ============================================
            // INICIALIZAR MÓDULO DE PUNTO DE VENTA
            // ============================================
            
            // Cargar puntos de venta
            cargarPuntosVentaPOS();
            
            // Selector de punto de venta
            const puntoVentaSelect = document.getElementById('puntoVentaSelect');
            if (puntoVentaSelect) {
                puntoVentaSelect.addEventListener('change', function() {
                    const puntoVentaId = parseInt(this.value);
                    if (puntoVentaId) {
                        // Obtener nombre del punto de venta
                        const option = this.options[this.selectedIndex];
                        puntoVentaSeleccionadoPOS = {
                            id: puntoVentaId,
                            nombre: option.textContent
                        };
                        cargarProductosPorPuntoVenta(puntoVentaId);
                    } else {
                        puntoVentaSeleccionadoPOS = null;
                        productosPOS = [];
                        mostrarProductosPOS();
                    }
                });
                console.log('[Admin Base] Selector de punto de venta inicializado');
            }
            
            // Formulario de búsqueda de tarjeta
            const formBuscarTarjetaPOS = document.getElementById('formBuscarTarjetaPOS');
            if (formBuscarTarjetaPOS) {
                const newForm = formBuscarTarjetaPOS.cloneNode(true);
                formBuscarTarjetaPOS.parentNode.replaceChild(newForm, formBuscarTarjetaPOS);
                
                newForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    const numeroTarjeta = document.getElementById('numeroTarjetaPOS');
                    if (numeroTarjeta) {
                        buscarTarjetaPOS(numeroTarjeta.value);
                    }
                });
                console.log('[Admin Base] Formulario de búsqueda de tarjeta (POS) inicializado');
            }
            
            // Botón escanear QR (placeholder)
            const btnEscanearQRPOS = document.getElementById('btnEscanearQRPOS');
            if (btnEscanearQRPOS) {
                btnEscanearQRPOS.addEventListener('click', function() {
                    showAlert('info', 'Funcionalidad de escaneo QR próximamente');
                });
                console.log('[Admin Base] Botón escanear QR (POS) inicializado');
            }
            
            // Botón limpiar carrito
            const btnLimpiarCarritoPOS = document.getElementById('btnLimpiarCarritoPOS');
            if (btnLimpiarCarritoPOS) {
                btnLimpiarCarritoPOS.addEventListener('click', function() {
                    carritoPOS = [];
                    actualizarCarritoPOS();
                });
                console.log('[Admin Base] Botón limpiar carrito (POS) inicializado');
            }
            
            // Botón procesar venta
            const btnProcesarVentaPOS = document.getElementById('btnProcesarVentaPOS');
            if (btnProcesarVentaPOS) {
                btnProcesarVentaPOS.addEventListener('click', function() {
                    procesarVentaPOS();
                });
                console.log('[Admin Base] Botón procesar venta (POS) inicializado');
            }
            
            // Hacer funciones globales para onclick
            window.agregarAlCarritoPOS = agregarAlCarritoPOS;
            window.modificarCantidadPOS = modificarCantidadPOS;
            window.eliminarDelCarritoPOS = eliminarDelCarritoPOS;
    
            // 11. Cargar sección inicial (dashboard)
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

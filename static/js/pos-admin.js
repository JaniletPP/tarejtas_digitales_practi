// Script para Punto de Venta integrado en Admin

// Variables globales
let tarjetaActualAdmin = null;
let carritoAdmin = [];
let productosAdmin = [];
let tiposProductosAdmin = [];
let tipoFiltroActualAdmin = '';

// Cargar productos desde la API
async function cargarProductosAdmin() {
    try {
        const tipo = tipoFiltroActualAdmin || '';
        const url = tipo ? `/api/productos?tipo=${tipo}` : '/api/productos';
        
        const { response, data, error } = await hacerPeticion(url, { method: 'GET' });
        
        if (error || !data.success) {
            showAlert('error', 'Error al cargar productos');
            return;
        }
        
        productosAdmin = data.data;
        mostrarProductosAdmin();
    } catch (error) {
        console.error('Error cargando productos:', error);
        showAlert('error', 'Error al cargar productos');
    }
}

// Mostrar productos en el grid
function mostrarProductosAdmin() {
    const productosGrid = document.getElementById('productosGridAdmin');
    if (!productosGrid) return;
    
    productosGrid.innerHTML = '';
    
    if (productosAdmin.length === 0) {
        productosGrid.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No hay productos disponibles</p>';
        return;
    }
    
    productosAdmin.forEach(producto => {
        const productoDiv = document.createElement('div');
        productoDiv.className = 'producto-item-admin';
        productoDiv.innerHTML = `
            <div class="producto-nombre-admin">${producto.nombre}</div>
            <div class="producto-precio-admin">$${parseFloat(producto.precio).toFixed(2)}</div>
            ${producto.tipo ? `<div class="producto-tipo-admin">${producto.tipo}</div>` : ''}
        `;
        productoDiv.addEventListener('click', () => agregarAlCarritoAdmin(producto));
        productosGrid.appendChild(productoDiv);
    });
}

// Cargar tipos de productos
async function cargarTiposProductosAdmin() {
    try {
        const { response, data, error } = await hacerPeticion('/api/productos/tipos', { method: 'GET' });
        
        if (error || !data.success) {
            return;
        }
        
        tiposProductosAdmin = data.data;
        const filtroSelect = document.getElementById('filtroTipoAdmin');
        if (!filtroSelect) return;
        
        // Limpiar opciones existentes excepto "Todos"
        while (filtroSelect.children.length > 1) {
            filtroSelect.removeChild(filtroSelect.lastChild);
        }
        
        // Agregar tipos al select
        tiposProductosAdmin.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
            filtroSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando tipos:', error);
    }
}

// Filtro por tipo
const filtroTipoAdmin = document.getElementById('filtroTipoAdmin');
if (filtroTipoAdmin) {
    filtroTipoAdmin.addEventListener('change', (e) => {
        tipoFiltroActualAdmin = e.target.value;
        cargarProductosAdmin();
    });
}

// Agregar producto al carrito
function agregarAlCarritoAdmin(producto) {
    const productoConPrecio = {
        ...producto,
        precio: parseFloat(producto.precio)
    };
    
    const itemExistente = carritoAdmin.find(item => item.id === productoConPrecio.id);
    
    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        carritoAdmin.push({ ...productoConPrecio, cantidad: 1 });
    }
    
    actualizarCarritoAdmin();
    showAlert('success', `${producto.nombre} agregado al carrito`);
}

// Actualizar visualización del carrito
function actualizarCarritoAdmin() {
    const carritoDiv = document.getElementById('carritoPOSAdmin');
    const btnProcesar = document.getElementById('btnProcesarPagoAdmin');
    
    if (!carritoDiv) return;
    
    if (carritoAdmin.length === 0) {
        carritoDiv.innerHTML = '<p class="carrito-vacio-admin">No hay productos en el carrito</p>';
        if (btnProcesar) btnProcesar.disabled = true;
        actualizarTotalAdmin();
        return;
    }
    
    let html = '';
    carritoAdmin.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        html += `
            <div class="carrito-item-admin">
                <div class="carrito-item-info-admin">
                    <div class="carrito-item-nombre-admin">${item.nombre}</div>
                    <div class="carrito-item-precio-admin">$${item.precio.toFixed(2)} c/u</div>
                </div>
                <div class="carrito-item-acciones-admin">
                    <button class="btn-cantidad-admin" onclick="modificarCantidadAdmin(${index}, -1)">-</button>
                    <span style="min-width: 30px; text-align: center;">${item.cantidad}</span>
                    <button class="btn-cantidad-admin" onclick="modificarCantidadAdmin(${index}, 1)">+</button>
                    <button class="btn-cantidad-admin" onclick="eliminarDelCarritoAdmin(${index})" style="margin-left: 10px; color: #dc3545;">×</button>
                </div>
                <div style="margin-left: 15px; font-weight: bold;">
                    $${subtotal.toFixed(2)}
                </div>
            </div>
        `;
    });
    
    carritoDiv.innerHTML = html;
    if (btnProcesar) btnProcesar.disabled = !tarjetaActualAdmin || carritoAdmin.length === 0;
    actualizarTotalAdmin();
}

// Modificar cantidad
function modificarCantidadAdmin(index, cambio) {
    carritoAdmin[index].cantidad += cambio;
    
    if (carritoAdmin[index].cantidad <= 0) {
        carritoAdmin.splice(index, 1);
    }
    
    actualizarCarritoAdmin();
}

// Eliminar del carrito
function eliminarDelCarritoAdmin(index) {
    carritoAdmin.splice(index, 1);
    actualizarCarritoAdmin();
}

// Actualizar total
function actualizarTotalAdmin() {
    const subtotal = carritoAdmin.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const subtotalEl = document.getElementById('subtotalPOSAdmin');
    const totalEl = document.getElementById('totalPOSAdmin');
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${subtotal.toFixed(2)}`;
}

// Escanear/Buscar tarjeta
const formScanPOSAdmin = document.getElementById('formScanPOSAdmin');
if (formScanPOSAdmin) {
    formScanPOSAdmin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const numero_tarjeta = document.getElementById('numero_tarjeta_pos_admin').value.trim().toUpperCase();
        const infoDiv = document.getElementById('infoTarjetaPOSAdmin');
        
        const { response, data, error } = await hacerPeticion(`/api/tarjetas/saldo/${numero_tarjeta}`, {
            method: 'GET'
        });
        
        if (error || !data.success) {
            if (infoDiv) {
                infoDiv.className = 'pos-info-admin show error';
                infoDiv.innerHTML = `<strong>❌ Error:</strong> ${data?.error || 'Tarjeta no encontrada'}`;
            }
            tarjetaActualAdmin = null;
            actualizarCarritoAdmin();
            return;
        }
        
        tarjetaActualAdmin = {
            numero: data.data.numero_tarjeta,
            asistente: data.data.asistente,
            saldo: data.data.saldo
        };
        
        if (infoDiv) {
            infoDiv.className = 'pos-info-admin show success';
            infoDiv.innerHTML = `
                <p><strong>✅ Tarjeta:</strong> ${tarjetaActualAdmin.numero}</p>
                <p><strong>Asistente:</strong> ${tarjetaActualAdmin.asistente}</p>
                <p><strong>Saldo disponible:</strong> <span style="font-size: 1.3em; font-weight: bold; color: #28a745;">${data.data.saldo_formateado}</span></p>
            `;
        }
        
        actualizarCarritoAdmin();
        showAlert('success', 'Tarjeta encontrada, puede procesar pagos');
    });
}

// Procesar pago
const btnProcesarPagoAdmin = document.getElementById('btnProcesarPagoAdmin');
if (btnProcesarPagoAdmin) {
    btnProcesarPagoAdmin.addEventListener('click', async () => {
        if (!tarjetaActualAdmin || carritoAdmin.length === 0) {
            showAlert('error', 'Debe seleccionar una tarjeta y agregar productos');
            return;
        }
        
        const total = carritoAdmin.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        
        if (total > tarjetaActualAdmin.saldo) {
            showAlert('error', `Saldo insuficiente. Saldo disponible: $${tarjetaActualAdmin.saldo.toFixed(2)}, Total: $${total.toFixed(2)}`);
            return;
        }
        
        const punto_venta_id = carritoAdmin[0].punto_venta_id || 1;
        const descripcion = carritoAdmin.map(item => `${item.nombre} x${item.cantidad}`).join(', ');
        
        const { response, data, error } = await hacerPeticion('/api/tarjetas/pagar', {
            method: 'POST',
            body: JSON.stringify({
                numero_tarjeta: tarjetaActualAdmin.numero,
                punto_venta_id: punto_venta_id,
                monto: total,
                descripcion: descripcion
            })
        });
        
        if (error || !data.success) {
            showAlert('error', data?.error || 'Error al procesar el pago');
            return;
        }
        
        showAlert('success', `Pago procesado: $${total.toFixed(2)}. Nuevo saldo: $${data.data.saldo_nuevo.toFixed(2)}`, 'Pago Exitoso');
        
        // Limpiar carrito y actualizar saldo
        carritoAdmin = [];
        tarjetaActualAdmin.saldo = data.data.saldo_nuevo;
        const infoDiv = document.getElementById('infoTarjetaPOSAdmin');
        if (infoDiv) {
            infoDiv.innerHTML = `
                <p><strong>✅ Tarjeta:</strong> ${tarjetaActualAdmin.numero}</p>
                <p><strong>Asistente:</strong> ${tarjetaActualAdmin.asistente}</p>
                <p><strong>Saldo disponible:</strong> <span style="font-size: 1.3em; font-weight: bold; color: #28a745;">$${tarjetaActualAdmin.saldo.toFixed(2)}</span></p>
            `;
        }
        actualizarCarritoAdmin();
        const inputTarjeta = document.getElementById('numero_tarjeta_pos_admin');
        if (inputTarjeta) {
            inputTarjeta.value = '';
            inputTarjeta.focus();
        }
    });
}

// Cargar puntos de venta para el formulario
async function cargarPuntosVentaAdmin() {
    try {
        const { response, data, error } = await hacerPeticion('/api/puntos-venta', { method: 'GET' });
        
        if (error || !data.success) {
            return;
        }
        
        const select = document.getElementById('productoPuntoVentaAdmin');
        if (!select) return;
        
        data.data.forEach(pv => {
            const option = document.createElement('option');
            option.value = pv.id;
            option.textContent = pv.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando puntos de venta:', error);
    }
}

// Abrir modal para agregar producto
const btnAgregarProductoAdmin = document.getElementById('btnAgregarProductoAdmin');
if (btnAgregarProductoAdmin) {
    btnAgregarProductoAdmin.addEventListener('click', () => {
        const modal = document.getElementById('modalAgregarProductoAdmin');
        if (modal) modal.classList.add('show');
    });
}

// Cerrar modal
const cerrarModalProductoAdmin = document.getElementById('cerrarModalProductoAdmin');
if (cerrarModalProductoAdmin) {
    cerrarModalProductoAdmin.addEventListener('click', () => {
        const modal = document.getElementById('modalAgregarProductoAdmin');
        if (modal) {
            modal.classList.remove('show');
            const form = document.getElementById('formAgregarProductoAdmin');
            if (form) form.reset();
        }
    });
}

const btnCancelarProductoAdmin = document.getElementById('btnCancelarProductoAdmin');
if (btnCancelarProductoAdmin) {
    btnCancelarProductoAdmin.addEventListener('click', () => {
        const modal = document.getElementById('modalAgregarProductoAdmin');
        if (modal) {
            modal.classList.remove('show');
            const form = document.getElementById('formAgregarProductoAdmin');
            if (form) form.reset();
        }
    });
}

// Cerrar modal al hacer clic fuera
const modalAgregarProductoAdmin = document.getElementById('modalAgregarProductoAdmin');
if (modalAgregarProductoAdmin) {
    modalAgregarProductoAdmin.addEventListener('click', (e) => {
        if (e.target.id === 'modalAgregarProductoAdmin') {
            modalAgregarProductoAdmin.classList.remove('show');
            const form = document.getElementById('formAgregarProductoAdmin');
            if (form) form.reset();
        }
    });
}

// Agregar nuevo producto
const formAgregarProductoAdmin = document.getElementById('formAgregarProductoAdmin');
if (formAgregarProductoAdmin) {
    formAgregarProductoAdmin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('productoNombreAdmin').value.trim();
        const precio = parseFloat(document.getElementById('productoPrecioAdmin').value);
        const tipo = document.getElementById('productoTipoAdmin').value;
        const punto_venta_id = document.getElementById('productoPuntoVentaAdmin').value || null;
        const descripcion = document.getElementById('productoDescripcionAdmin').value.trim() || null;
        
        const { response, data, error } = await hacerPeticion('/api/productos', {
            method: 'POST',
            body: JSON.stringify({
                nombre,
                precio,
                tipo,
                punto_venta_id: punto_venta_id ? parseInt(punto_venta_id) : null,
                descripcion
            })
        });
        
        if (error || !data.success) {
            showAlert('error', data?.error || 'Error al crear el producto');
            return;
        }
        
        showAlert('success', `Producto "${nombre}" creado correctamente`, 'Producto Agregado');
        const modal = document.getElementById('modalAgregarProductoAdmin');
        if (modal) {
            modal.classList.remove('show');
            formAgregarProductoAdmin.reset();
        }
        
        // Recargar productos y tipos
        await cargarProductosAdmin();
        await cargarTiposProductosAdmin();
    });
}

// Cargar datos cuando se accede a la sección de punto de venta
let posAdminInitialized = false;

function inicializarPOSAdmin() {
    if (posAdminInitialized) return;
    
    const section = document.getElementById('section-punto-venta');
    if (section && section.classList.contains('active')) {
        posAdminInitialized = true;
        cargarTiposProductosAdmin();
        cargarPuntosVentaAdmin();
        cargarProductosAdmin();
    }
}

// Observar cambios en las secciones
const observer = new MutationObserver(() => {
    inicializarPOSAdmin();
});

// Observar cuando se activa la sección de punto de venta
document.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('section-punto-venta');
    if (section) {
        observer.observe(section, { attributes: true, attributeFilter: ['class'] });
        inicializarPOSAdmin();
    }
    
    // También inicializar cuando se hace clic en el menú
    document.querySelectorAll('[data-section="punto-venta"]').forEach(item => {
        item.addEventListener('click', () => {
            setTimeout(() => {
                inicializarPOSAdmin();
            }, 100);
        });
    });
});

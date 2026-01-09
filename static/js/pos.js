// Script para Punto de Venta (POS)

// Función auxiliar para hacer peticiones fetch (si no está disponible)
if (typeof hacerPeticion === 'undefined') {
    async function hacerPeticion(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            const data = await response.json();
            return { response, data };
        } catch (error) {
            return { error: error.message };
        }
    }
}

// Función para mostrar alertas (si no está disponible)
if (typeof showAlert === 'undefined') {
    function showAlert(type, message, title = null) {
        console.log(`[${type.toUpperCase()}] ${title || ''}: ${message}`);
    }
}

let tarjetaActual = null;
let carrito = [];
let productos = [];
let tiposProductos = [];
let tipoFiltroActual = '';

// Cargar productos desde la API
async function cargarProductos() {
    try {
        const tipo = tipoFiltroActual || '';
        const url = tipo ? `/api/productos?tipo=${tipo}` : '/api/productos';
        
        const { response, data, error } = await hacerPeticion(url, { method: 'GET' });
        
        if (error || !data.success) {
            showAlert('error', 'Error al cargar productos');
            return;
        }
        
        productos = data.data;
        mostrarProductos();
    } catch (error) {
        console.error('Error cargando productos:', error);
        showAlert('error', 'Error al cargar productos');
    }
}

// Mostrar productos en el grid
function mostrarProductos() {
    const productosGrid = document.getElementById('productosGrid');
    productosGrid.innerHTML = '';
    
    if (productos.length === 0) {
        productosGrid.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1/-1;">No hay productos disponibles</p>';
        return;
    }
    
    // Verificar si hay tarjeta válida antes de permitir agregar productos
    const puedeAgregar = tarjetaActual !== null && tarjetaActual.valida === true;
    
    productos.forEach(producto => {
        const productoDiv = document.createElement('div');
        productoDiv.className = `producto-item ${!puedeAgregar ? 'disabled' : ''}`;
        productoDiv.innerHTML = `
            <div class="producto-nombre">${producto.nombre}</div>
            <div class="producto-precio">$${parseFloat(producto.precio).toFixed(2)}</div>
            ${producto.tipo ? `<div class="producto-tipo">${producto.tipo}</div>` : ''}
        `;
        
        if (puedeAgregar) {
            productoDiv.addEventListener('click', () => agregarAlCarrito(producto));
        } else {
            productoDiv.style.cursor = 'not-allowed';
            productoDiv.title = 'Primero debe escanear una tarjeta válida';
        }
        
        productosGrid.appendChild(productoDiv);
    });
}

// Actualizar estado de productos según tarjeta
function actualizarEstadoProductos() {
    const mensajeSinTarjeta = document.getElementById('mensajeSinTarjeta');
    const productosContainer = document.getElementById('productosContainer');
    
    if (!tarjetaActual || tarjetaActual.valida !== true) {
        // Ocultar productos y mostrar mensaje
        mensajeSinTarjeta.style.display = 'flex';
        productosContainer.style.display = 'none';
    } else {
        // Mostrar productos y ocultar mensaje
        mensajeSinTarjeta.style.display = 'none';
        productosContainer.style.display = 'block';
        mostrarProductos(); // Refrescar para habilitar clics
    }
}

// Cargar tipos de productos
async function cargarTiposProductos() {
    try {
        const { response, data, error } = await hacerPeticion('/api/productos/tipos', { method: 'GET' });
        
        if (error || !data.success) {
            return;
        }
        
        tiposProductos = data.data;
        const filtroSelect = document.getElementById('filtroTipo');
        
        // Agregar tipos al select
        tiposProductos.forEach(tipo => {
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
document.getElementById('filtroTipo')?.addEventListener('change', (e) => {
    tipoFiltroActual = e.target.value;
    cargarProductos();
});

// Agregar producto al carrito
function agregarAlCarrito(producto) {
    // Validar que hay tarjeta válida
    if (!tarjetaActual || tarjetaActual.valida !== true) {
        showAlert('error', 'Primero debe escanear una tarjeta válida');
        return;
    }
    
    // Asegurar que el precio sea un número
    const productoConPrecio = {
        ...producto,
        precio: parseFloat(producto.precio)
    };
    
    const itemExistente = carrito.find(item => item.id === productoConPrecio.id);
    
    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        carrito.push({ ...productoConPrecio, cantidad: 1 });
    }
    
    actualizarCarrito();
    showAlert('success', `${producto.nombre} agregado al carrito`);
}

// Actualizar visualización del carrito
function actualizarCarrito() {
    const carritoDiv = document.getElementById('carritoPOS');
    const btnProcesar = document.getElementById('btnProcesarPago');
    
    if (carrito.length === 0) {
        carritoDiv.innerHTML = '<p class="carrito-vacio">No hay productos en el carrito</p>';
        btnProcesar.disabled = true;
        actualizarTotal();
        return;
    }
    
    let html = '';
    carrito.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        html += `
            <div class="carrito-item">
                <div class="carrito-item-info">
                    <div class="carrito-item-nombre">${item.nombre}</div>
                    <div class="carrito-item-precio">$${item.precio.toFixed(2)} c/u</div>
                </div>
                <div class="carrito-item-acciones">
                    <button class="btn-cantidad" onclick="modificarCantidad(${index}, -1)">-</button>
                    <span style="min-width: 30px; text-align: center; font-weight: 600;">${item.cantidad}</span>
                    <button class="btn-cantidad" onclick="modificarCantidad(${index}, 1)">+</button>
                    <button class="btn-cantidad" onclick="eliminarDelCarrito(${index})" style="color: #dc3545; font-size: 1.2em;">×</button>
                </div>
                <div class="carrito-item-subtotal">
                    $${subtotal.toFixed(2)}
                </div>
            </div>
        `;
    });
    
    carritoDiv.innerHTML = html;
    
    // Validar condiciones para habilitar botón de procesar pago
    const tieneTarjetaValida = tarjetaActual !== null && tarjetaActual.valida === true;
    const tieneProductos = carrito.length > 0;
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const saldoSuficiente = tieneTarjetaValida && tarjetaActual.saldo >= total;
    
    btnProcesar.disabled = !tieneTarjetaValida || !tieneProductos || !saldoSuficiente;
    
    // Actualizar estilo del botón según estado
    if (btnProcesar.disabled) {
        if (!tieneTarjetaValida) {
            btnProcesar.title = 'Debe escanear una tarjeta válida';
        } else if (!tieneProductos) {
            btnProcesar.title = 'Debe agregar productos al carrito';
        } else if (!saldoSuficiente) {
            btnProcesar.title = 'Saldo insuficiente';
        }
    } else {
        btnProcesar.title = '';
    }
    
    actualizarTotal();
}

// Modificar cantidad
function modificarCantidad(index, cambio) {
    carrito[index].cantidad += cambio;
    
    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }
    
    actualizarCarrito();
}

// Eliminar del carrito
function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
}

// Actualizar total
function actualizarTotal() {
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    document.getElementById('subtotalPOS').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('totalPOS').textContent = `$${subtotal.toFixed(2)}`;
}

// Escanear/Buscar tarjeta
document.getElementById('formScanPOS').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const numero_tarjeta = document.getElementById('numero_tarjeta_pos').value.trim().toUpperCase();
    const infoDiv = document.getElementById('infoTarjetaPOS');
    const inputTarjeta = document.getElementById('numero_tarjeta_pos');
    
    // Validar formato básico
    if (!numero_tarjeta.match(/^TARJ-\d{6}$/)) {
        infoDiv.className = 'pos-info-card show error';
        infoDiv.innerHTML = `
            <div class="tarjeta-estado-header">
                <span class="tarjeta-estado-icono">❌</span>
                <strong>Formato inválido</strong>
            </div>
            <p>El formato debe ser TARJ-XXXXXX</p>
        `;
        tarjetaActual = null;
        actualizarEstadoProductos();
        actualizarCarrito();
        return;
    }
    
    // Mostrar estado de carga
    infoDiv.className = 'pos-info-card show info';
    infoDiv.innerHTML = `
        <div class="tarjeta-estado-header">
            <span class="tarjeta-estado-icono">⏳</span>
            <strong>Validando tarjeta...</strong>
        </div>
    `;
    
    const { response, data, error } = await hacerPeticion(`/api/tarjetas/saldo/${numero_tarjeta}`, {
        method: 'GET'
    });
    
    if (error || !data.success) {
        infoDiv.className = 'pos-info-card show error';
        infoDiv.innerHTML = `
            <div class="tarjeta-estado-header">
                <span class="tarjeta-estado-icono">❌</span>
                <strong>Tarjeta Inválida</strong>
            </div>
            <p>${data?.error || 'Tarjeta no encontrada o inactiva'}</p>
        `;
        tarjetaActual = null;
        actualizarEstadoProductos();
        actualizarCarrito();
        return;
    }
    
    // Tarjeta válida
    tarjetaActual = {
        numero: data.data.numero_tarjeta,
        asistente: data.data.asistente,
        saldo: data.data.saldo,
        valida: true
    };
    
    const saldo = parseFloat(data.data.saldo);
    const saldoClass = saldo > 0 ? 'success' : 'warning';
    const saldoIcono = saldo > 0 ? '✅' : '⚠️';
    
    infoDiv.className = `pos-info-card show ${saldoClass}`;
    infoDiv.innerHTML = `
        <div class="tarjeta-estado-header">
            <span class="tarjeta-estado-icono">${saldoIcono}</span>
            <strong>Tarjeta Válida</strong>
        </div>
        <div class="tarjeta-info-detalle">
            <div class="tarjeta-info-item">
                <span class="tarjeta-info-label">Tarjeta:</span>
                <span class="tarjeta-info-value">${tarjetaActual.numero}</span>
            </div>
            <div class="tarjeta-info-item">
                <span class="tarjeta-info-label">Asistente:</span>
                <span class="tarjeta-info-value">${tarjetaActual.asistente}</span>
            </div>
            <div class="tarjeta-info-item tarjeta-saldo">
                <span class="tarjeta-info-label">Saldo disponible:</span>
                <span class="tarjeta-info-value saldo-disponible">${data.data.saldo_formateado}</span>
            </div>
        </div>
    `;
    
    actualizarEstadoProductos();
    actualizarCarrito();
    showAlert('success', 'Tarjeta validada correctamente. Puede agregar productos.', 'Tarjeta Válida');
});

// Mostrar modal de confirmación
function mostrarModalConfirmacion() {
    if (!tarjetaActual || carrito.length === 0) {
        showAlert('error', 'Debe seleccionar una tarjeta y agregar productos');
        return;
    }
    
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    if (total > tarjetaActual.saldo) {
        showAlert('error', `Saldo insuficiente. Saldo disponible: $${tarjetaActual.saldo.toFixed(2)}, Total: $${total.toFixed(2)}`);
        return;
    }
    
    // Llenar información del modal
    document.getElementById('confirmTarjeta').textContent = tarjetaActual.numero;
    document.getElementById('confirmAsistente').textContent = tarjetaActual.asistente;
    document.getElementById('confirmSaldoActual').textContent = `$${tarjetaActual.saldo.toFixed(2)}`;
    document.getElementById('confirmTotal').textContent = `$${total.toFixed(2)}`;
    document.getElementById('confirmSaldoDespues').textContent = `$${(tarjetaActual.saldo - total).toFixed(2)}`;
    
    // Llenar productos
    const productosDiv = document.getElementById('confirmProductos');
    productosDiv.innerHTML = carrito.map(item => {
        const subtotal = item.precio * item.cantidad;
        return `
            <div class="confirmacion-producto-item">
                <span class="confirmacion-producto-nombre">${item.nombre} x${item.cantidad}</span>
                <span class="confirmacion-producto-precio">$${subtotal.toFixed(2)}</span>
            </div>
        `;
    }).join('');
    
    // Mostrar modal
    document.getElementById('modalConfirmarPago').classList.add('show');
}

// Cerrar modal de confirmación
function cerrarModalConfirmacion() {
    document.getElementById('modalConfirmarPago').classList.remove('show');
}

// Procesar pago
async function procesarPagoConfirmado() {
    if (!tarjetaActual || carrito.length === 0) {
        showAlert('error', 'Debe seleccionar una tarjeta y agregar productos');
        return;
    }
    
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    if (total > tarjetaActual.saldo) {
        showAlert('error', `Saldo insuficiente. Saldo disponible: $${tarjetaActual.saldo.toFixed(2)}, Total: $${total.toFixed(2)}`);
        cerrarModalConfirmacion();
        return;
    }
    
    // Deshabilitar botón durante el procesamiento
    const btnConfirmar = document.getElementById('btnConfirmarPago');
    const btnText = btnConfirmar.querySelector('.btn-text');
    const btnLoader = btnConfirmar.querySelector('.btn-loader');
    btnConfirmar.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'inline-block';
    
    try {
        // Obtener punto de venta del usuario actual (puede venir de la sesión)
        // Por ahora usamos el punto_venta_id del primer producto o 1 por defecto
        const punto_venta_id = carrito[0].punto_venta_id || 1;
        const descripcion = carrito.map(item => `${item.nombre} x${item.cantidad}`).join(', ');
        
        const { response, data, error } = await hacerPeticion('/api/tarjetas/pagar', {
            method: 'POST',
            body: JSON.stringify({
                numero_tarjeta: tarjetaActual.numero,
                punto_venta_id: punto_venta_id,
                monto: total,
                descripcion: descripcion
            })
        });
        
        if (error || !data.success) {
            showAlert('error', data?.error || 'Error al procesar el pago');
            cerrarModalConfirmacion();
            return;
        }
        
        // Mostrar confirmación exitosa
        showAlert('success', `Pago procesado: $${total.toFixed(2)}. Nuevo saldo: $${data.data.saldo_nuevo.toFixed(2)}`, 'Pago Exitoso');
        
        // Limpiar carrito y actualizar saldo
        carrito = [];
        tarjetaActual.saldo = data.data.saldo_nuevo;
        
        // Actualizar información de tarjeta
        const infoDiv = document.getElementById('infoTarjetaPOS');
        const saldo = parseFloat(data.data.saldo_nuevo);
        const saldoClass = saldo > 0 ? 'success' : 'warning';
        const saldoIcono = saldo > 0 ? '✅' : '⚠️';
        
        infoDiv.className = `pos-info-card show ${saldoClass}`;
        infoDiv.innerHTML = `
            <div class="tarjeta-estado-header">
                <span class="tarjeta-estado-icono">${saldoIcono}</span>
                <strong>Tarjeta Válida</strong>
            </div>
            <div class="tarjeta-info-detalle">
                <div class="tarjeta-info-item">
                    <span class="tarjeta-info-label">Tarjeta:</span>
                    <span class="tarjeta-info-value">${tarjetaActual.numero}</span>
                </div>
                <div class="tarjeta-info-item">
                    <span class="tarjeta-info-label">Asistente:</span>
                    <span class="tarjeta-info-value">${tarjetaActual.asistente}</span>
                </div>
                <div class="tarjeta-info-item tarjeta-saldo">
                    <span class="tarjeta-info-label">Saldo disponible:</span>
                    <span class="tarjeta-info-value saldo-disponible">$${saldo.toFixed(2)}</span>
                </div>
            </div>
        `;
        
        actualizarCarrito();
        cerrarModalConfirmacion();
        
        // Limpiar input y enfocar
        document.getElementById('numero_tarjeta_pos').value = '';
        document.getElementById('numero_tarjeta_pos').focus();
    } catch (error) {
        console.error('Error procesando pago:', error);
        showAlert('error', 'Error de conexión al procesar el pago');
        cerrarModalConfirmacion();
    } finally {
        // Rehabilitar botón
        btnConfirmar.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoader) btnLoader.style.display = 'none';
    }
}

// Event listeners para procesar pago
document.getElementById('btnProcesarPago').addEventListener('click', mostrarModalConfirmacion);

// Event listeners del modal
document.getElementById('btnConfirmarPago').addEventListener('click', procesarPagoConfirmado);
document.getElementById('btnCancelarPago').addEventListener('click', cerrarModalConfirmacion);
document.getElementById('cerrarModalConfirmar').addEventListener('click', cerrarModalConfirmacion);

// Cerrar modal al hacer clic fuera
document.getElementById('modalConfirmarPago').addEventListener('click', (e) => {
    if (e.target.id === 'modalConfirmarPago') {
        cerrarModalConfirmacion();
    }
});

// Cargar puntos de venta para el formulario
async function cargarPuntosVenta() {
    try {
        const { response, data, error } = await hacerPeticion('/api/puntos-venta', { method: 'GET' });
        
        if (error || !data.success) {
            return;
        }
        
        const select = document.getElementById('productoPuntoVenta');
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
document.getElementById('btnAgregarProducto')?.addEventListener('click', () => {
    document.getElementById('modalAgregarProducto').classList.add('show');
});

// Cerrar modal
document.getElementById('cerrarModalProducto')?.addEventListener('click', () => {
    document.getElementById('modalAgregarProducto').classList.remove('show');
    document.getElementById('formAgregarProducto').reset();
});

document.getElementById('btnCancelarProducto')?.addEventListener('click', () => {
    document.getElementById('modalAgregarProducto').classList.remove('show');
    document.getElementById('formAgregarProducto').reset();
});

// Cerrar modal al hacer clic fuera
document.getElementById('modalAgregarProducto')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalAgregarProducto') {
        document.getElementById('modalAgregarProducto').classList.remove('show');
        document.getElementById('formAgregarProducto').reset();
    }
});

// Agregar nuevo producto
document.getElementById('formAgregarProducto')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nombre = document.getElementById('productoNombre').value.trim();
    const precio = parseFloat(document.getElementById('productoPrecio').value);
    const tipo = document.getElementById('productoTipo').value;
    const punto_venta_id = document.getElementById('productoPuntoVenta').value || null;
    const descripcion = document.getElementById('productoDescripcion').value.trim() || null;
    
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
    document.getElementById('modalAgregarProducto').classList.remove('show');
    document.getElementById('formAgregarProducto').reset();
    
    // Recargar productos y tipos
    await cargarProductos();
    await cargarTiposProductos();
});

// Variables para el escáner QR
let html5QrCode = null;
let qrScannerActive = false;

// Función para escanear QR
async function iniciarEscaneoQR() {
    const modal = document.getElementById('modalScanQR');
    const qrReader = document.getElementById('qr-reader');
    const qrStatus = document.getElementById('qr-reader-status');
    
    if (!modal || !qrReader) {
        showAlert('error', 'No se encontró el modal de escaneo QR');
        return;
    }
    
    // Mostrar modal
    modal.style.display = 'flex';
    qrStatus.innerHTML = '<p>⏳ Iniciando cámara...</p>';
    
    try {
        // Inicializar el escáner
        html5QrCode = new Html5Qrcode("qr-reader");
        
        // Iniciar escaneo
        await html5QrCode.start(
            { facingMode: "environment" }, // Cámara trasera
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            (decodedText, decodedResult) => {
                // QR escaneado exitosamente
                detenerEscaneoQR();
                
                // Validar formato
                const numeroTarjeta = decodedText.trim().toUpperCase();
                if (numeroTarjeta.match(/^TARJ-\d{6}$/)) {
                    // Asignar al input y enviar formulario
                    const input = document.getElementById('numero_tarjeta_pos');
                    if (input) {
                        input.value = numeroTarjeta;
                        showAlert('success', `Tarjeta escaneada: ${numeroTarjeta}`, 'Escaneo Exitoso');
                        // Enviar formulario automáticamente
                        setTimeout(() => {
                            document.getElementById('formScanPOS').dispatchEvent(new Event('submit'));
                        }, 500);
                    }
                } else {
                    showAlert('error', `Formato inválido: ${numeroTarjeta}. Debe ser TARJ-XXXXXX`);
                }
            },
            (errorMessage) => {
                // Error al escanear (se ignora, es normal mientras busca)
                if (errorMessage && !errorMessage.includes('NotFoundException')) {
                    // Solo mostrar errores importantes
                }
            }
        );
        
        qrScannerActive = true;
        qrStatus.innerHTML = '<p style="color: #28a745;">✅ Cámara activa - Escanea el código QR</p>';
        
    } catch (error) {
        console.error('Error iniciando escáner QR:', error);
        qrStatus.innerHTML = `<p style="color: #dc3545;">❌ Error: ${error.message}</p>`;
        showAlert('error', 'No se pudo acceder a la cámara. Verifica los permisos.');
    }
}

// Función para detener el escáner
function detenerEscaneoQR() {
    if (html5QrCode && qrScannerActive) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
            qrScannerActive = false;
        }).catch((err) => {
            console.error('Error deteniendo escáner:', err);
        });
    }
    
    const modal = document.getElementById('modalScanQR');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Event listener para botón de escanear QR
document.getElementById('btnScanQR')?.addEventListener('click', iniciarEscaneoQR);

// Cerrar modal al hacer clic en el botón de cerrar
document.getElementById('cerrarModalScanQR')?.addEventListener('click', () => {
    detenerEscaneoQR();
});

// Cerrar modal al hacer clic fuera
document.getElementById('modalScanQR')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalScanQR') {
        detenerEscaneoQR();
    }
});

// Permitir pegar desde el portapapeles (útil para lectores de códigos de barras)
document.getElementById('numero_tarjeta_pos')?.addEventListener('paste', (e) => {
    setTimeout(() => {
        const valor = e.target.value.trim().toUpperCase();
        if (valor.match(/^TARJ-\d{6}$/)) {
            // Auto-submit si el formato es correcto
            document.getElementById('formScanPOS').dispatchEvent(new Event('submit'));
        }
    }, 10);
});

// Cargar productos al iniciar
document.addEventListener('DOMContentLoaded', async () => {
    await cargarTiposProductos();
    await cargarPuntosVenta();
    await cargarProductos();
    
    // Inicializar estado: productos deshabilitados hasta tener tarjeta válida
    actualizarEstadoProductos();
    
    // Enfocar en el input de tarjeta
    document.getElementById('numero_tarjeta_pos').focus();
});

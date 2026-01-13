# 🛒 PROPUESTA FASE 3: Módulo de Punto de Venta en Panel Admin

## 📋 Resumen de Cambios

**Archivos a modificar**:
1. `templates/admin/dashboard.html` - Agregar sección HTML y menú
2. `static/js/admin-base.js` - Agregar funciones JavaScript

**Objetivo**: 
- Crear módulo "Punto de Venta" en el panel admin para procesar ventas
- Selector de punto de venta (Bar, Snack, Restaurante 1, Restaurante 2, Estacionamiento)
- Búsqueda/escaneo de tarjeta
- Carrito de compras
- Procesamiento de pagos con validación de saldo
- Usar API existente `POST /api/tarjetas/pagar`

---

## 🔧 CAMBIO 1: Agregar Item de Menú en Sidebar

### **Ubicación**: `templates/admin/dashboard.html`, después de línea 92 (después del menú Caja)

### **Código a agregar**:

```html
                <!-- Menú Punto de Venta -->
                <div class="nav-menu-item">
                    <a href="#punto-venta" class="nav-link" data-section="punto-venta">
                        <span class="nav-icon">🛒</span>
                        <span class="nav-text">Punto de Venta</span>
                    </a>
                </div>

                <!-- Menú Perfil -->
```

**Líneas**: Agregar después de línea 92, antes de línea 94

---

## 🔧 CAMBIO 2: Agregar Sección HTML de Punto de Venta

### **Ubicación**: `templates/admin/dashboard.html`, después de línea 799 (después de sección Caja)

### **Código completo a agregar**:

```html
            <!-- Punto de Venta Section -->
            <section id="section-punto-venta" class="admin-section hidden">
                <div class="section-header">
                    <h2>🛒 Punto de Venta</h2>
                    <p class="section-description">Procese ventas y descuente saldo de tarjetas</p>
                </div>

                <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
                    <!-- Columna Izquierda: Selección y Productos -->
                    <div>
                        <!-- Selector de Punto de Venta -->
                        <div class="content-card" style="margin-bottom: 20px;">
                            <h3>Seleccionar Punto de Venta</h3>
                            <div class="form-group">
                                <label for="puntoVentaSelect">Punto de Venta *</label>
                                <select id="puntoVentaSelect" required style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px;">
                                    <option value="">Seleccione un punto de venta</option>
                                </select>
                                <small class="form-help">Seleccione el punto de venta donde se realizará la venta</small>
                            </div>
                        </div>

                        <!-- Búsqueda de Tarjeta -->
                        <div class="content-card" style="margin-bottom: 20px;">
                            <h3>Buscar Tarjeta</h3>
                            <form id="formBuscarTarjetaPOS">
                                <div class="form-group">
                                    <label for="numeroTarjetaPOS">Número de Tarjeta *</label>
                                    <div style="display: flex; gap: 10px; align-items: center;">
                                        <input 
                                            type="text" 
                                            id="numeroTarjetaPOS" 
                                            name="numero_tarjeta"
                                            placeholder="TARJ-XXXXXX"
                                            required
                                            style="flex: 1;"
                                        >
                                        <button type="button" class="btn btn-secondary" id="btnEscanearQRPOS" title="Escanear QR">
                                            📷 Escanear QR
                                        </button>
                                    </div>
                                    <small class="form-help">Ingrese el número de tarjeta o escanee el código QR</small>
                                </div>
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary" id="btnBuscarTarjetaPOS">
                                        🔍 Buscar Tarjeta
                                    </button>
                                </div>
                            </form>
                            
                            <!-- Información de Tarjeta -->
                            <div id="infoTarjetaPOS" style="display: none; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid var(--accent-blue);">
                                <h4 style="margin: 0 0 10px 0;">Información de la Tarjeta</h4>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <div>
                                        <strong>Asistente:</strong>
                                        <span id="asistenteNombrePOS">-</span>
                                    </div>
                                    <div>
                                        <strong>Saldo Disponible:</strong>
                                        <span id="saldoDisponiblePOS" style="font-weight: bold; color: var(--accent-blue); font-size: 1.2em;">$-</span>
                                    </div>
                                    <div>
                                        <strong>Estado:</strong>
                                        <span id="estadoTarjetaPOS">-</span>
                                    </div>
                                    <div>
                                        <strong>Número:</strong>
                                        <span id="numeroTarjetaInfoPOS">-</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Productos Disponibles -->
                        <div class="content-card">
                            <h3>Productos Disponibles</h3>
                            <div id="productosPOSContainer">
                                <p style="color: #666; text-align: center; padding: 20px;">
                                    Seleccione un punto de venta para ver los productos
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Columna Derecha: Carrito y Procesamiento -->
                    <div>
                        <!-- Carrito de Compras -->
                        <div class="content-card" style="margin-bottom: 20px;">
                            <h3>Carrito de Compras</h3>
                            <div id="carritoPOSContainer">
                                <p style="color: #666; text-align: center; padding: 20px;">
                                    El carrito está vacío. Agregue productos para continuar.
                                </p>
                            </div>
                            <div id="resumenCarritoPOS" style="display: none; margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                    <strong>Subtotal:</strong>
                                    <span id="subtotalCarritoPOS">$0.00</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: 1.2em; font-weight: bold; color: var(--accent-blue); border-top: 2px solid var(--border); padding-top: 10px;">
                                    <strong>Total:</strong>
                                    <span id="totalCarritoPOS">$0.00</span>
                                </div>
                            </div>
                            <div class="form-actions" style="margin-top: 20px;">
                                <button type="button" class="btn btn-secondary" id="btnLimpiarCarritoPOS">Limpiar Carrito</button>
                                <button type="button" class="btn btn-primary" id="btnProcesarVentaPOS" disabled>
                                    💳 Procesar Venta
                                </button>
                            </div>
                        </div>

                        <!-- Historial de Ventas Recientes -->
                        <div class="content-card">
                            <h3>Ventas Recientes</h3>
                            <div id="historialVentasPOS">
                                <p style="color: #666; text-align: center; padding: 20px;">
                                    Realice una venta para ver el historial
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
```

**Líneas**: Agregar después de línea 799, antes de línea 800 (section-configuracion)

---

## 🔧 CAMBIO 3: Agregar Funciones JavaScript

### **Ubicación**: `static/js/admin-base.js`, después de la sección de CAJA (después de línea ~1860)

### **Código completo a agregar**:

```javascript
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
                     onclick="agregarAlCarritoPOS(${producto.id}, '${producto.nombre}', ${producto.precio})"
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
```

**Líneas**: Agregar después de la sección de CAJA, aproximadamente después de línea ~1860

---

## 🔧 CAMBIO 4: Inicializar Event Listeners en `inicializarAdminBase()`

### **Ubicación**: `static/js/admin-base.js`, dentro de la función `inicializarAdminBase()`, después de la inicialización del módulo de CAJA

### **Código a agregar**:

```javascript
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
```

**Líneas**: Agregar después de la inicialización del módulo de CAJA, dentro de `inicializarAdminBase()`

---

## 📊 Resumen de Líneas

### **`templates/admin/dashboard.html`**:
- **Línea ~92**: Agregar item de menú (8 líneas nuevas)
- **Línea ~799**: Agregar sección HTML completa (~120 líneas nuevas)

**Total HTML**: ~128 líneas nuevas

### **`static/js/admin-base.js`**:
- **Línea ~1860**: Agregar funciones del módulo POS (~350 líneas nuevas)
- **Dentro de `inicializarAdminBase()`**: Agregar inicialización (~60 líneas nuevas)

**Total JavaScript**: ~410 líneas nuevas

---

## ⚠️ Consideraciones

1. **API existente**: Usa `POST /api/tarjetas/pagar` que ya existe y funciona
2. **Consulta de productos**: Usa `GET /api/productos?punto_venta_id=X` que ya existe
3. **No se modifica backend**: Solo frontend
4. **No afecta otros módulos**: Es una sección completamente nueva
5. **Validaciones**: Verifica saldo, tarjeta activa, carrito no vacío

---

## ✅ Funcionalidades Implementadas

1. **Selector de punto de venta**: Carga productos filtrados por punto de venta
2. **Búsqueda de tarjeta**: Busca y muestra información de tarjeta
3. **Productos disponibles**: Muestra productos del punto de venta seleccionado
4. **Carrito de compras**: Agregar, modificar cantidad, eliminar productos
5. **Validación de saldo**: Verifica saldo suficiente antes de procesar
6. **Procesamiento de venta**: Procesa pago completo con descripción detallada
7. **Historial de ventas**: Muestra las últimas 10 ventas realizadas

---

## 📝 ¿Aplicar estos cambios?

¿Estás de acuerdo con esta propuesta? Si confirmas, procederé a aplicar los cambios exactamente como se muestra arriba.

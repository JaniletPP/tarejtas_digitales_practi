# 💰 PROPUESTA FASE 2: Módulo de Caja en Panel Admin

## 📋 Resumen de Cambios

**Archivos a modificar**:
1. `templates/admin/dashboard.html` - Agregar sección HTML y menú
2. `static/js/admin-base.js` - Agregar funciones JavaScript

**Objetivo**: 
- Crear módulo "Caja" en el panel admin para recargar saldo a tarjetas
- Interfaz clara y profesional para recargas
- Mostrar información de tarjeta y historial de recargas
- Usar API existente `POST /api/tarjetas/recargar`

---

## 🔧 CAMBIO 1: Agregar Item de Menú en Sidebar

### **Ubicación**: `templates/admin/dashboard.html`, después de línea 84 (después del menú Reportes)

### **Código a agregar**:

```html
                <!-- Menú Caja -->
                <div class="nav-menu-item">
                    <a href="#caja" class="nav-link" data-section="caja">
                        <span class="nav-icon">💰</span>
                        <span class="nav-text">Caja</span>
                    </a>
                </div>

                <!-- Menú Perfil -->
```

**Líneas**: Agregar después de línea 84, antes de línea 86

---

## 🔧 CAMBIO 2: Agregar Sección HTML de Caja

### **Ubicación**: `templates/admin/dashboard.html`, después de línea 693 (después de sección Perfil)

### **Código completo a agregar**:

```html
            <!-- Caja Section -->
            <section id="section-caja" class="admin-section hidden">
                <div class="section-header">
                    <h2>💰 Caja - Recarga de Saldo</h2>
                    <p class="section-description">Recargue saldo a las tarjetas de los asistentes</p>
                </div>

                <div class="grid">
                    <!-- Formulario de Recarga -->
                    <div class="content-card">
                        <h3>Recargar Saldo</h3>
                        <form id="formRecargarCaja">
                            <!-- Número de Tarjeta -->
                            <div class="form-group">
                                <label for="numeroTarjetaCaja">Número de Tarjeta *</label>
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    <input 
                                        type="text" 
                                        id="numeroTarjetaCaja" 
                                        name="numero_tarjeta"
                                        placeholder="TARJ-XXXXXX"
                                        required
                                        style="flex: 1;"
                                    >
                                    <button type="button" class="btn btn-secondary" id="btnEscanearQRCaja" title="Escanear QR">
                                        📷 Escanear QR
                                    </button>
                                </div>
                                <small class="form-help">Ingrese el número de tarjeta o escanee el código QR</small>
                            </div>

                            <!-- Información de Tarjeta (se muestra después de buscar) -->
                            <div id="infoTarjetaCaja" style="display: none; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid var(--accent-blue);">
                                <h4 style="margin: 0 0 10px 0;">Información de la Tarjeta</h4>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <div>
                                        <strong>Asistente:</strong>
                                        <span id="asistenteNombreCaja">-</span>
                                    </div>
                                    <div>
                                        <strong>Saldo Actual:</strong>
                                        <span id="saldoActualCaja" style="font-weight: bold; color: var(--accent-blue);">$-</span>
                                    </div>
                                    <div>
                                        <strong>Estado:</strong>
                                        <span id="estadoTarjetaCaja">-</span>
                                    </div>
                                    <div>
                                        <strong>Número:</strong>
                                        <span id="numeroTarjetaInfoCaja">-</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Monto a Recargar -->
                            <div class="form-group">
                                <label for="montoRecargaCaja">Monto a Recargar *</label>
                                <div style="position: relative;">
                                    <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #666;">$</span>
                                    <input 
                                        type="number" 
                                        id="montoRecargaCaja" 
                                        name="monto"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        style="padding-left: 25px;"
                                    >
                                </div>
                                <small class="form-help">Ingrese el monto a recargar (mínimo $0.01)</small>
                            </div>

                            <!-- Botones de Acción -->
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" id="btnCancelarRecargaCaja">Limpiar</button>
                                <button type="submit" class="btn btn-primary" id="btnRecargarCaja">
                                    <span class="btn-text">💰 Recargar Saldo</span>
                                    <span class="btn-loader" style="display: none;">⏳</span>
                                </button>
                            </div>
                        </form>
                        <div id="resultadoRecargaCaja" class="resultado"></div>
                    </div>

                    <!-- Historial de Recargas Recientes -->
                    <div class="content-card">
                        <h3>Historial de Recargas Recientes</h3>
                        <div id="historialRecargasCaja">
                            <p style="color: #666; text-align: center; padding: 20px;">
                                Realice una recarga para ver el historial
                            </p>
                        </div>
                    </div>
                </div>
            </section>
```

**Líneas**: Agregar después de línea 693, antes de línea 695 (section-configuracion)

---

## 🔧 CAMBIO 3: Agregar Funciones JavaScript

### **Ubicación**: `static/js/admin-base.js`, después de la sección de PERFIL (después de línea ~1661)

### **Código completo a agregar**:

```javascript
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
```

**Líneas**: Agregar después de la sección de PERFIL, aproximadamente después de línea ~1661

---

## 🔧 CAMBIO 4: Inicializar Event Listeners en `inicializarAdminBase()`

### **Ubicación**: `static/js/admin-base.js`, dentro de la función `inicializarAdminBase()`, después de la inicialización del módulo de PERFIL

### **Código a agregar**:

```javascript
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
```

**Líneas**: Agregar después de la inicialización del módulo de PERFIL, dentro de `inicializarAdminBase()`

---

## 📊 Resumen de Líneas

### **`templates/admin/dashboard.html`**:
- **Línea ~84**: Agregar item de menú (8 líneas nuevas)
- **Línea ~693**: Agregar sección HTML completa (~90 líneas nuevas)

**Total HTML**: ~98 líneas nuevas

### **`static/js/admin-base.js`**:
- **Línea ~1661**: Agregar funciones del módulo Caja (~200 líneas nuevas)
- **Dentro de `inicializarAdminBase()`**: Agregar inicialización (~50 líneas nuevas)

**Total JavaScript**: ~250 líneas nuevas

---

## ⚠️ Consideraciones

1. **API existente**: Usa `POST /api/tarjetas/recargar` que ya existe y funciona
2. **Consulta de saldo**: Usa `GET /api/tarjetas/saldo/<numero_tarjeta>` que ya existe
3. **No se modifica backend**: Solo frontend
4. **No afecta otros módulos**: Es una sección completamente nueva
5. **Escaneo QR**: Por ahora es placeholder, se puede implementar después

---

## ✅ Funcionalidades Implementadas

1. **Búsqueda de tarjeta**: Al ingresar número, carga información automáticamente
2. **Información de tarjeta**: Muestra asistente, saldo, estado (activa/bloqueada)
3. **Recarga de saldo**: Formulario completo con validaciones
4. **Historial de recargas**: Muestra las últimas 10 recargas realizadas
5. **Mensajes informativos**: Indica si la tarjeta fue desbloqueada

---

## 📝 ¿Aplicar estos cambios?

¿Estás de acuerdo con esta propuesta? Si confirmas, procederé a aplicar los cambios exactamente como se muestra arriba.

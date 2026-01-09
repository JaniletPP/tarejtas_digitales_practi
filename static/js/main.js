// ============================================
// SISTEMA DE ALERTAS TOAST PROFESIONALES
// ============================================

/**
 * Muestra una alerta toast profesional
 * @param {string} type - Tipo de alerta: 'success', 'error', 'warning', 'info'
 * @param {string} message - Mensaje a mostrar
 * @param {string} title - Título opcional de la alerta
 * @param {number} duration - Duración en milisegundos (default: 4000)
 */
function showAlert(type = 'success', message = '', title = null, duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.error('Contenedor de toasts no encontrado');
        return;
    }

    // Configuración de iconos y títulos por defecto
    const config = {
        success: {
            icon: '✅',
            defaultTitle: 'Éxito',
            title: title || 'Operación exitosa'
        },
        error: {
            icon: '❌',
            defaultTitle: 'Error',
            title: title || 'Error en la operación'
        },
        warning: {
            icon: '⚠️',
            defaultTitle: 'Advertencia',
            title: title || 'Advertencia'
        },
        info: {
            icon: 'ℹ️',
            defaultTitle: 'Información',
            title: title || 'Información'
        }
    };

    const alertConfig = config[type] || config.info;

    // Crear elemento toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Crear contenido
    toast.innerHTML = `
        <div class="toast-icon">${alertConfig.icon}</div>
        <div class="toast-content">
            <div class="toast-title">${alertConfig.title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" aria-label="Cerrar">&times;</button>
        <div class="toast-progress"></div>
    `;

    // Agregar al contenedor
    container.appendChild(toast);

    // Función para cerrar el toast
    const closeToast = () => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    };

    // Event listeners
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', closeToast);

    // Auto-cerrar después de la duración especificada
    const timeoutId = setTimeout(closeToast, duration);

    // Pausar el progreso al hacer hover
    toast.addEventListener('mouseenter', () => {
        clearTimeout(timeoutId);
        toast.querySelector('.toast-progress').style.animationPlayState = 'paused';
    });

    toast.addEventListener('mouseleave', () => {
        const newTimeoutId = setTimeout(closeToast, duration);
        toast.querySelector('.toast-progress').style.animationPlayState = 'running';
    });
}

// Función auxiliar para mostrar mensajes (mantener compatibilidad)
function mostrarResultado(elementId, mensaje, tipo = 'success') {
    // Ya no se usa, pero se mantiene por compatibilidad
    // Ahora se usa showAlert directamente
    const messageText = typeof mensaje === 'string' ? mensaje : JSON.stringify(mensaje, null, 2);
    showAlert(tipo, messageText);
}

// Función auxiliar para hacer peticiones fetch
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

// 1. Registrar Asistente
const formRegistrarAsistente = document.getElementById('formRegistrarAsistente');
if (formRegistrarAsistente) {
    formRegistrarAsistente.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        nombre: document.getElementById('nombre').value,
        email: document.getElementById('email').value || null,
        telefono: document.getElementById('telefono').value || null
    };
    
    const { response, data, error } = await hacerPeticion('/api/asistentes', {
        method: 'POST',
        body: JSON.stringify(formData)
    });
    
    if (error) {
        showAlert('error', `Error de conexión: ${error}`);
        return;
    }
    
    if (data.success) {
        showAlert('success', 
            `ID: ${data.data.id} | ${data.data.nombre}${data.data.email ? ' | ' + data.data.email : ''}`,
            'Asistente registrado correctamente'
        );
        // Limpiar formulario
        document.getElementById('formRegistrarAsistente').reset();
    } else {
        showAlert('error', data.error);
    }
    });
}

// 2. Asignar Tarjeta
const formAsignarTarjeta = document.getElementById('formAsignarTarjeta');
if (formAsignarTarjeta) {
    formAsignarTarjeta.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const asistente_id = parseInt(document.getElementById('asistente_id').value);
    
    const { response, data, error } = await hacerPeticion('/api/tarjetas/asignar', {
        method: 'POST',
        body: JSON.stringify({ asistente_id })
    });
    
    if (error) {
        showAlert('error', `Error de conexión: ${error}`);
        return;
    }
    
    if (data.success) {
        showAlert('success', 
            `Tarjeta: ${data.data.numero_tarjeta} | Asistente: ${data.data.asistente_nombre} | Saldo: $${data.data.saldo}`,
            'Tarjeta asignada correctamente'
        );
        document.getElementById('formAsignarTarjeta').reset();
    } else {
        showAlert('error', data.error);
    }
    });
}

// 3. Recargar Saldo
const formRecargarSaldo = document.getElementById('formRecargarSaldo');
if (formRecargarSaldo) {
    formRecargarSaldo.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        numero_tarjeta: document.getElementById('numero_tarjeta_recarga').value,
        monto: parseFloat(document.getElementById('monto_recarga').value)
    };
    
    const { response, data, error } = await hacerPeticion('/api/tarjetas/recargar', {
        method: 'POST',
        body: JSON.stringify(formData)
    });
    
    if (error) {
        showAlert('error', `Error de conexión: ${error}`);
        return;
    }
    
    if (data.success) {
        showAlert('success', 
            `Tarjeta: ${data.data.tarjeta.numero_tarjeta} | Recargado: $${data.data.monto_recargado.toFixed(2)} | Nuevo saldo: $${data.data.saldo_nuevo.toFixed(2)}`,
            'Saldo recargado correctamente'
        );
        document.getElementById('formRecargarSaldo').reset();
    } else {
        showAlert('error', data.error);
    }
    });
}

// 4. Consultar Saldo
const formConsultarSaldo = document.getElementById('formConsultarSaldo');
if (formConsultarSaldo) {
    formConsultarSaldo.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const numero_tarjeta = document.getElementById('numero_tarjeta_consulta').value;
    
    const { response, data, error } = await hacerPeticion(`/api/tarjetas/saldo/${numero_tarjeta}`, {
        method: 'GET'
    });
    
    if (error) {
        showAlert('error', `Error de conexión: ${error}`);
        return;
    }
    
    if (data.success) {
        // Mostrar resultado en el div de resultado (mantener funcionalidad visual)
        const saldoDiv = document.createElement('div');
        saldoDiv.className = 'saldo-display';
        saldoDiv.textContent = data.data.saldo_formateado;
        
        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = `
            <p><strong>Número de Tarjeta:</strong> ${data.data.numero_tarjeta}</p>
            <p><strong>Asistente:</strong> ${data.data.asistente}</p>
        `;
        
        const resultado = document.getElementById('resultadoConsulta');
        resultado.className = 'resultado show success';
        resultado.innerHTML = '';
        resultado.appendChild(saldoDiv);
        resultado.appendChild(infoDiv);
        
        // También mostrar toast de confirmación
        showAlert('success', `Saldo consultado: ${data.data.saldo_formateado}`, 'Consulta exitosa');
    } else {
        showAlert('error', data.error);
    }
});

// 5. Listar Asistentes
const btnListarAsistentes = document.getElementById('btnListarAsistentes');
if (btnListarAsistentes) {
    btnListarAsistentes.addEventListener('click', async () => {
    const { response, data, error } = await hacerPeticion('/api/asistentes', {
        method: 'GET'
    });
    
    if (error) {
        showAlert('error', `Error de conexión: ${error}`);
        return;
    }
    
    if (data.success) {
        const listaDiv = document.getElementById('listaAsistentes');
        
        if (data.data.length === 0) {
            listaDiv.className = 'resultado show info';
            listaDiv.textContent = 'No hay asistentes registrados aún.';
            showAlert('info', 'No hay asistentes registrados en el sistema');
            return;
        }
        
        // Crear tabla
        let tablaHTML = '<table><thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Fecha Registro</th></tr></thead><tbody>';
        
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
        listaDiv.innerHTML = `<p><strong>Total de asistentes:</strong> ${data.data.length}</p>${tablaHTML}`;
        
        showAlert('success', `Se encontraron ${data.data.length} asistente(s)`, 'Lista cargada');
    } else {
        showAlert('error', data.error);
    }
    });
}

// 6. Ver Código QR
const formVerQR = document.getElementById('formVerQR');
if (formVerQR) {
    formVerQR.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const numero_tarjeta = document.getElementById('numero_tarjeta_qr').value;
    const resultadoDiv = document.getElementById('resultadoQR');
    
    // Verificar que la tarjeta existe primero
    const { response: checkResponse, data: checkData, error: checkError } = await hacerPeticion(`/api/tarjetas/saldo/${numero_tarjeta}`, {
        method: 'GET'
    });
    
    if (checkError || !checkData.success) {
        showAlert('error', checkData?.error || 'Tarjeta no encontrada');
        return;
    }
    
    // Mostrar QR
    const qrUrl = `/api/tarjetas/qr/${numero_tarjeta}`;
    resultadoDiv.className = 'resultado show success';
    resultadoDiv.innerHTML = `
        <div style="text-align: center;">
            <h3 style="margin-bottom: 15px;">Código QR de la Tarjeta</h3>
            <p style="margin-bottom: 10px;"><strong>Tarjeta:</strong> ${numero_tarjeta}</p>
            <p style="margin-bottom: 15px;"><strong>Asistente:</strong> ${checkData.data.asistente}</p>
            <img src="${qrUrl}" alt="QR Code" style="max-width: 300px; width: 100%; border: 2px solid #ddd; border-radius: 8px; padding: 10px; background: white;">
            <p style="margin-top: 15px; font-size: 0.9em; color: #666;">Escanea este código QR para identificar la tarjeta</p>
        </div>
    `;
    
    showAlert('success', `QR generado para tarjeta ${numero_tarjeta}`, 'QR Generado');
    });
}

// 7. Ver Historial de Transacciones (Modal)
const formHistorial = document.getElementById('formHistorial');
if (formHistorial) {
    formHistorial.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const numero_tarjeta = document.getElementById('numero_tarjeta_historial').value;
    
    const { response, data, error } = await hacerPeticion(`/api/tarjetas/historial/${numero_tarjeta}`, {
        method: 'GET'
    });
    
    if (error) {
        showAlert('error', `Error de conexión: ${error}`);
        return;
    }
    
    if (data.success) {
        const modal = document.getElementById('modalHistorial');
        const modalBody = document.getElementById('modalHistorialBody');
        
        if (data.data.transacciones.length === 0) {
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <p style="font-size: 1.2em; color: #666;">No hay transacciones registradas para esta tarjeta.</p>
                </div>
            `;
            modal.classList.add('show');
            showAlert('info', 'No hay transacciones para esta tarjeta');
            return;
        }
        
        // Crear contenido del modal
        let contenidoHTML = `
            <div class="modal-info">
                <div class="modal-info-item">
                    <strong>Tarjeta</strong>
                    <span>${data.data.numero_tarjeta}</span>
                </div>
                <div class="modal-info-item">
                    <strong>Asistente</strong>
                    <span>${data.data.asistente}</span>
                </div>
                <div class="modal-info-item">
                    <strong>Saldo Actual</strong>
                    <span style="color: #28a745; font-weight: bold; font-size: 1.3em;">$${data.data.saldo_actual.toFixed(2)}</span>
                </div>
                <div class="modal-info-item">
                    <strong>Total Transacciones</strong>
                    <span style="font-weight: bold;">${data.data.total_transacciones}</span>
                </div>
            </div>
            <div class="modal-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Tipo</th>
                            <th>Monto</th>
                            <th>Punto de Venta</th>
                            <th>Descripción</th>
                            <th>Saldo Anterior</th>
                            <th>Saldo Nuevo</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        data.data.transacciones.forEach(trans => {
            const tipoClass = trans.tipo === 'recarga' ? 'recarga' : 'pago';
            const tipoIcon = trans.tipo === 'recarga' ? '➕' : '➖';
            contenidoHTML += `
                <tr>
                    <td>${trans.fecha || 'N/A'}</td>
                    <td><span class="tipo-badge ${tipoClass}">${tipoIcon} ${trans.tipo.toUpperCase()}</span></td>
                    <td><strong>${trans.monto_formateado}</strong></td>
                    <td>${trans.punto_venta}</td>
                    <td>${trans.descripcion || 'N/A'}</td>
                    <td>$${trans.saldo_anterior.toFixed(2)}</td>
                    <td><strong>$${trans.saldo_nuevo.toFixed(2)}</strong></td>
                </tr>
            `;
        });
        
        contenidoHTML += '</tbody></table></div>';
        
        modalBody.innerHTML = contenidoHTML;
        modal.classList.add('show');
        
        // Limpiar formulario
        document.getElementById('formHistorial').reset();
        
        showAlert('success', `Historial cargado: ${data.data.total_transacciones} transacción(es)`, 'Historial');
    } else {
        showAlert('error', data.error);
    }
    });
}

// Cerrar modal al hacer clic en el botón X
const cerrarModalHistorial = document.getElementById('cerrarModalHistorial');
if (cerrarModalHistorial) {
    cerrarModalHistorial.addEventListener('click', () => {
        const modal = document.getElementById('modalHistorial');
        if (modal) {
            modal.classList.remove('show');
        }
    });
}

// Cerrar modal al hacer clic fuera del contenido
const modalHistorial = document.getElementById('modalHistorial');
if (modalHistorial) {
    modalHistorial.addEventListener('click', (e) => {
        if (e.target.id === 'modalHistorial') {
            document.getElementById('modalHistorial').classList.remove('show');
        }
    });
}

// Cerrar modal con tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('modalHistorial');
        if (modal) {
            modal.classList.remove('show');
        }
    }
});


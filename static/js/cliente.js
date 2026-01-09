// Script para vista del cliente (pública, sin login)

// Función auxiliar para hacer peticiones
async function hacerPeticionCliente(url, options = {}) {
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

// Función para mostrar alertas (si no está disponible)
if (typeof showAlert === 'undefined') {
    function showAlert(type, message, title = null) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            console.log(`[${type.toUpperCase()}] ${title || ''}: ${message}`);
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const icon = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }[type];
        
        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-icon">${icon}</span>
                <strong class="toast-title">${title || type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <button type="button" class="toast-close">&times;</button>
            </div>
            <div class="toast-body">${message}</div>
        `;
        
        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        
        const timer = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
        
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(timer);
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }
}

let tarjetaActual = null;

// Consultar tarjeta
document.getElementById('formClienteTarjeta').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const numero_tarjeta = document.getElementById('numero_tarjeta_cliente').value.trim().toUpperCase();
    
    const { response, data, error } = await hacerPeticionCliente(`/api/tarjetas/saldo/${numero_tarjeta}`, {
        method: 'GET'
    });
    
    if (error || !data.success) {
        showAlert('error', data?.error || 'Tarjeta no encontrada');
        return;
    }
    
    // Guardar información de la tarjeta
    tarjetaActual = {
        numero: data.data.numero_tarjeta,
        asistente: data.data.asistente,
        saldo: data.data.saldo,
        saldo_formateado: data.data.saldo_formateado
    };
    
    // Mostrar información
    document.getElementById('tarjetaNumero').textContent = tarjetaActual.numero;
    document.getElementById('tarjetaAsistente').textContent = tarjetaActual.asistente;
    document.getElementById('tarjetaSaldo').textContent = tarjetaActual.saldo_formateado;
    
    document.getElementById('infoTarjetaCliente').style.display = 'block';
    document.getElementById('qrCliente').style.display = 'none';
    
    // Scroll suave a la información
    document.getElementById('infoTarjetaCliente').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    showAlert('success', 'Tarjeta encontrada', 'Consulta Exitosa');
});

// Cerrar información de tarjeta
document.getElementById('btnCerrarInfo').addEventListener('click', () => {
    document.getElementById('infoTarjetaCliente').style.display = 'none';
    tarjetaActual = null;
    document.getElementById('formClienteTarjeta').reset();
    document.getElementById('numero_tarjeta_cliente').focus();
});

// Ver QR
document.getElementById('btnVerQR').addEventListener('click', () => {
    if (!tarjetaActual) {
        showAlert('error', 'Primero consulta tu tarjeta');
        return;
    }
    
    const qrUrl = `/api/tarjetas/qr/${tarjetaActual.numero}`;
    document.getElementById('qrImageCliente').src = qrUrl;
    document.getElementById('qrCliente').style.display = 'block';
    document.getElementById('qrCliente').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Cerrar QR
document.getElementById('btnCerrarQR').addEventListener('click', () => {
    document.getElementById('qrCliente').style.display = 'none';
});

// Ver historial
document.getElementById('btnVerHistorial').addEventListener('click', async () => {
    if (!tarjetaActual) {
        showAlert('error', 'Primero consulta tu tarjeta');
        return;
    }
    
    const { response, data, error } = await hacerPeticionCliente(`/api/tarjetas/historial/${tarjetaActual.numero}`, {
        method: 'GET'
    });
    
    if (error) {
        showAlert('error', `Error de conexión: ${error}`);
        return;
    }
    
    const modal = document.getElementById('modalHistorialCliente');
    const modalBody = document.getElementById('modalHistorialClienteBody');
    
    if (!data.success || data.data.transacciones.length === 0) {
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="font-size: 1.2em; color: #666;">No hay transacciones registradas para esta tarjeta.</p>
            </div>
        `;
        modal.classList.add('show');
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
});

// Cerrar modal de historial
document.getElementById('cerrarModalHistorialCliente').addEventListener('click', () => {
    document.getElementById('modalHistorialCliente').classList.remove('show');
});

// Cerrar modal al hacer clic fuera
document.getElementById('modalHistorialCliente').addEventListener('click', (e) => {
    if (e.target.id === 'modalHistorialCliente') {
        document.getElementById('modalHistorialCliente').classList.remove('show');
    }
});

// Cerrar modal con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('modalHistorialCliente').classList.remove('show');
    }
});

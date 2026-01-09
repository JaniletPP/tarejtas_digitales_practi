// Script para Estación de Recargas

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

// Recargar saldo
document.getElementById('formRecargarRecargas').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const numero_tarjeta = document.getElementById('numero_tarjeta_recarga_estacion').value.trim().toUpperCase();
    const monto = parseFloat(document.getElementById('monto_recarga_estacion').value);
    
    const { response, data, error } = await hacerPeticion('/api/tarjetas/recargar', {
        method: 'POST',
        body: JSON.stringify({ numero_tarjeta, monto })
    });
    
    if (error) {
        showAlert('error', `Error de conexión: ${error}`);
        return;
    }
    
    if (data.success) {
        showAlert('success', 
            `Recarga exitosa: $${data.data.monto_recargado.toFixed(2)}. Nuevo saldo: $${data.data.saldo_nuevo.toFixed(2)}`,
            'Recarga Completada'
        );
        
        const resultadoDiv = document.getElementById('resultadoRecargaEstacion');
        resultadoDiv.className = 'resultado show success';
        resultadoDiv.innerHTML = `
            <p><strong>✅ Recarga exitosa</strong></p>
            <p><strong>Tarjeta:</strong> ${data.data.tarjeta.numero_tarjeta}</p>
            <p><strong>Monto recargado:</strong> $${data.data.monto_recargado.toFixed(2)}</p>
            <p><strong>Saldo anterior:</strong> $${data.data.saldo_anterior.toFixed(2)}</p>
            <p><strong>Saldo nuevo:</strong> <span style="font-size: 1.3em; color: #28a745; font-weight: bold;">$${data.data.saldo_nuevo.toFixed(2)}</span></p>
        `;
        
        document.getElementById('formRecargarRecargas').reset();
        document.getElementById('numero_tarjeta_recarga_estacion').focus();
    } else {
        showAlert('error', data.error);
    }
});

// Consultar saldo
document.getElementById('formConsultarRecargas').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const numero_tarjeta = document.getElementById('numero_tarjeta_consulta_estacion').value.trim().toUpperCase();
    
    const { response, data, error } = await hacerPeticion(`/api/tarjetas/saldo/${numero_tarjeta}`, {
        method: 'GET'
    });
    
    if (error) {
        showAlert('error', `Error de conexión: ${error}`);
        return;
    }
    
    if (data.success) {
        const resultadoDiv = document.getElementById('resultadoConsultaEstacion');
        resultadoDiv.className = 'resultado show success';
        resultadoDiv.innerHTML = `
            <p><strong>✅ Tarjeta encontrada</strong></p>
            <p><strong>Número:</strong> ${data.data.numero_tarjeta}</p>
            <p><strong>Asistente:</strong> ${data.data.asistente}</p>
            <div style="text-align: center; margin-top: 20px;">
                <div style="font-size: 2.5em; font-weight: bold; color: #28a745;">
                    ${data.data.saldo_formateado}
                </div>
                <p style="margin-top: 10px; color: #666;">Saldo disponible</p>
            </div>
        `;
        
        showAlert('success', `Saldo consultado: ${data.data.saldo_formateado}`, 'Consulta Exitosa');
    } else {
        showAlert('error', data.error);
    }
});

// ============================================
// FUNCIONALIDAD DE ESCANEO QR
// ============================================

let html5QrCodeRecargas = null;
let qrScannerActiveRecargas = false;
let inputTargetRecargas = null; // Para saber a qué input asignar el valor

// Función para escanear QR
async function iniciarEscaneoQRRecargas(inputId) {
    const modal = document.getElementById('modalScanQR');
    const qrReader = document.getElementById('qr-reader');
    const qrStatus = document.getElementById('qr-reader-status');
    
    if (!modal || !qrReader) {
        showAlert('error', 'No se encontró el modal de escaneo QR');
        return;
    }
    
    // Guardar el input objetivo
    inputTargetRecargas = inputId;
    
    // Mostrar modal
    modal.style.display = 'flex';
    qrStatus.innerHTML = '<p>⏳ Iniciando cámara...</p>';
    
    try {
        // Inicializar el escáner
        html5QrCodeRecargas = new Html5Qrcode("qr-reader");
        
        // Iniciar escaneo
        await html5QrCodeRecargas.start(
            { facingMode: "environment" }, // Cámara trasera
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            (decodedText, decodedResult) => {
                // QR escaneado exitosamente
                detenerEscaneoQRRecargas();
                
                // Validar formato
                const numeroTarjeta = decodedText.trim().toUpperCase();
                if (numeroTarjeta.match(/^TARJ-\d{6}$/)) {
                    // Asignar al input correspondiente
                    const input = document.getElementById(inputTargetRecargas);
                    if (input) {
                        input.value = numeroTarjeta;
                        showAlert('success', `Tarjeta escaneada: ${numeroTarjeta}`, 'Escaneo Exitoso');
                        // Enviar formulario automáticamente si es recarga
                        if (inputTargetRecargas === 'numero_tarjeta_recarga_estacion') {
                            setTimeout(() => {
                                document.getElementById('formRecargarRecargas').dispatchEvent(new Event('submit'));
                            }, 500);
                        } else if (inputTargetRecargas === 'numero_tarjeta_consulta_estacion') {
                            setTimeout(() => {
                                document.getElementById('formConsultarRecargas').dispatchEvent(new Event('submit'));
                            }, 500);
                        }
                    }
                } else {
                    showAlert('error', `Formato inválido: ${numeroTarjeta}. Debe ser TARJ-XXXXXX`);
                }
            },
            (errorMessage) => {
                // Error al escanear (se ignora, es normal mientras busca)
            }
        );
        
        qrScannerActiveRecargas = true;
        qrStatus.innerHTML = '<p style="color: #28a745;">✅ Cámara activa - Escanea el código QR</p>';
        
    } catch (error) {
        console.error('Error iniciando escáner QR:', error);
        qrStatus.innerHTML = `<p style="color: #dc3545;">❌ Error: ${error.message}</p>`;
        showAlert('error', 'No se pudo acceder a la cámara. Verifica los permisos.');
    }
}

// Función para detener el escáner
function detenerEscaneoQRRecargas() {
    if (html5QrCodeRecargas && qrScannerActiveRecargas) {
        html5QrCodeRecargas.stop().then(() => {
            html5QrCodeRecargas.clear();
            qrScannerActiveRecargas = false;
        }).catch((err) => {
            console.error('Error deteniendo escáner:', err);
        });
    }
    
    const modal = document.getElementById('modalScanQR');
    if (modal) {
        modal.style.display = 'none';
    }
    
    inputTargetRecargas = null;
}

// Event listeners para botones de escanear QR
document.getElementById('btnScanQRRecarga')?.addEventListener('click', () => {
    iniciarEscaneoQRRecargas('numero_tarjeta_recarga_estacion');
});

document.getElementById('btnScanQRConsulta')?.addEventListener('click', () => {
    iniciarEscaneoQRRecargas('numero_tarjeta_consulta_estacion');
});

// Cerrar modal al hacer clic en el botón de cerrar
document.getElementById('cerrarModalScanQR')?.addEventListener('click', () => {
    detenerEscaneoQRRecargas();
});

// Cerrar modal al hacer clic fuera
document.getElementById('modalScanQR')?.addEventListener('click', (e) => {
    if (e.target.id === 'modalScanQR') {
        detenerEscaneoQRRecargas();
    }
});
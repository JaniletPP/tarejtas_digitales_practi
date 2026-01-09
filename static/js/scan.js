// Script para vista pública de escaneo de QR
document.getElementById('formScanQR').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const numero_tarjeta = document.getElementById('numero_tarjeta_scan').value.trim().toUpperCase();
    const resultadoDiv = document.getElementById('scanResult');
    
    try {
        const response = await fetch(`/api/tarjetas/saldo/${numero_tarjeta}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            resultadoDiv.className = 'scan-result show success';
            resultadoDiv.innerHTML = `
                <h3 style="color: #155724; margin-bottom: 15px;">✅ Tarjeta Encontrada</h3>
                <p><strong>Número de Tarjeta:</strong> ${data.data.numero_tarjeta}</p>
                <p><strong>Asistente:</strong> ${data.data.asistente}</p>
                <div style="text-align: center; margin-top: 20px;">
                    <div style="font-size: 2.5em; font-weight: bold; color: #28a745;">
                        ${data.data.saldo_formateado}
                    </div>
                    <p style="margin-top: 10px; color: #666;">Saldo disponible</p>
                </div>
            `;
        } else {
            resultadoDiv.className = 'scan-result show error';
            resultadoDiv.innerHTML = `
                <h3 style="color: #721c24; margin-bottom: 10px;">❌ Error</h3>
                <p>${data.error}</p>
            `;
        }
    } catch (error) {
        resultadoDiv.className = 'scan-result show error';
        resultadoDiv.innerHTML = `
            <h3 style="color: #721c24; margin-bottom: 10px;">❌ Error de Conexión</h3>
            <p>No se pudo conectar con el servidor. Intenta nuevamente.</p>
        `;
    }
});

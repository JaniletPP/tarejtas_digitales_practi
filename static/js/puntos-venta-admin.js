// CRUD de Puntos de Venta (Admin)
// Depende de: hacerPeticion(), showAlert() (definidas en main.js / admin-base.js)

let puntosVentaAdmin = [];
let puntosVentaAdminInitialized = false;

async function cargarPuntosVentaAdmin() {
    const contenedor = document.getElementById('puntosVentaTablaBody');
    const emptyMsg = document.getElementById('puntosVentaEmptyMsg');
    if (!contenedor) return;

    try {
        const { data, error } = await hacerPeticion('/api/puntos-venta', { method: 'GET' });
        if (error || !data?.success) {
            showAlert('error', data?.error || 'Error al cargar puntos de venta');
            return;
        }

        puntosVentaAdmin = Array.isArray(data.data) ? data.data : [];

        if (puntosVentaAdmin.length === 0) {
            contenedor.innerHTML = '';
            if (emptyMsg) emptyMsg.style.display = 'block';
            return;
        }
        if (emptyMsg) emptyMsg.style.display = 'none';

        contenedor.innerHTML = puntosVentaAdmin.map(pv => `
            <tr>
                <td>${pv.id}</td>
                <td><strong>${pv.nombre}</strong></td>
                <td>${pv.tipo || '-'}</td>
                <td><span style="color: green;">✓ Activo</span></td>
                <td class="acciones-cell">
                    <button class="btn btn-small btn-info" onclick="editarPuntoVentaAdmin(${pv.id})">✏️ Editar</button>
                    <button class="btn btn-small" style="background: #dc3545; color: white;" onclick="eliminarPuntoVentaAdmin(${pv.id})">🗑️ Eliminar</button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
        showAlert('error', 'Error al cargar puntos de venta');
    }
}

function abrirModalNuevoPuntoVenta() {
    const modal = document.getElementById('modalPuntoVentaAdmin');
    const form = document.getElementById('formPuntoVentaAdmin');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('puntoVentaIdAdmin').value = '';
    document.getElementById('modalPuntoVentaTitulo').textContent = '➕ Agregar Punto de Venta';
    document.getElementById('btnGuardarPuntoVentaAdmin').innerHTML = '<span class="btn-text">Agregar</span><span class="btn-loader" style="display:none;">⏳</span>';

    modal.classList.add('show');
    setTimeout(() => document.getElementById('puntoVentaNombreAdmin')?.focus(), 100);
}

function cerrarModalPuntoVenta() {
    const modal = document.getElementById('modalPuntoVentaAdmin');
    const form = document.getElementById('formPuntoVentaAdmin');
    if (!modal || !form) return;
    modal.classList.remove('show');
    form.reset();
    document.getElementById('puntoVentaIdAdmin').value = '';
}

async function editarPuntoVentaAdmin(id) {
    const pv = puntosVentaAdmin.find(x => x.id === id);
    if (!pv) {
        showAlert('error', 'No se encontró el punto de venta');
        return;
    }

    document.getElementById('puntoVentaIdAdmin').value = pv.id;
    document.getElementById('puntoVentaNombreAdmin').value = pv.nombre || '';
    document.getElementById('puntoVentaTipoAdmin').value = pv.tipo || '';
    document.getElementById('puntoVentaActivoAdmin').checked = pv.activo !== false;

    document.getElementById('modalPuntoVentaTitulo').textContent = '✏️ Editar Punto de Venta';
    document.getElementById('btnGuardarPuntoVentaAdmin').innerHTML = '<span class="btn-text">Guardar</span><span class="btn-loader" style="display:none;">⏳</span>';

    document.getElementById('modalPuntoVentaAdmin')?.classList.add('show');
}

async function eliminarPuntoVentaAdmin(id) {
    if (!confirm('¿Deseas eliminar (desactivar) este punto de venta?')) return;
    try {
        const { data, error } = await hacerPeticion(`/api/puntos-venta/${id}`, { method: 'DELETE' });
        if (error || !data?.success) {
            showAlert('error', data?.error || 'Error al eliminar');
            return;
        }
        showAlert('success', 'Punto de venta eliminado');
        await cargarPuntosVentaAdmin();
    } catch (e) {
        showAlert('error', 'Error al eliminar');
    }
}

function validarFormularioPuntoVenta() {
    const nombre = document.getElementById('puntoVentaNombreAdmin')?.value?.trim();
    const tipo = document.getElementById('puntoVentaTipoAdmin')?.value?.trim();
    if (!nombre) {
        showAlert('warning', 'El nombre es obligatorio');
        return false;
    }
    if (!tipo) {
        showAlert('warning', 'El tipo es obligatorio');
        return false;
    }
    return true;
}

function initPuntosVentaAdmin() {
    if (puntosVentaAdminInitialized) return;

    const section = document.getElementById('section-puntos-venta');
    if (!section) return;

    puntosVentaAdminInitialized = true;

    document.getElementById('btnNuevoPuntoVentaAdmin')?.addEventListener('click', abrirModalNuevoPuntoVenta);
    document.getElementById('cerrarModalPuntoVentaAdmin')?.addEventListener('click', cerrarModalPuntoVenta);
    document.getElementById('btnCancelarPuntoVentaAdmin')?.addEventListener('click', cerrarModalPuntoVenta);

    const modal = document.getElementById('modalPuntoVentaAdmin');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'modalPuntoVentaAdmin') cerrarModalPuntoVenta();
        });
    }

    const form = document.getElementById('formPuntoVentaAdmin');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validarFormularioPuntoVenta()) return;

            const id = document.getElementById('puntoVentaIdAdmin').value;
            const nombre = document.getElementById('puntoVentaNombreAdmin').value.trim();
            const tipo = document.getElementById('puntoVentaTipoAdmin').value.trim();
            const activo = document.getElementById('puntoVentaActivoAdmin').checked;

            const btn = document.getElementById('btnGuardarPuntoVentaAdmin');
            const btnText = btn?.querySelector('.btn-text');
            const btnLoader = btn?.querySelector('.btn-loader');
            if (btn) btn.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'inline-block';

            try {
                let result;
                if (id) {
                    result = await hacerPeticion(`/api/puntos-venta/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify({ nombre, tipo, activo })
                    });
                } else {
                    result = await hacerPeticion('/api/puntos-venta', {
                        method: 'POST',
                        body: JSON.stringify({ nombre, tipo, activo })
                    });
                }
                const { data, error } = result;
                if (error || !data?.success) {
                    showAlert('error', data?.error || 'Error al guardar');
                    return;
                }

                showAlert('success', id ? 'Punto de venta actualizado' : 'Punto de venta creado');
                cerrarModalPuntoVenta();
                await cargarPuntosVentaAdmin();
            } catch (e) {
                showAlert('error', 'Error al guardar');
            } finally {
                if (btn) btn.disabled = false;
                if (btnText) btnText.style.display = 'inline';
                if (btnLoader) btnLoader.style.display = 'none';
            }
        });
    }

    // Cargar cuando la sección esté activa
    if (section.classList.contains('active')) {
        cargarPuntosVentaAdmin();
    }

    const observer = new MutationObserver(() => {
        if (section.classList.contains('active')) {
            cargarPuntosVentaAdmin();
        }
    });
    observer.observe(section, { attributes: true, attributeFilter: ['class'] });

    // También recargar cuando se navega desde el menú
    document.querySelectorAll('[data-section="puntos-venta"]').forEach(el => {
        el.addEventListener('click', () => setTimeout(cargarPuntosVentaAdmin, 150));
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPuntosVentaAdmin);
} else {
    initPuntosVentaAdmin();
}

// Exponer funciones globales para onclick
window.editarPuntoVentaAdmin = editarPuntoVentaAdmin;
window.eliminarPuntoVentaAdmin = eliminarPuntoVentaAdmin;
window.abrirModalNuevoPuntoVenta = abrirModalNuevoPuntoVenta;


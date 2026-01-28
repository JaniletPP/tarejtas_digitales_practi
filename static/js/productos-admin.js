// Script para gestión de productos en Admin

let productosAdminTodos = [];
let tiposProductosAdmin = [];
let filtroTipoActual = '';
let busquedaActual = '';

// Cargar todos los productos
async function cargarProductosAdminTodos() {
    try {
        const { response, data, error } = await hacerPeticion('/api/productos', { method: 'GET' });
        
        if (error || !data.success) {
            showAlert('error', 'Error al cargar productos');
            return;
        }
        
        productosAdminTodos = data.data;
        mostrarProductosPorTipo();
    } catch (error) {
        console.error('Error cargando productos:', error);
        showAlert('error', 'Error al cargar productos');
    }
}

// Cargar tipos de productos
async function cargarTiposProductosAdminTodos() {
    try {
        const { response, data, error } = await hacerPeticion('/api/productos/tipos', { method: 'GET' });
        
        if (error || !data.success) {
            return;
        }
        
        tiposProductosAdmin = data.data;
        const filtroSelect = document.getElementById('filtroTipoProductosAdmin');
        if (!filtroSelect) return;
        
        // Limpiar opciones excepto "Todos"
        while (filtroSelect.children.length > 1) {
            filtroSelect.removeChild(filtroSelect.lastChild);
        }
        
        // Agregar tipos
        tiposProductosAdmin.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
            filtroSelect.appendChild(option);
        });

        // También intentar poblar el select de categoría del formulario (si existe)
        const tipoFormSelect = document.getElementById('productoTipoAdmin');
        if (tipoFormSelect) {
            // Guardar opciones hardcodeadas actuales como fallback
            const fallbackOptions = Array.from(tipoFormSelect.querySelectorAll('option'))
                .map(o => ({ value: o.value, text: o.textContent }))
                .filter(o => o.value);

            // Limpiar y reconstruir
            tipoFormSelect.innerHTML = '<option value="">Seleccione una categoría</option>';

            const tipos = Array.isArray(tiposProductosAdmin) ? tiposProductosAdmin.filter(Boolean) : [];
            if (tipos.length > 0) {
                tipos.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t;
                    opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
                    tipoFormSelect.appendChild(opt);
                });
            } else {
                // Fallback: usar las opciones que vienen en el HTML
                fallbackOptions.forEach(o => {
                    const opt = document.createElement('option');
                    opt.value = o.value;
                    opt.textContent = o.text;
                    tipoFormSelect.appendChild(opt);
                });
            }
        }
    } catch (error) {
        console.error('Error cargando tipos:', error);
    }
}

// Mostrar productos organizados por tipo
function mostrarProductosPorTipo() {
    const contenedor = document.getElementById('productosPorTipoAdmin');
    if (!contenedor) return;
    
    // Filtrar productos
    let productosFiltrados = productosAdminTodos;
    
    if (filtroTipoActual) {
        productosFiltrados = productosFiltrados.filter(p => p.tipo === filtroTipoActual);
    }
    
    if (busquedaActual) {
        const busqueda = busquedaActual.toLowerCase();
        productosFiltrados = productosFiltrados.filter(p => 
            p.nombre.toLowerCase().includes(busqueda)
        );
    }
    
    // Agrupar por tipo
    const productosPorTipo = {};
    productosFiltrados.forEach(producto => {
        if (!productosPorTipo[producto.tipo]) {
            productosPorTipo[producto.tipo] = [];
        }
        productosPorTipo[producto.tipo].push(producto);
    });
    
    // Generar HTML
    if (Object.keys(productosPorTipo).length === 0) {
        contenedor.innerHTML = '<div class="content-card"><p style="text-align: center; color: #999;">No hay productos disponibles</p></div>';
        return;
    }
    
    let html = '';
    Object.keys(productosPorTipo).sort().forEach(tipo => {
        const productos = productosPorTipo[tipo];
        const tipoCapitalizado = tipo.charAt(0).toUpperCase() + tipo.slice(1);
        
        html += `
            <div class="content-card tipo-producto-card">
                <div class="tipo-producto-header">
                    <h3>${tipoCapitalizado} (${productos.length})</h3>
                </div>
                <div class="productos-tabla-container">
                    <table class="productos-tabla">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Categoría</th>
                                <th>Precio</th>
                                <th>Punto de Venta</th>
                                <th>Estado</th>
                                <th>Descripción</th>
                                <th class="acciones-cell">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        productos.forEach(producto => {
            html += `
                <tr>
                    <td>${producto.id}</td>
                    <td><strong>${producto.nombre}</strong></td>
                    <td>${producto.tipo || '-'}</td>
                    <td>$${parseFloat(producto.precio).toFixed(2)}</td>
                    <td>${producto.punto_venta_nombre || 'N/A'}</td>
                    <td>${producto.activo ? '<span style="color: green;">✓ Activo</span>' : '<span style="color: red;">✗ Inactivo</span>'}</td>
                    <td>${producto.descripcion || '-'}</td>
                    <td class="acciones-cell">
                        <button class="btn btn-small btn-info" onclick="editarProductoAdmin(${producto.id})">✏️ Editar</button>
                        <button class="btn btn-small" style="background: #dc3545; color: white;" onclick="eliminarProductoAdmin(${producto.id})">🗑️ Eliminar</button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
    
    contenedor.innerHTML = html;
}

// Actualizar preview de imagen
function actualizarPreviewImagen(url) {
    const previewContainer = document.getElementById('productoImagenPreviewContainerAdmin');
    const preview = document.getElementById('productoImagenPreviewAdmin');
    
    if (!previewContainer || !preview) return;
    
    if (url && url.trim()) {
        preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentElement.innerHTML='<span class=\\'preview-icon\\'>🖼️</span><span class=\\'preview-text\\'>Error al cargar imagen</span>'">`;
        preview.classList.add('has-image');
    } else {
        preview.innerHTML = '<span class="preview-icon">🖼️</span><span class="preview-text">Sin imagen</span>';
        preview.classList.remove('has-image');
    }
}


// Validar formulario
function validarFormularioProducto() {
    let esValido = true;
    
    // Limpiar errores previos
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });
    document.querySelectorAll('.form-error').forEach(error => {
        error.textContent = '';
    });
    
    // Validar nombre
    const nombre = document.getElementById('productoNombreAdmin').value.trim();
    if (!nombre) {
        mostrarError('productoNombreAdmin', 'El nombre del producto es obligatorio');
        esValido = false;
    } else if (nombre.length > 100) {
        mostrarError('productoNombreAdmin', 'El nombre no puede exceder 100 caracteres');
        esValido = false;
    }
    
    // Validar precio
    const precio = parseFloat(document.getElementById('productoPrecioAdmin').value);
    if (isNaN(precio) || precio <= 0) {
        mostrarError('productoPrecioAdmin', 'El precio debe ser mayor a 0');
        esValido = false;
    }

    // Validar tipo
    const tipoEl = document.getElementById('productoTipoAdmin');
    if (tipoEl) {
        const tipo = tipoEl.value;
        if (!tipo) {
            mostrarError('productoTipoAdmin', 'La categoría es obligatoria');
            esValido = false;
        }
    }

    // Validar URL de imagen si se proporciona
    const imagenUrlEl = document.getElementById('productoImagenUrlAdmin');
    if (imagenUrlEl) {
        const imagenUrl = imagenUrlEl.value.trim();
        if (imagenUrl) {
            try {
                new URL(imagenUrl);
            } catch (e) {
                mostrarError('productoImagenUrlAdmin', 'La URL de la imagen no es válida');
                esValido = false;
            }
        }
    }
    
    return esValido;
}

// Mostrar error en campo
function mostrarError(campoId, mensaje) {
    const campo = document.getElementById(campoId);
    if (!campo) return;
    
    const formGroup = campo.closest('.form-group');
    if (formGroup) {
        formGroup.classList.add('error');
        const errorElement = formGroup.querySelector('.form-error');
        if (errorElement) {
            errorElement.textContent = mensaje;
        }
    }
}

// Editar producto
async function editarProductoAdmin(productoId) {
    try {
        const result = await hacerPeticion(`/api/productos/${productoId}`, { method: 'GET' });
        const { response, data, error } = result;
        
        if (error || !data.success) {
            showAlert('error', data?.error || 'Error al cargar el producto');
            return;
        }
        
        const producto = data.data;
        
        // Llenar formulario (todos los campos)
        document.getElementById('productoIdAdmin').value = producto.id;
        document.getElementById('productoNombreAdmin').value = producto.nombre || '';
        document.getElementById('productoPrecioAdmin').value = producto.precio || '';
        const tipoEl = document.getElementById('productoTipoAdmin');
        if (tipoEl) tipoEl.value = producto.tipo || '';
        const pvEl = document.getElementById('productoPuntoVentaAdmin');
        if (pvEl) pvEl.value = producto.punto_venta_id || '';
        const descEl = document.getElementById('productoDescripcionAdmin');
        if (descEl) descEl.value = producto.descripcion || '';
        document.getElementById('productoActivoAdmin').checked = producto.activo !== false;
        const imgEl = document.getElementById('productoImagenUrlAdmin');
        if (imgEl) imgEl.value = producto.imagen_url || '';
        actualizarPreviewImagen(producto.imagen_url || '');
        actualizarContadorCaracteres();
        
        // Actualizar label del switch
        actualizarSwitchLabel();
        
        // Cambiar título y botón del modal
        document.getElementById('modalProductoTitulo').textContent = '✏️ Editar Producto';
        document.getElementById('btnGuardarProductoAdmin').innerHTML = '<span class="btn-text">Guardar Cambios</span><span class="btn-loader" style="display: none;">⏳</span>';
        
        // Abrir modal
        document.getElementById('modalProductoAdmin').classList.add('show');
    } catch (error) {
        showAlert('error', 'Error al cargar el producto');
    }
}

// Eliminar producto
async function eliminarProductoAdmin(productoId) {
    if (!confirm('¿Está seguro de que desea eliminar este producto?')) {
        return;
    }
    
    try {
        const { response, data, error } = await hacerPeticion(`/api/productos/${productoId}`, { method: 'DELETE' });
        
        if (error || !data.success) {
            showAlert('error', data?.error || 'Error al eliminar el producto');
            return;
        }
        
        showAlert('success', 'Producto eliminado correctamente');
        await cargarProductosAdminTodos();
    } catch (error) {
        showAlert('error', 'Error al eliminar el producto');
    }
}

// Filtro por tipo
const filtroTipoProductosAdmin = document.getElementById('filtroTipoProductosAdmin');
if (filtroTipoProductosAdmin) {
    filtroTipoProductosAdmin.addEventListener('change', (e) => {
        filtroTipoActual = e.target.value;
        mostrarProductosPorTipo();
    });
}

// Búsqueda
const buscarProductoAdmin = document.getElementById('buscarProductoAdmin');
if (buscarProductoAdmin) {
    buscarProductoAdmin.addEventListener('input', (e) => {
        busquedaActual = e.target.value;
        mostrarProductosPorTipo();
    });
}

// Abrir modal para nuevo producto
function abrirModalNuevoProducto() {
    const modal = document.getElementById('modalProductoAdmin');
    if (!modal) {
        showAlert('error', 'No se encontró el modal de productos');
        return;
    }
    // Limpiar formulario
    document.getElementById('formProductoAdmin').reset();
    document.getElementById('productoIdAdmin').value = '';
    document.getElementById('productoActivoAdmin').checked = true;
    const otroEl = document.getElementById('productoAgregarOtroAdmin');
    if (otroEl) otroEl.checked = false;
    document.getElementById('modalProductoTitulo').textContent = '➕ Agregar Nuevo Producto';
    document.getElementById('btnGuardarProductoAdmin').innerHTML = '<span class="btn-text">Agregar Producto</span><span class="btn-loader" style="display: none;">⏳</span>';
    
    // Limpiar errores
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });
    
    // Actualizar label del switch
    actualizarSwitchLabel();
    actualizarPreviewImagen('');
    actualizarContadorCaracteres();
    
    // Abrir modal
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    
    // Focus en nombre
    setTimeout(() => {
        const inputNombre = document.getElementById('productoNombreAdmin');
        if (inputNombre) inputNombre.focus();
    }, 100);
}

document.addEventListener('DOMContentLoaded', () => {
    const btnNuevoProductoAdmin = document.getElementById('btnNuevoProductoAdmin');
    if (btnNuevoProductoAdmin) {
        btnNuevoProductoAdmin.addEventListener('click', abrirModalNuevoProducto);
    }
    // Fallback por si el listener no se registró antes
    setTimeout(() => {
        const btn = document.getElementById('btnNuevoProductoAdmin');
        if (btn && !btn.dataset.boundNuevoProducto) {
            btn.dataset.boundNuevoProducto = '1';
            btn.addEventListener('click', abrirModalNuevoProducto);
        }
    }, 500);
});

// Exponer función global como respaldo para onclick en el botón
window.abrirModalNuevoProducto = abrirModalNuevoProducto;

// Cerrar modal
function cerrarModalProducto() {
    document.getElementById('modalProductoAdmin').classList.remove('show');
    document.getElementById('formProductoAdmin').reset();
    document.getElementById('productoIdAdmin').value = '';
    
    // Limpiar errores
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });
    
    // Actualizar label del switch
    actualizarSwitchLabel();

    // Limpiar preview / contador
    actualizarPreviewImagen('');
    actualizarContadorCaracteres();
}

const cerrarModalProductoAdmin = document.getElementById('cerrarModalProductoAdmin');
if (cerrarModalProductoAdmin) {
    cerrarModalProductoAdmin.addEventListener('click', cerrarModalProducto);
}

const btnCancelarProductoAdmin = document.getElementById('btnCancelarProductoAdmin');
if (btnCancelarProductoAdmin) {
    btnCancelarProductoAdmin.addEventListener('click', cerrarModalProducto);
}

// Cerrar modal al hacer clic fuera
const modalProductoAdmin = document.getElementById('modalProductoAdmin');
if (modalProductoAdmin) {
    modalProductoAdmin.addEventListener('click', (e) => {
        if (e.target.id === 'modalProductoAdmin') {
            cerrarModalProducto();
        }
    });
}


// Actualizar label del switch
function actualizarSwitchLabel() {
    const checkbox = document.getElementById('productoActivoAdmin');
    const label = document.getElementById('switchLabelAdmin');
    if (checkbox && label) {
        label.textContent = checkbox.checked ? 'Activo' : 'Inactivo';
    }
}

// Actualizar contador de caracteres
function actualizarContadorCaracteres() {
    const textarea = document.getElementById('productoDescripcionAdmin');
    const charCount = document.getElementById('charCountAdmin');
    if (textarea && charCount) {
        charCount.textContent = textarea.value.length;
    }
}

// Guardar producto (crear o actualizar)
const formProductoAdmin = document.getElementById('formProductoAdmin');
if (formProductoAdmin) {
    formProductoAdmin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validar formulario
        if (!validarFormularioProducto()) {
            showAlert('warning', 'Por favor, corrige los errores en el formulario');
            return;
        }
        
        const productoId = document.getElementById('productoIdAdmin').value;
        const nombre = document.getElementById('productoNombreAdmin').value.trim();
        const precio = parseFloat(document.getElementById('productoPrecioAdmin').value);
        const tipo = document.getElementById('productoTipoAdmin') ? document.getElementById('productoTipoAdmin').value : null;
        const punto_venta_id = document.getElementById('productoPuntoVentaAdmin') ? (document.getElementById('productoPuntoVentaAdmin').value || null) : null;
        const descripcion = document.getElementById('productoDescripcionAdmin') ? (document.getElementById('productoDescripcionAdmin').value.trim() || null) : null;
        const imagen_url = document.getElementById('productoImagenUrlAdmin') ? (document.getElementById('productoImagenUrlAdmin').value.trim() || null) : null;
        const activo = document.getElementById('productoActivoAdmin').checked;
        const agregarOtro = document.getElementById('productoAgregarOtroAdmin') ? document.getElementById('productoAgregarOtroAdmin').checked : false;
        
        // Deshabilitar botón y mostrar loader
        const btnGuardar = document.getElementById('btnGuardarProductoAdmin');
        const btnText = btnGuardar.querySelector('.btn-text');
        const btnLoader = btnGuardar.querySelector('.btn-loader');
        btnGuardar.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'inline-block';
        
        try {
            let response, data, error;
            
            if (productoId) {
                // Actualizar
                const result = await hacerPeticion(`/api/productos/${productoId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        nombre,
                        precio,
                        tipo,
                        punto_venta_id: punto_venta_id ? parseInt(punto_venta_id) : null,
                        descripcion,
                        imagen_url,
                        activo
                    })
                });
                response = result.response;
                data = result.data;
                error = result.error;
            } else {
                // Crear
                const result = await hacerPeticion('/api/productos', {
                    method: 'POST',
                    body: JSON.stringify({
                        nombre,
                        precio,
                        tipo,
                        punto_venta_id: punto_venta_id ? parseInt(punto_venta_id) : null,
                        descripcion,
                        imagen_url,
                        activo
                    })
                });
                response = result.response;
                data = result.data;
                error = result.error;
            }
            
            if (error || !data.success) {
                showAlert('error', data?.error || 'Error al guardar el producto');
                return;
            }
            
            showAlert('success', productoId ? 'Producto actualizado correctamente' : `Producto "${nombre}" creado correctamente`);
            
            if (!agregarOtro) {
                // Cerrar modal
                document.getElementById('modalProductoAdmin').classList.remove('show');
                formProductoAdmin.reset();
                document.getElementById('productoIdAdmin').value = '';
                document.getElementById('productoActivoAdmin').checked = true;
                actualizarSwitchLabel();
                actualizarPreviewImagen('');
                actualizarContadorCaracteres();
            } else {
                // Limpiar formulario pero mantener modal abierto
                formProductoAdmin.reset();
                document.getElementById('productoIdAdmin').value = '';
                document.getElementById('productoActivoAdmin').checked = true;
                const otroEl = document.getElementById('productoAgregarOtroAdmin');
                if (otroEl) otroEl.checked = true;
                actualizarSwitchLabel();
                actualizarPreviewImagen('');
                actualizarContadorCaracteres();
                document.getElementById('modalProductoTitulo').textContent = '➕ Agregar Nuevo Producto';
                document.getElementById('btnGuardarProductoAdmin').innerHTML = '<span class="btn-text">Agregar Producto</span><span class="btn-loader" style="display: none;">⏳</span>';
                document.getElementById('productoNombreAdmin').focus();
            }
            
            // Recargar productos
            await cargarProductosAdminTodos();
            await cargarTiposProductosAdminTodos();
        } catch (error) {
            showAlert('error', 'Error al guardar el producto');
        } finally {
            // Rehabilitar botón
            btnGuardar.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoader) btnLoader.style.display = 'none';
        }
    });
    
    // Event listeners para validación en tiempo real
    const nombreInput = document.getElementById('productoNombreAdmin');
    if (nombreInput) {
        nombreInput.addEventListener('blur', () => {
            const nombre = nombreInput.value.trim();
            if (nombre && nombre.length > 100) {
                mostrarError('productoNombreAdmin', 'El nombre no puede exceder 100 caracteres');
            }
        });
    }
    
    const precioInput = document.getElementById('productoPrecioAdmin');
    if (precioInput) {
        precioInput.addEventListener('blur', () => {
            const precio = parseFloat(precioInput.value);
            if (isNaN(precio) || precio <= 0) {
                mostrarError('productoPrecioAdmin', 'El precio debe ser mayor a 0');
            }
        });
    }
    
    // Switch de activo/inactivo
    const activoCheckbox = document.getElementById('productoActivoAdmin');
    if (activoCheckbox) {
        activoCheckbox.addEventListener('change', actualizarSwitchLabel);
    }

    // Contador de caracteres para descripción
    const descripcionTextarea = document.getElementById('productoDescripcionAdmin');
    if (descripcionTextarea) {
        descripcionTextarea.addEventListener('input', actualizarContadorCaracteres);
    }

    // Preview de imagen
    const imagenUrlInput = document.getElementById('productoImagenUrlAdmin');
    const btnPreviewImagen = document.getElementById('btnPreviewImagenAdmin');
    
    if (imagenUrlInput) {
        imagenUrlInput.addEventListener('blur', () => {
            const url = imagenUrlInput.value.trim();
            if (url) {
                try {
                    new URL(url);
                    actualizarPreviewImagen(url);
                } catch (e) {
                    mostrarError('productoImagenUrlAdmin', 'La URL de la imagen no es válida');
                }
            } else {
                actualizarPreviewImagen('');
            }
        });
    }
    
    if (btnPreviewImagen && imagenUrlInput) {
        btnPreviewImagen.addEventListener('click', () => {
            const url = imagenUrlInput.value.trim();
            if (url) {
                try {
                    new URL(url);
                    actualizarPreviewImagen(url);
                } catch (e) {
                    mostrarError('productoImagenUrlAdmin', 'La URL de la imagen no es válida');
                }
            }
        });
    }
}

// Cargar puntos de venta para el formulario
async function cargarPuntosVentaProductosAdmin() {
    try {
        const { response, data, error } = await hacerPeticion('/api/puntos-venta', { method: 'GET' });
        
        if (error || !data.success) {
            return;
        }
        
        const select = document.getElementById('productoPuntoVentaAdmin');
        const emptyMsg = document.getElementById('productoPuntoVentaEmptyMsg');
        if (!select) return;
        
        // Limpiar opciones excepto la primera
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        const puntos = Array.isArray(data.data) ? data.data : [];
        if (puntos.length === 0) {
            // Mostrar mensaje y dejar el select con solo el placeholder
            if (emptyMsg) emptyMsg.style.display = 'block';
            select.disabled = true;
            return;
        }

        if (emptyMsg) emptyMsg.style.display = 'none';
        select.disabled = false;

        puntos.forEach(pv => {
            const option = document.createElement('option');
            option.value = pv.id;
            option.textContent = pv.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando puntos de venta:', error);
    }
}


// Inicializar cuando se accede a la sección
let productosAdminInitialized = false;

function inicializarProductosAdmin() {
    if (productosAdminInitialized) return;
    
    const section = document.getElementById('section-productos');
    if (section && section.classList.contains('active')) {
        productosAdminInitialized = true;
        cargarTiposProductosAdminTodos();
        cargarPuntosVentaProductosAdmin();
        cargarProductosAdminTodos();
    }
}

// Observar cambios en las secciones
const observerProductos = new MutationObserver(() => {
    inicializarProductosAdmin();
});

// Observar cuando se activa la sección de productos
document.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('section-productos');
    if (section) {
        observerProductos.observe(section, { attributes: true, attributeFilter: ['class'] });
        inicializarProductosAdmin();
    }
    
    // También inicializar cuando se hace clic en el menú
    document.querySelectorAll('[data-section="productos"]').forEach(item => {
        item.addEventListener('click', () => {
            setTimeout(() => {
                inicializarProductosAdmin();
            }, 100);
        });
    });
});

// Hacer funciones globales para los botones
window.editarProductoAdmin = editarProductoAdmin;
window.eliminarProductoAdmin = eliminarProductoAdmin;
window.abrirModalNuevoProducto = abrirModalNuevoProducto;

// Asegurar que el botón tenga el event listener incluso si se carga después
setTimeout(() => {
    const btnNuevoProductoAdmin = document.getElementById('btnNuevoProductoAdmin');
    if (btnNuevoProductoAdmin && !btnNuevoProductoAdmin.hasAttribute('data-listener-attached')) {
        btnNuevoProductoAdmin.addEventListener('click', abrirModalNuevoProducto);
        btnNuevoProductoAdmin.setAttribute('data-listener-attached', 'true');
        console.log('Event listener agregado a btnNuevoProductoAdmin');
    }
}, 500);

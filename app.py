"""
Aplicación Flask principal
"""
from flask import Flask, render_template, redirect, url_for, session, flash
from config import Config
import routes
from auth import auth_bp
from auth.auth_routes import requiere_autenticacion
from auth.decorators import requiere_rol, solo_admin, solo_punto_venta, solo_recargas

app = Flask(__name__)
app.config.from_object(Config)

# Registrar blueprint de autenticación
app.register_blueprint(auth_bp)

# ============================================
# RUTA PÚBLICA - ESCANEO DE QR (SIN LOGIN)
# ============================================

@app.route('/scan')
def scan_qr():
    """
    Vista pública para escanear QR de tarjeta
    No requiere autenticación - para uso de clientes finales
    """
    return render_template('scan.html')

# ============================================
# RUTAS POR ROL
# ============================================

@app.route('/admin/dashboard')
@solo_admin
def admin_dashboard():
    """Dashboard de administración"""
    return render_template('admin/dashboard.html')

@app.route('/pos')
@solo_punto_venta
def pos():
    """Interfaz de punto de venta - Vista exclusiva para ventas"""
    return render_template('pos/index.html')

@app.route('/recargas')
@solo_recargas
def recargas():
    """Interfaz de recargas"""
    return render_template('recargas/index.html')

# Página principal (redirige según rol)
@app.route('/')
def index():
    """
    Página principal - redirige según el rol del usuario
    """
    if not requiere_autenticacion():
        return redirect(url_for('auth.login'))
    
    # Redirigir según rol
    rol = session.get('rol')
    if rol == 'admin':
        return redirect(url_for('admin_dashboard'))
    elif rol == 'punto_venta':
        return redirect(url_for('pos'))
    elif rol == 'recargas':
        return redirect(url_for('recargas'))
    else:
        return redirect(url_for('auth.login'))

# ============================================
# RUTAS DE API - ASISTENTES
# ============================================

@app.route('/api/asistentes', methods=['POST'])
@solo_admin
def api_registrar_asistente():
    """Registrar un nuevo asistente"""
    return routes.registrar_asistente()

@app.route('/api/asistentes', methods=['GET'])
def api_listar_asistentes():
    """Listar todos los asistentes"""
    return routes.listar_asistentes()

@app.route('/api/asistentes/sin-tarjeta', methods=['GET'])
def api_listar_asistentes_sin_tarjeta():
    """Listar asistentes sin tarjeta asignada"""
    return routes.listar_asistentes_sin_tarjeta()

# ============================================
# RUTAS DE API - TARJETAS
# ============================================

@app.route('/api/tarjetas/asignar', methods=['POST'])
def api_asignar_tarjeta():
    """Asignar una tarjeta a un asistente"""
    return routes.asignar_tarjeta()

@app.route('/api/tarjetas/recargar', methods=['POST'])
def api_cargar_saldo():
    """Recargar saldo a una tarjeta"""
    return routes.cargar_saldo()

@app.route('/api/tarjetas/pagar', methods=['POST'])
def api_procesar_pago():
    """Procesar un pago con una tarjeta"""
    return routes.procesar_pago()

@app.route('/api/tarjetas/saldo/<numero_tarjeta>', methods=['GET'])
def api_consultar_saldo(numero_tarjeta):
    """Consultar saldo de una tarjeta"""
    return routes.consultar_saldo()

@app.route('/api/tarjetas/historial/<numero_tarjeta>', methods=['GET'])
def api_obtener_historial(numero_tarjeta):
    """Obtener historial de transacciones de una tarjeta"""
    return routes.obtener_historial()

# ============================================
# RUTAS DE API - PUNTOS DE VENTA
# ============================================

@app.route('/api/puntos-venta', methods=['GET'])
def api_listar_puntos_venta():
    """Listar todos los puntos de venta"""
    return routes.listar_puntos_venta()

@app.route('/api/puntos-venta', methods=['POST'])
@solo_admin
def api_crear_punto_venta():
    """Crear un nuevo punto de venta (admin)"""
    return routes.crear_punto_venta()

@app.route('/api/puntos-venta/<int:punto_venta_id>', methods=['PUT'])
@solo_admin
def api_actualizar_punto_venta(punto_venta_id):
    """Actualizar un punto de venta (admin)"""
    return routes.actualizar_punto_venta(punto_venta_id)

@app.route('/api/puntos-venta/<int:punto_venta_id>', methods=['DELETE'])
@solo_admin
def api_eliminar_punto_venta(punto_venta_id):
    """Eliminar (desactivar) un punto de venta (admin)"""
    return routes.eliminar_punto_venta(punto_venta_id)

# ============================================
# RUTAS DE API - PRODUCTOS
# ============================================

@app.route('/api/productos', methods=['GET'])
def api_listar_productos():
    """Listar todos los productos (opcionalmente filtrados por tipo)"""
    return routes.listar_productos()

@app.route('/api/productos/tipos', methods=['GET'])
def api_obtener_tipos_productos():
    """Obtener lista de tipos de productos"""
    return routes.obtener_tipos_productos()

@app.route('/api/productos', methods=['POST'])
def api_crear_producto():
    """Crear un nuevo producto"""
    return routes.crear_producto()

@app.route('/api/productos/<int:producto_id>', methods=['GET'])
def api_obtener_producto(producto_id):
    """Obtener un producto por ID"""
    return routes.obtener_producto(producto_id)

@app.route('/api/productos/<int:producto_id>', methods=['PUT'])
def api_actualizar_producto(producto_id):
    """Actualizar un producto"""
    return routes.actualizar_producto(producto_id)

@app.route('/api/productos/<int:producto_id>', methods=['DELETE'])
def api_eliminar_producto(producto_id):
    """Eliminar (desactivar) un producto"""
    return routes.eliminar_producto(producto_id)

# ============================================
# RUTAS DE API - QR
# ============================================

@app.route('/api/tarjetas/qr/<numero_tarjeta>', methods=['GET'])
def api_generar_qr(numero_tarjeta):
    """Generar código QR de una tarjeta"""
    return routes.generar_qr()

@app.route('/api/tarjetas/verificar/<numero_tarjeta>', methods=['GET'])
def api_verificar_tarjeta(numero_tarjeta):
    """Verificar estado de una tarjeta"""
    return routes.verificar_tarjeta()

# ============================================
# RUTAS DE API - REPORTES
# ============================================

@app.route('/api/reportes/ventas', methods=['GET'])
def api_reporte_ventas():
    """Obtener reporte de ventas"""
    return routes.obtener_reporte_ventas()

@app.route('/api/reportes/transacciones', methods=['GET'])
def api_reporte_transacciones():
    """Obtener reporte de transacciones"""
    return routes.obtener_reporte_transacciones()

# ============================================
# RUTAS DE API - PERFIL
# ============================================

@app.route('/api/perfil', methods=['GET'])
@solo_admin
def api_obtener_perfil():
    """Obtener perfil del usuario actual"""
    return routes.obtener_perfil()

@app.route('/api/perfil', methods=['PUT'])
@solo_admin
def api_actualizar_perfil():
    """Actualizar perfil del usuario actual"""
    return routes.actualizar_perfil()

if __name__ == '__main__':
    app.run(debug=Config.DEBUG, host='0.0.0.0', port=5000)

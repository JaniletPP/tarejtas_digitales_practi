"""
Rutas de autenticación y gestión de sesiones
"""
from flask import render_template, request, redirect, url_for, session, flash
from auth import auth_bp

# ============================================
# USUARIOS TEMPORALES (FASE ACTUAL)
# TODO: Conectar con base de datos en futura implementación
# ============================================
USUARIOS_TEMPORALES = {
    'admin': {
        'password': 'admin123',
        'rol': 'admin'
    },
    'punto_venta': {
        'password': 'venta123',
        'rol': 'punto_venta'
    },
    'recargas': {
        'password': 'recarga123',
        'rol': 'recargas'
    }
}

# ============================================
# RUTAS DE AUTENTICACIÓN
# ============================================

@auth_bp.route('login', methods=['GET', 'POST'])
def login():
    """
    Página de inicio de sesión
    
    GET: Muestra el formulario de login
    POST: Procesa las credenciales y crea la sesión
    """
    # Si ya está autenticado, redirigir según su rol
    if 'usuario' in session:
        rol = session.get('rol')
        if rol == 'admin':
            return redirect(url_for('admin_dashboard'))
        elif rol == 'punto_venta':
            return redirect(url_for('pos'))
        elif rol == 'recargas':
            return redirect(url_for('recargas'))
        else:
            return redirect(url_for('index'))
    
    if request.method == 'POST':
        usuario = request.form.get('usuario', '').strip()
        password = request.form.get('password', '').strip()
        
        # Validar credenciales
        if usuario in USUARIOS_TEMPORALES:
            if USUARIOS_TEMPORALES[usuario]['password'] == password:
                # Crear sesión
                session['usuario'] = usuario
                session['rol'] = USUARIOS_TEMPORALES[usuario]['rol']
                
                # Redirigir según el rol
                rol = USUARIOS_TEMPORALES[usuario]['rol']
                if rol == 'admin':
                    return redirect(url_for('admin_dashboard'))
                elif rol == 'punto_venta':
                    return redirect(url_for('pos'))
                elif rol == 'recargas':
                    return redirect(url_for('recargas'))
                else:
                    return redirect(url_for('index'))
            else:
                flash('Contraseña incorrecta', 'error')
        else:
            flash('Usuario no encontrado', 'error')
    
    return render_template('login.html')

@auth_bp.route('logout')
def logout():
    """
    Cerrar sesión del usuario
    
    Limpia la sesión y redirige al login
    """
    session.clear()
    flash('Sesión cerrada correctamente', 'info')
    return redirect(url_for('auth.login'))

# ============================================
# FUNCIONES AUXILIARES DE AUTENTICACIÓN
# ============================================

def requiere_autenticacion():
    """
    Verifica si el usuario está autenticado
    
    Returns:
        bool: True si está autenticado, False en caso contrario
    """
    return 'usuario' in session

def obtener_rol_usuario():
    """
    Obtiene el rol del usuario actual desde la sesión
    
    Returns:
        str: Rol del usuario ('admin', 'venta', 'recarga') o None si no hay sesión
    """
    return session.get('rol', None)

def obtener_usuario_actual():
    """
    Obtiene el nombre de usuario actual desde la sesión
    
    Returns:
        str: Nombre de usuario o None si no hay sesión
    """
    return session.get('usuario', None)

# ============================================
# VALIDACIÓN DE ROLES (PREPARADO PARA FUTURA IMPLEMENTACIÓN)
# ============================================

def requiere_rol(rol_requerido):
    """
    Verifica si el usuario tiene el rol requerido
    
    Args:
        rol_requerido (str): Rol requerido ('admin', 'venta', 'recarga')
    
    Returns:
        bool: True si tiene el rol, False en caso contrario
    
    TODO: Implementar validación de permisos por rol
    TODO: Los roles 'admin' pueden acceder a todo
    TODO: Los roles 'venta' solo pueden procesar pagos
    TODO: Los roles 'recarga' solo pueden recargar saldo
    """
    rol_actual = obtener_rol_usuario()
    
    if rol_actual == 'admin':
        return True  # Admin tiene acceso a todo
    
    return rol_actual == rol_requerido

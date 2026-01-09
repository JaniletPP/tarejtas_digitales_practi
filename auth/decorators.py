"""
Decoradores para control de acceso por roles
"""
from functools import wraps
from flask import redirect, url_for, session, flash
from auth.auth_routes import obtener_rol_usuario, requiere_autenticacion

def requiere_rol(rol_requerido):
    """
    Decorador para proteger rutas según el rol del usuario
    
    Args:
        rol_requerido (str): Rol requerido ('admin', 'punto_venta', 'recargas')
    
    Usage:
        @app.route('/admin/dashboard')
        @requiere_rol('admin')
        def admin_dashboard():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Verificar autenticación
            if not requiere_autenticacion():
                flash('Debes iniciar sesión para acceder a esta página', 'error')
                return redirect(url_for('auth.login'))
            
            # Verificar rol
            rol_actual = obtener_rol_usuario()
            
            # Admin tiene acceso a todo
            if rol_actual == 'admin':
                return f(*args, **kwargs)
            
            # Verificar si el rol coincide exactamente
            if rol_actual != rol_requerido:
                flash('No tienes permisos para acceder a esta página', 'error')
                # Redirigir según el rol actual
                if rol_actual == 'punto_venta':
                    return redirect(url_for('pos'))
                elif rol_actual == 'recargas':
                    return redirect(url_for('recargas'))
                else:
                    return redirect(url_for('auth.login'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def solo_admin(f):
    """
    Decorador para rutas exclusivas de administrador
    
    Usage:
        @app.route('/admin/config')
        @solo_admin
        def admin_config():
            ...
    """
    return requiere_rol('admin')(f)

def solo_punto_venta(f):
    """
    Decorador para rutas exclusivas de punto de venta
    
    Usage:
        @app.route('/pos')
        @solo_punto_venta
        def pos():
            ...
    """
    return requiere_rol('punto_venta')(f)

def solo_recargas(f):
    """
    Decorador para rutas exclusivas de recargas
    
    Usage:
        @app.route('/recargas')
        @solo_recargas
        def recargas():
            ...
    """
    return requiere_rol('recargas')(f)

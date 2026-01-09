"""
Módulo de autenticación
"""
from flask import Blueprint

auth_bp = Blueprint('auth', __name__, url_prefix='/')

# Importar rutas después de crear el blueprint para evitar import circular
from auth.auth_routes import *
from auth.decorators import requiere_rol, solo_admin, solo_punto_venta, solo_recargas

__all__ = ['auth_bp', 'requiere_rol', 'solo_admin', 'solo_punto_venta', 'solo_recargas']

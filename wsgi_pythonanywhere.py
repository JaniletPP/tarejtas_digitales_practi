"""
Archivo WSGI para PythonAnywhere
Copia este contenido al archivo WSGI de PythonAnywhere
"""
import sys
import os

# Agregar el directorio del proyecto al path
# REEMPLAZA 'tuusuario' con tu username de PythonAnywhere
path = '/home/tuusuario/tarejetas-inteligentes'
if path not in sys.path:
    sys.path.insert(0, path)

# Cambiar al directorio del proyecto
os.chdir(path)

# Importar la aplicación
from app import app as application

# Configurar variables de entorno si no están configuradas
# PythonAnywhere las puede configurar desde la interfaz web también
if not os.environ.get('MYSQL_HOST'):
    # Estas variables se pueden configurar en la interfaz web de PythonAnywhere
    # en la sección "Web" -> "Environment variables"
    pass

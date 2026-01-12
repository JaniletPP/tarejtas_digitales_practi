"""
Configuración de la aplicación Flask y conexión a MySQL
"""
import os
from dotenv import load_dotenv

# Cargar variables de entorno desde archivo .env (opcional)
load_dotenv()

class Config:
    """Configuración de la aplicación"""
    
    # Configuración de Flask
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'clave-secreta-para-desarrollo-cambiar-en-produccion'
    
    # Configuración de MySQL
    # Soporta tanto MYSQL_* como DATABASE_* para compatibilidad
    MYSQL_HOST = os.environ.get('MYSQL_HOST') or os.environ.get('DATABASE_HOST') or 'localhost'
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT') or os.environ.get('DATABASE_PORT') or 3306)
    MYSQL_USER = os.environ.get('MYSQL_USER') or os.environ.get('DATABASE_USER') or 'root'
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD') or os.environ.get('DATABASE_PASSWORD') or ''
    MYSQL_DATABASE = os.environ.get('MYSQL_DATABASE') or os.environ.get('DATABASE_NAME') or 'tarjetas_evento'
    
    # Configuración de la aplicación
    DEBUG = os.environ.get('FLASK_DEBUG', os.environ.get('DEBUG', 'False')).lower() == 'true'
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
    
    # Configuración de archivos
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads', 'fotos_perfil')
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB máximo
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    
    # Crear directorio de uploads si no existe
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
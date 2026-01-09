"""
Módulo para manejo de conexión a la base de datos MySQL
"""
import mysql.connector
from mysql.connector import Error
from config import Config

def get_db_connection():
    """
    Crea y retorna una conexión a la base de datos MySQL
    
    Returns:
        mysql.connector.connection: Conexión a la base de datos
    """
    try:
        connection = mysql.connector.connect(
            host=Config.MYSQL_HOST,
            port=Config.MYSQL_PORT,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            database=Config.MYSQL_DATABASE
        )
        return connection
    except Error as e:
        print(f"Error al conectar a MySQL: {e}")
        raise

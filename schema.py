"""
Archivo para crear el esquema de la base de datos (Paso 2)
Este archivo contiene todas las funciones para crear tablas y datos iniciales
"""
import mysql.connector
from mysql.connector import Error
from config import Config
from database import get_db_connection

def init_database():
    """
    Inicializa la base de datos creando todas las tablas necesarias.
    Esta función:
    1. Crea la base de datos si no existe
    2. Crea todas las tablas (asistentes, tarjetas, puntos_venta, transacciones)
    3. Inserta los puntos de venta por defecto
    """
    connection = None
    try:
        # Paso 1: Conectar sin especificar base de datos para crearla si no existe
        temp_connection = mysql.connector.connect(
            host=Config.MYSQL_HOST,
            port=Config.MYSQL_PORT,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD
        )
        cursor = temp_connection.cursor()
        
        # Crear base de datos si no existe
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {Config.MYSQL_DATABASE}")
        cursor.close()
        temp_connection.close()
        
        # Paso 2: Conectar a la base de datos específica
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # Paso 3: Crear tabla de asistentes
        # Almacena información de cada asistente al evento
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS asistentes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE,
                telefono VARCHAR(20),
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                activo BOOLEAN DEFAULT TRUE
            )
        """)
        
        # Paso 4: Crear tabla de tarjetas
        # Cada tarjeta está vinculada a un asistente y tiene un saldo
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tarjetas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                asistente_id INT NOT NULL,
                numero_tarjeta VARCHAR(20) UNIQUE NOT NULL,
                saldo DECIMAL(10, 2) DEFAULT 0.00,
                fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                activa BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (asistente_id) REFERENCES asistentes(id) ON DELETE CASCADE
            )
        """)
        
        # Paso 5: Crear tabla de puntos de venta
        # Restaurante, cafetería, tienda, etc.
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS puntos_venta (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                activo BOOLEAN DEFAULT TRUE
            )
        """)
        
        # Paso 6: Crear tabla de productos
        # Productos disponibles en los puntos de venta
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS productos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                precio DECIMAL(10, 2) NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                punto_venta_id INT,
                descripcion TEXT,
                imagen_url VARCHAR(500),
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (punto_venta_id) REFERENCES puntos_venta(id) ON DELETE SET NULL
            )
        """)
        
        # Agregar columna imagen_url si no existe (para bases de datos existentes)
        try:
            cursor.execute("ALTER TABLE productos ADD COLUMN imagen_url VARCHAR(500) AFTER descripcion")
        except Error:
            pass  # La columna ya existe
        
        # Paso 7: Crear tabla de transacciones
        # Registra todas las operaciones: recargas y pagos
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transacciones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tarjeta_id INT NOT NULL,
                punto_venta_id INT,
                tipo ENUM('recarga', 'pago') NOT NULL,
                monto DECIMAL(10, 2) NOT NULL,
                saldo_anterior DECIMAL(10, 2) NOT NULL,
                saldo_nuevo DECIMAL(10, 2) NOT NULL,
                fecha_transaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                descripcion TEXT,
                FOREIGN KEY (tarjeta_id) REFERENCES tarjetas(id) ON DELETE CASCADE,
                FOREIGN KEY (punto_venta_id) REFERENCES puntos_venta(id) ON DELETE SET NULL
            )
        """)
        
        # Paso 8: Insertar puntos de venta por defecto si no existen
        cursor.execute("SELECT COUNT(*) FROM puntos_venta")
        if cursor.fetchone()[0] == 0:
            puntos_venta_default = [
                ('Restaurante Principal', 'restaurante'),
                ('Cafetería', 'cafeteria'),
                ('Tienda de Souvenirs', 'souvenirs'),
                ('Estacionamiento', 'estacionamiento'),
                ('Bar', 'bar')
            ]
            cursor.executemany("""
                INSERT INTO puntos_venta (nombre, tipo) VALUES (%s, %s)
            """, puntos_venta_default)
        
        # Paso 9: Crear tabla de usuarios (para perfiles de administradores)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                rol ENUM('admin', 'punto_venta', 'recargas') NOT NULL,
                nombre_completo VARCHAR(100),
                email VARCHAR(100),
                telefono VARCHAR(20),
                foto_perfil VARCHAR(500),
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                activo BOOLEAN DEFAULT TRUE
            )
        """)
        
        # Insertar usuarios por defecto si no existen
        cursor.execute("SELECT COUNT(*) FROM usuarios")
        if cursor.fetchone()[0] == 0:
            usuarios_default = [
                ('admin', 'admin123', 'admin', 'Administrador Principal', 'admin@evento.com', None, None),
                ('punto_venta', 'venta123', 'punto_venta', 'Usuario Punto de Venta', 'venta@evento.com', None, None),
                ('recargas', 'recarga123', 'recargas', 'Usuario Recargas', 'recargas@evento.com', None, None),
            ]
            cursor.executemany("""
                INSERT INTO usuarios (usuario, password, rol, nombre_completo, email, telefono, foto_perfil) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, usuarios_default)
        
        # Paso 10: Insertar productos por defecto si no existen
        cursor.execute("SELECT COUNT(*) FROM productos")
        if cursor.fetchone()[0] == 0:
            productos_default = [
                # Restaurante
                ('Hamburguesa', 80.00, 'restaurante', 1, 'Hamburguesa completa'),
                ('Hot Dog', 50.00, 'restaurante', 1, 'Hot dog con papas'),
                ('Pizza', 120.00, 'restaurante', 1, 'Pizza mediana'),
                # Cafetería
                ('Café', 30.00, 'cafeteria', 2, 'Café americano'),
                ('Café con leche', 35.00, 'cafeteria', 2, 'Café con leche'),
                ('Té', 25.00, 'cafeteria', 2, 'Té de hierbas'),
                # Bebidas
                ('Agua', 15.00, 'bebida', 1, 'Agua embotellada'),
                ('Refresco', 25.00, 'bebida', 1, 'Refresco 500ml'),
                ('Jugo', 30.00, 'bebida', 1, 'Jugo natural'),
                # Comida
                ('Tacos', 40.00, 'comida', 1, 'Orden de 3 tacos'),
                ('Quesadillas', 45.00, 'comida', 1, 'Quesadillas de queso'),
                # Postres
                ('Postre', 45.00, 'postre', 1, 'Postre del día'),
                ('Helado', 35.00, 'postre', 1, 'Helado de vainilla'),
                # Ropa
                ('Playera', 150.00, 'ropa', 3, 'Playera del evento'),
                ('Gorra', 80.00, 'ropa', 3, 'Gorra con logo'),
                # Souvenirs
                ('Llavero', 25.00, 'souvenir', 3, 'Llavero conmemorativo'),
                ('Taza', 60.00, 'souvenir', 3, 'Taza del evento'),
            ]
            cursor.executemany("""
                INSERT INTO productos (nombre, precio, tipo, punto_venta_id, descripcion) 
                VALUES (%s, %s, %s, %s, %s)
            """, productos_default)
        
        connection.commit()
        print("[OK] Base de datos inicializada correctamente")
        print("[OK] Tablas creadas: usuarios, asistentes, tarjetas, puntos_venta, productos, transacciones")
        print("[OK] Usuarios por defecto insertados")
        print("[OK] Puntos de venta por defecto insertados")
        print("[OK] Productos por defecto insertados")
        
    except Error as e:
        print(f"[ERROR] Error al inicializar la base de datos: {e}")
        if connection:
            connection.rollback()
        raise
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

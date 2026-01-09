"""
Modelos de datos para interactuar con la base de datos MySQL
Cada clase contiene métodos estáticos para realizar operaciones CRUD
"""
from database import get_db_connection
from mysql.connector import Error

class Asistente:
    """Modelo para manejar asistentes al evento"""
    
    @staticmethod
    def crear(nombre, email=None, telefono=None):
        """
        Crea un nuevo asistente en la base de datos
        
        Args:
            nombre (str): Nombre completo del asistente
            email (str, optional): Email del asistente
            telefono (str, optional): Teléfono del asistente
            
        Returns:
            int: ID del asistente creado
        """
        connection = get_db_connection()
        cursor = connection.cursor()
        try:
            cursor.execute("""
                INSERT INTO asistentes (nombre, email, telefono)
                VALUES (%s, %s, %s)
            """, (nombre, email, telefono))
            connection.commit()
            asistente_id = cursor.lastrowid
            return asistente_id
        except Error as e:
            connection.rollback()
            raise e
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def obtener_por_id(asistente_id):
        """
        Obtiene un asistente por su ID
        
        Args:
            asistente_id (int): ID del asistente
            
        Returns:
            dict: Datos del asistente o None si no existe
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM asistentes WHERE id = %s", (asistente_id,))
            return cursor.fetchone()
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def listar_todos():
        """
        Lista todos los asistentes activos
        
        Returns:
            list: Lista de diccionarios con los datos de los asistentes
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM asistentes WHERE activo = TRUE ORDER BY nombre")
            return cursor.fetchall()
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def listar_sin_tarjeta():
        """
        Lista todos los asistentes activos que NO tienen tarjeta asignada
        
        Returns:
            list: Lista de diccionarios con los datos de los asistentes sin tarjeta
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT a.* 
                FROM asistentes a
                LEFT JOIN tarjetas t ON a.id = t.asistente_id AND t.activa = TRUE
                WHERE a.activo = TRUE AND t.id IS NULL
                ORDER BY a.nombre
            """)
            return cursor.fetchall()
        finally:
            cursor.close()
            connection.close()

class Tarjeta:
    """Modelo para manejar tarjetas inteligentes"""
    
    @staticmethod
    def generar_numero():
        """
        Genera un número único de tarjeta con formato TARJ-XXXXXX
        
        Returns:
            str: Número de tarjeta generado
        """
        import random
        return f"TARJ-{random.randint(100000, 999999)}"
    
    @staticmethod
    def asignar(asistente_id):
        """
        Asigna una nueva tarjeta a un asistente
        
        Args:
            asistente_id (int): ID del asistente
            
        Returns:
            tuple: (tarjeta_id, numero_tarjeta)
            
        Raises:
            ValueError: Si el asistente ya tiene una tarjeta activa
        """
        connection = get_db_connection()
        cursor = connection.cursor()
        try:
            # Verificar si el asistente ya tiene una tarjeta activa
            cursor.execute("""
                SELECT id FROM tarjetas 
                WHERE asistente_id = %s AND activa = TRUE
            """, (asistente_id,))
            if cursor.fetchone():
                raise ValueError("El asistente ya tiene una tarjeta activa")
            
            # Generar número único de tarjeta
            numero_tarjeta = Tarjeta.generar_numero()
            while Tarjeta.verificar_numero_existe(numero_tarjeta):
                numero_tarjeta = Tarjeta.generar_numero()
            
            # Crear la tarjeta con saldo inicial 0
            cursor.execute("""
                INSERT INTO tarjetas (asistente_id, numero_tarjeta, saldo)
                VALUES (%s, %s, 0.00)
            """, (asistente_id, numero_tarjeta))
            connection.commit()
            tarjeta_id = cursor.lastrowid
            return tarjeta_id, numero_tarjeta
        except Error as e:
            connection.rollback()
            raise e
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def verificar_numero_existe(numero_tarjeta):
        """
        Verifica si un número de tarjeta ya existe en la base de datos
        
        Args:
            numero_tarjeta (str): Número de tarjeta a verificar
            
        Returns:
            bool: True si existe, False si no
        """
        connection = get_db_connection()
        cursor = connection.cursor()
        try:
            cursor.execute("SELECT id FROM tarjetas WHERE numero_tarjeta = %s", (numero_tarjeta,))
            return cursor.fetchone() is not None
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def obtener_por_numero(numero_tarjeta):
        """
        Obtiene una tarjeta por su número (incluye nombre del asistente)
        
        Args:
            numero_tarjeta (str): Número de la tarjeta
            
        Returns:
            dict: Datos de la tarjeta con información del asistente o None
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT t.*, a.nombre as asistente_nombre 
                FROM tarjetas t
                JOIN asistentes a ON t.asistente_id = a.id
                WHERE t.numero_tarjeta = %s AND t.activa = TRUE
            """, (numero_tarjeta,))
            return cursor.fetchone()
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def verificar_estado(numero_tarjeta):
        """
        Verifica el estado de una tarjeta (si existe y si está asignada)
        
        Args:
            numero_tarjeta (str): Número de la tarjeta
            
        Returns:
            dict: Información del estado de la tarjeta con:
                - existe: bool
                - activa: bool (si existe)
                - asignada: bool (si está asignada a un asistente)
                - asistente_nombre: str (si está asignada)
                - asistente_id: int (si está asignada)
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT t.*, a.nombre as asistente_nombre, a.id as asistente_id
                FROM tarjetas t
                LEFT JOIN asistentes a ON t.asistente_id = a.id
                WHERE t.numero_tarjeta = %s
            """, (numero_tarjeta,))
            tarjeta = cursor.fetchone()
            
            if not tarjeta:
                return {
                    'existe': False,
                    'activa': False,
                    'asignada': False,
                    'asistente_nombre': None,
                    'asistente_id': None
                }
            
            return {
                'existe': True,
                'activa': bool(tarjeta.get('activa')),
                'asignada': tarjeta.get('asistente_id') is not None,
                'asistente_nombre': tarjeta.get('asistente_nombre'),
                'asistente_id': tarjeta.get('asistente_id')
            }
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def obtener_por_id(tarjeta_id):
        """
        Obtiene una tarjeta por su ID
        
        Args:
            tarjeta_id (int): ID de la tarjeta
            
        Returns:
            dict: Datos de la tarjeta con información del asistente o None
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT t.*, a.nombre as asistente_nombre 
                FROM tarjetas t
                JOIN asistentes a ON t.asistente_id = a.id
                WHERE t.id = %s
            """, (tarjeta_id,))
            return cursor.fetchone()
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def actualizar_saldo(tarjeta_id, nuevo_saldo):
        """
        Actualiza el saldo de una tarjeta
        
        Args:
            tarjeta_id (int): ID de la tarjeta
            nuevo_saldo (float): Nuevo saldo a asignar
        """
        connection = get_db_connection()
        cursor = connection.cursor()
        try:
            cursor.execute("""
                UPDATE tarjetas SET saldo = %s WHERE id = %s
            """, (nuevo_saldo, tarjeta_id))
            connection.commit()
        except Error as e:
            connection.rollback()
            raise e
        finally:
            cursor.close()
            connection.close()

class Transaccion:
    """Modelo para manejar transacciones (recargas y pagos)"""
    
    @staticmethod
    def crear(tarjeta_id, tipo, monto, saldo_anterior, saldo_nuevo, punto_venta_id=None, descripcion=None):
        """
        Crea una nueva transacción en el historial
        
        Args:
            tarjeta_id (int): ID de la tarjeta
            tipo (str): 'recarga' o 'pago'
            monto (float): Monto de la transacción
            saldo_anterior (float): Saldo antes de la transacción
            saldo_nuevo (float): Saldo después de la transacción
            punto_venta_id (int, optional): ID del punto de venta (solo para pagos)
            descripcion (str, optional): Descripción adicional
            
        Returns:
            int: ID de la transacción creada
        """
        connection = get_db_connection()
        cursor = connection.cursor()
        try:
            cursor.execute("""
                INSERT INTO transacciones 
                (tarjeta_id, punto_venta_id, tipo, monto, saldo_anterior, saldo_nuevo, descripcion)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (tarjeta_id, punto_venta_id, tipo, monto, saldo_anterior, saldo_nuevo, descripcion))
            connection.commit()
            return cursor.lastrowid
        except Error as e:
            connection.rollback()
            raise e
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def obtener_por_tarjeta(numero_tarjeta):
        """
        Obtiene todas las transacciones de una tarjeta ordenadas por fecha
        
        Args:
            numero_tarjeta (str): Número de la tarjeta
            
        Returns:
            list: Lista de diccionarios con las transacciones
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT t.*, pv.nombre as punto_venta_nombre
                FROM transacciones t
                LEFT JOIN puntos_venta pv ON t.punto_venta_id = pv.id
                JOIN tarjetas tar ON t.tarjeta_id = tar.id
                WHERE tar.numero_tarjeta = %s
                ORDER BY t.fecha_transaccion DESC
            """, (numero_tarjeta,))
            return cursor.fetchall()
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def obtener_ventas(fecha_inicio=None, fecha_fin=None, punto_venta_id=None):
        """
        Obtiene todas las transacciones de tipo 'pago' (ventas) con información completa
        
        Args:
            fecha_inicio (str, optional): Fecha de inicio (YYYY-MM-DD)
            fecha_fin (str, optional): Fecha de fin (YYYY-MM-DD)
            punto_venta_id (int, optional): ID del punto de venta para filtrar
            
        Returns:
            list: Lista de diccionarios con las ventas
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            query = """
                SELECT 
                    t.id,
                    t.fecha_transaccion,
                    t.monto,
                    t.descripcion,
                    t.saldo_anterior,
                    t.saldo_nuevo,
                    tar.numero_tarjeta,
                    a.nombre as asistente_nombre,
                    a.id as asistente_id,
                    pv.id as punto_venta_id,
                    pv.nombre as punto_venta_nombre
                FROM transacciones t
                JOIN tarjetas tar ON t.tarjeta_id = tar.id
                JOIN asistentes a ON tar.asistente_id = a.id
                LEFT JOIN puntos_venta pv ON t.punto_venta_id = pv.id
                WHERE t.tipo = 'pago'
            """
            params = []
            
            if fecha_inicio:
                query += " AND DATE(t.fecha_transaccion) >= %s"
                params.append(fecha_inicio)
            
            if fecha_fin:
                query += " AND DATE(t.fecha_transaccion) <= %s"
                params.append(fecha_fin)
            
            if punto_venta_id:
                query += " AND t.punto_venta_id = %s"
                params.append(punto_venta_id)
            
            query += " ORDER BY t.fecha_transaccion DESC"
            
            cursor.execute(query, tuple(params))
            return cursor.fetchall()
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def obtener_todas_transacciones(fecha_inicio=None, fecha_fin=None, tipo=None, punto_venta_id=None):
        """
        Obtiene todas las transacciones (recargas y pagos) con información completa
        
        Args:
            fecha_inicio (str, optional): Fecha de inicio (YYYY-MM-DD)
            fecha_fin (str, optional): Fecha de fin (YYYY-MM-DD)
            tipo (str, optional): 'recarga' o 'pago' para filtrar
            punto_venta_id (int, optional): ID del punto de venta para filtrar
            
        Returns:
            list: Lista de diccionarios con las transacciones
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            query = """
                SELECT 
                    t.id,
                    t.fecha_transaccion,
                    t.tipo,
                    t.monto,
                    t.descripcion,
                    t.saldo_anterior,
                    t.saldo_nuevo,
                    tar.numero_tarjeta,
                    a.nombre as asistente_nombre,
                    a.id as asistente_id,
                    pv.id as punto_venta_id,
                    pv.nombre as punto_venta_nombre
                FROM transacciones t
                JOIN tarjetas tar ON t.tarjeta_id = tar.id
                JOIN asistentes a ON tar.asistente_id = a.id
                LEFT JOIN puntos_venta pv ON t.punto_venta_id = pv.id
                WHERE 1=1
            """
            params = []
            
            if fecha_inicio:
                query += " AND DATE(t.fecha_transaccion) >= %s"
                params.append(fecha_inicio)
            
            if fecha_fin:
                query += " AND DATE(t.fecha_transaccion) <= %s"
                params.append(fecha_fin)
            
            if tipo:
                query += " AND t.tipo = %s"
                params.append(tipo)
            
            if punto_venta_id:
                query += " AND t.punto_venta_id = %s"
                params.append(punto_venta_id)
            
            query += " ORDER BY t.fecha_transaccion DESC"
            
            cursor.execute(query, tuple(params))
            return cursor.fetchall()
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def obtener_resumen_ventas(fecha_inicio=None, fecha_fin=None, punto_venta_id=None):
        """
        Obtiene resumen de ventas por punto de venta y productos más vendidos
        
        Args:
            fecha_inicio (str, optional): Fecha de inicio (YYYY-MM-DD)
            fecha_fin (str, optional): Fecha de fin (YYYY-MM-DD)
            punto_venta_id (int, optional): ID del punto de venta para filtrar
            
        Returns:
            dict: Resumen con totales y estadísticas
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            # Totales generales
            query_total = """
                SELECT 
                    COUNT(*) as total_ventas,
                    SUM(t.monto) as total_monto,
                    AVG(t.monto) as promedio_venta
                FROM transacciones t
                WHERE t.tipo = 'pago'
            """
            params_total = []
            
            if fecha_inicio:
                query_total += " AND DATE(t.fecha_transaccion) >= %s"
                params_total.append(fecha_inicio)
            
            if fecha_fin:
                query_total += " AND DATE(t.fecha_transaccion) <= %s"
                params_total.append(fecha_fin)
            
            if punto_venta_id:
                query_total += " AND t.punto_venta_id = %s"
                params_total.append(punto_venta_id)
            
            cursor.execute(query_total, tuple(params_total))
            totales = cursor.fetchone()
            
            # Ventas por punto de venta
            query_pv = """
                SELECT 
                    pv.id,
                    pv.nombre,
                    COUNT(*) as total_ventas,
                    SUM(t.monto) as total_monto
                FROM transacciones t
                LEFT JOIN puntos_venta pv ON t.punto_venta_id = pv.id
                WHERE t.tipo = 'pago'
            """
            params_pv = []
            
            if fecha_inicio:
                query_pv += " AND DATE(t.fecha_transaccion) >= %s"
                params_pv.append(fecha_inicio)
            
            if fecha_fin:
                query_pv += " AND DATE(t.fecha_transaccion) <= %s"
                params_pv.append(fecha_fin)
            
            if punto_venta_id:
                query_pv += " AND t.punto_venta_id = %s"
                params_pv.append(punto_venta_id)
            
            query_pv += " GROUP BY pv.id, pv.nombre ORDER BY total_monto DESC"
            
            cursor.execute(query_pv, tuple(params_pv))
            ventas_por_pv = cursor.fetchall()
            
            return {
                'totales': totales,
                'ventas_por_punto_venta': ventas_por_pv
            }
        finally:
            cursor.close()
            connection.close()

class PuntoVenta:
    """Modelo para manejar puntos de venta"""
    
    @staticmethod
    def listar_todos():
        """
        Lista todos los puntos de venta activos
        
        Returns:
            list: Lista de diccionarios con los puntos de venta
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM puntos_venta WHERE activo = TRUE ORDER BY nombre")
            return cursor.fetchall()
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def obtener_por_id(punto_venta_id):
        """
        Obtiene un punto de venta por su ID
        
        Args:
            punto_venta_id (int): ID del punto de venta
            
        Returns:
            dict: Datos del punto de venta o None
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM puntos_venta WHERE id = %s", (punto_venta_id,))
            return cursor.fetchone()
        finally:
            cursor.close()
            connection.close()

class Producto:
    """Modelo para manejar productos"""
    
    @staticmethod
    def listar_todos():
        """
        Lista todos los productos activos
        
        Returns:
            list: Lista de diccionarios con los productos
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT p.*, pv.nombre as punto_venta_nombre 
                FROM productos p
                LEFT JOIN puntos_venta pv ON p.punto_venta_id = pv.id
                WHERE p.activo = TRUE 
                ORDER BY p.tipo, p.nombre
            """)
            return cursor.fetchall()
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def listar_por_tipo(tipo):
        """
        Lista productos filtrados por tipo
        
        Args:
            tipo (str): Tipo de producto (bebida, comida, postre, etc.)
            
        Returns:
            list: Lista de productos del tipo especificado
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT p.*, pv.nombre as punto_venta_nombre 
                FROM productos p
                LEFT JOIN puntos_venta pv ON p.punto_venta_id = pv.id
                WHERE p.activo = TRUE AND p.tipo = %s
                ORDER BY p.nombre
            """, (tipo,))
            return cursor.fetchall()
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def obtener_tipos():
        """
        Obtiene la lista de tipos únicos de productos
        
        Returns:
            list: Lista de tipos de productos
        """
        connection = get_db_connection()
        cursor = connection.cursor()
        try:
            cursor.execute("SELECT DISTINCT tipo FROM productos WHERE activo = TRUE ORDER BY tipo")
            return [row[0] for row in cursor.fetchall()]
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def crear(nombre, precio, tipo, punto_venta_id=None, descripcion=None, imagen_url=None):
        """
        Crea un nuevo producto
        
        Args:
            nombre (str): Nombre del producto
            precio (float): Precio del producto
            tipo (str): Tipo/categoría del producto
            punto_venta_id (int, optional): ID del punto de venta
            descripcion (str, optional): Descripción del producto
            imagen_url (str, optional): URL de la imagen del producto
            
        Returns:
            dict: Datos del producto creado
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("""
                INSERT INTO productos (nombre, precio, tipo, punto_venta_id, descripcion, imagen_url)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (nombre, precio, tipo, punto_venta_id, descripcion, imagen_url))
            connection.commit()
            producto_id = cursor.lastrowid
            cursor.execute("SELECT * FROM productos WHERE id = %s", (producto_id,))
            return cursor.fetchone()
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def obtener_por_id(producto_id):
        """
        Obtiene un producto por su ID
        
        Args:
            producto_id (int): ID del producto
            
        Returns:
            dict: Datos del producto o None
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM productos WHERE id = %s", (producto_id,))
            return cursor.fetchone()
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def actualizar(producto_id, nombre=None, precio=None, tipo=None, punto_venta_id=None, descripcion=None, imagen_url=None, activo=None):
        """
        Actualiza un producto existente
        
        Args:
            producto_id (int): ID del producto
            nombre (str, optional): Nuevo nombre
            precio (float, optional): Nuevo precio
            tipo (str, optional): Nuevo tipo
            punto_venta_id (int, optional): Nuevo punto de venta
            descripcion (str, optional): Nueva descripción
            imagen_url (str, optional): Nueva URL de imagen
            activo (bool, optional): Estado activo/inactivo
            
        Returns:
            dict: Datos del producto actualizado
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            updates = []
            values = []
            
            if nombre is not None:
                updates.append("nombre = %s")
                values.append(nombre)
            if precio is not None:
                updates.append("precio = %s")
                values.append(precio)
            if tipo is not None:
                updates.append("tipo = %s")
                values.append(tipo)
            if punto_venta_id is not None:
                updates.append("punto_venta_id = %s")
                values.append(punto_venta_id)
            if descripcion is not None:
                updates.append("descripcion = %s")
                values.append(descripcion)
            if imagen_url is not None:
                updates.append("imagen_url = %s")
                values.append(imagen_url)
            if activo is not None:
                updates.append("activo = %s")
                values.append(activo)
            
            if not updates:
                return Producto.obtener_por_id(producto_id)
            
            values.append(producto_id)
            query = f"UPDATE productos SET {', '.join(updates)} WHERE id = %s"
            cursor.execute(query, values)
            connection.commit()
            return Producto.obtener_por_id(producto_id)
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def eliminar(producto_id):
        """
        Elimina (desactiva) un producto
        
        Args:
            producto_id (int): ID del producto
            
        Returns:
            bool: True si se eliminó correctamente
        """
        return Producto.actualizar(producto_id, activo=False)

class Usuario:
    """Modelo para manejar usuarios del sistema (administradores, punto de venta, recargas)"""
    
    @staticmethod
    def obtener_por_usuario(usuario):
        """
        Obtiene un usuario por su nombre de usuario
        
        Args:
            usuario (str): Nombre de usuario
            
        Returns:
            dict: Datos del usuario o None si no existe
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM usuarios WHERE usuario = %s AND activo = TRUE", (usuario,))
            return cursor.fetchone()
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def obtener_por_id(usuario_id):
        """
        Obtiene un usuario por su ID
        
        Args:
            usuario_id (int): ID del usuario
            
        Returns:
            dict: Datos del usuario o None si no existe
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM usuarios WHERE id = %s AND activo = TRUE", (usuario_id,))
            return cursor.fetchone()
        finally:
            cursor.close()
            connection.close()
    
    @staticmethod
    def actualizar_perfil(usuario, nombre_completo=None, email=None, telefono=None, foto_perfil=None):
        """
        Actualiza el perfil de un usuario
        
        Args:
            usuario (str): Nombre de usuario
            nombre_completo (str, optional): Nombre completo
            email (str, optional): Email
            telefono (str, optional): Teléfono
            foto_perfil (str, optional): Ruta de la foto de perfil
            
        Returns:
            dict: Datos del usuario actualizado
        """
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            updates = []
            values = []
            
            if nombre_completo is not None:
                updates.append("nombre_completo = %s")
                values.append(nombre_completo)
            if email is not None:
                updates.append("email = %s")
                values.append(email)
            if telefono is not None:
                updates.append("telefono = %s")
                values.append(telefono)
            if foto_perfil is not None:
                updates.append("foto_perfil = %s")
                values.append(foto_perfil)
            
            if not updates:
                # Si no hay actualizaciones, solo devolver el usuario actual
                return Usuario.obtener_por_usuario(usuario)
            
            values.append(usuario)
            cursor.execute(f"""
                UPDATE usuarios 
                SET {', '.join(updates)}
                WHERE usuario = %s
            """, values)
            connection.commit()
            
            return Usuario.obtener_por_usuario(usuario)
        except Error as e:
            connection.rollback()
            raise e
        finally:
            cursor.close()
            connection.close()
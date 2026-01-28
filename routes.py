"""
Rutas y lógica de negocio del sistema de tarjetas inteligentes
"""
from flask import request, jsonify, render_template, session
from models import Asistente, Tarjeta, Transaccion, PuntoVenta, Producto, Usuario
from database import get_db_connection
import os
from werkzeug.utils import secure_filename

def registrar_asistente():
    """
    Registra un nuevo asistente en el sistema
    
    Endpoint: POST /api/asistentes
    Body: {
        "nombre": "string",
        "email": "string (opcional)",
        "telefono": "string (opcional)"
    }
    """
    try:
        data = request.get_json() or request.form
        
        # Validar que el nombre esté presente
        if not data.get('nombre'):
            return jsonify({
                'success': False,
                'error': 'El nombre es obligatorio'
            }), 400
        
        # Crear el asistente
        asistente_id = Asistente.crear(
            nombre=data.get('nombre'),
            email=data.get('email'),
            telefono=data.get('telefono')
        )
        
        # Obtener los datos del asistente creado
        asistente = Asistente.obtener_por_id(asistente_id)
        
        return jsonify({
            'success': True,
            'message': 'Asistente registrado correctamente',
            'data': asistente
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def asignar_tarjeta():
    """
    Asigna una tarjeta inteligente a un asistente
    
    Endpoint: POST /api/tarjetas/asignar
    Body: {
        "asistente_id": int (obligatorio),
        "numero_tarjeta": str (opcional - si no se proporciona, se genera automáticamente)
    }
    """
    try:
        data = request.get_json() or request.form
        
        # Validar que el asistente_id esté presente
        asistente_id = data.get('asistente_id')
        if not asistente_id:
            return jsonify({
                'success': False,
                'error': 'El ID del asistente es obligatorio'
            }), 400
        
        # Verificar que el asistente existe
        asistente = Asistente.obtener_por_id(asistente_id)
        if not asistente:
            return jsonify({
                'success': False,
                'error': 'El asistente no existe'
            }), 404
        
        # Verificar si el asistente ya tiene una tarjeta activa
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT id, numero_tarjeta FROM tarjetas 
                WHERE asistente_id = %s AND activa = TRUE
            """, (asistente_id,))
            tarjeta_existente = cursor.fetchone()
            if tarjeta_existente:
                return jsonify({
                    'success': False,
                    'error': f'El asistente ya tiene una tarjeta activa: {tarjeta_existente["numero_tarjeta"]}'
                }), 400
        finally:
            cursor.close()
            connection.close()
        
        # Obtener número de tarjeta (manual o generar)
        numero_tarjeta = data.get('numero_tarjeta', '').strip().upper()
        
        # Si se proporciona número de tarjeta, validarlo
        if numero_tarjeta:
            # Verificar formato básico (TARJ-XXXXXX)
            if not numero_tarjeta.startswith('TARJ-') or len(numero_tarjeta) != 11:
                return jsonify({
                    'success': False,
                    'error': 'El formato del número de tarjeta debe ser TARJ-XXXXXX'
                }), 400
            
            # Verificar si la tarjeta ya existe
            tarjeta_existente = Tarjeta.obtener_por_numero(numero_tarjeta)
            if tarjeta_existente:
                # Verificar si la tarjeta está activa y asignada a otro asistente
                if tarjeta_existente.get('activa') and tarjeta_existente.get('asistente_id') != asistente_id:
                    return jsonify({
                        'success': False,
                        'error': f'La tarjeta {numero_tarjeta} ya está asignada a {tarjeta_existente.get("asistente_nombre", "otro asistente")}'
                    }), 400
                elif tarjeta_existente.get('activa') and tarjeta_existente.get('asistente_id') == asistente_id:
                    # La tarjeta ya está asignada a este asistente
                    return jsonify({
                        'success': False,
                        'error': f'Esta tarjeta ya está asignada a este asistente'
                    }), 400
                else:
                    # Si está inactiva, reactivarla y asignarla
                    connection = get_db_connection()
                    cursor = connection.cursor(dictionary=True)
                    try:
                        cursor.execute("""
                            UPDATE tarjetas 
                            SET asistente_id = %s, activa = TRUE, saldo = 0.00
                            WHERE numero_tarjeta = %s
                        """, (asistente_id, numero_tarjeta))
                        connection.commit()
                        # Obtener el ID de la tarjeta actualizada
                        cursor.execute("SELECT id FROM tarjetas WHERE numero_tarjeta = %s", (numero_tarjeta,))
                        tarjeta_actualizada = cursor.fetchone()
                        tarjeta_id = tarjeta_actualizada['id']
                    finally:
                        cursor.close()
                        connection.close()
            else:
                # Crear nueva tarjeta con el número proporcionado
                connection = get_db_connection()
                cursor = connection.cursor()
                try:
                    cursor.execute("""
                        INSERT INTO tarjetas (asistente_id, numero_tarjeta, saldo)
                        VALUES (%s, %s, 0.00)
                    """, (asistente_id, numero_tarjeta))
                    connection.commit()
                    tarjeta_id = cursor.lastrowid
                finally:
                    cursor.close()
                    connection.close()
        else:
            # Generar número automáticamente (comportamiento original)
            tarjeta_id, numero_tarjeta = Tarjeta.asignar(asistente_id)
        
        # Obtener los datos completos de la tarjeta
        tarjeta = Tarjeta.obtener_por_id(tarjeta_id)
        
        return jsonify({
            'success': True,
            'message': f'Tarjeta {numero_tarjeta} asignada correctamente a {asistente["nombre"]}',
            'data': tarjeta
        }), 201
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def cargar_saldo():
    """
    Recarga saldo a una tarjeta
    
    Endpoint: POST /api/tarjetas/recargar
    Body: {
        "numero_tarjeta": "string",
        "monto": float
    }
    """
    try:
        data = request.get_json() or request.form
        
        # Validar datos
        numero_tarjeta = data.get('numero_tarjeta')
        monto = data.get('monto')
        
        if not numero_tarjeta:
            return jsonify({
                'success': False,
                'error': 'El número de tarjeta es obligatorio'
            }), 400
        
        if not monto:
            return jsonify({
                'success': False,
                'error': 'El monto es obligatorio'
            }), 400
        
        try:
            monto = float(monto)
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'El monto debe ser un número válido'
            }), 400
        
        if monto <= 0:
            return jsonify({
                'success': False,
                'error': 'El monto debe ser mayor a cero'
            }), 400
        
        # Obtener la tarjeta
        tarjeta = Tarjeta.obtener_por_numero(numero_tarjeta)
        if not tarjeta:
            return jsonify({
                'success': False,
                'error': 'Tarjeta no encontrada o inactiva'
            }), 404
        
        # Calcular nuevos saldos
        saldo_anterior = float(tarjeta['saldo'])
        saldo_nuevo = saldo_anterior + monto
        
        # Actualizar saldo en la tarjeta
        Tarjeta.actualizar_saldo(tarjeta['id'], saldo_nuevo)
        
        # Desbloquear tarjeta si el saldo es mayor a 0
        tarjeta_desbloqueada = False
        if saldo_nuevo > 0:
            from database import get_db_connection
            connection = get_db_connection()
            cursor = connection.cursor()
            try:
                cursor.execute("UPDATE tarjetas SET activa = TRUE WHERE id = %s", (tarjeta['id'],))
                connection.commit()
                tarjeta_desbloqueada = True
            except Exception as e:
                connection.rollback()
                raise e
            finally:
                cursor.close()
                connection.close()
        
        # Registrar la transacción
        Transaccion.crear(
            tarjeta_id=tarjeta['id'],
            tipo='recarga',
            monto=monto,
            saldo_anterior=saldo_anterior,
            saldo_nuevo=saldo_nuevo,
            descripcion=f'Recarga de ${monto:.2f}'
        )
        
        # Obtener tarjeta actualizada
        tarjeta_actualizada = Tarjeta.obtener_por_id(tarjeta['id'])
        
        return jsonify({
            'success': True,
            'message': f'Saldo recargado correctamente: ${monto:.2f}' + (' (Tarjeta desbloqueada)' if tarjeta_desbloqueada else ''),
            'data': {
                'tarjeta': tarjeta_actualizada,
                'monto_recargado': monto,
                'saldo_anterior': saldo_anterior,
                'saldo_nuevo': saldo_nuevo,
                'tarjeta_desbloqueada': tarjeta_desbloqueada
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def procesar_pago():
    """
    Procesa un pago con una tarjeta en un punto de venta
    
    Endpoint: POST /api/tarjetas/pagar
    Body: {
        "numero_tarjeta": "string",
        "punto_venta_id": int,
        "monto": float,
        "descripcion": "string (opcional)"
    }
    """
    try:
        data = request.get_json() or request.form
        
        # Validar datos
        numero_tarjeta = data.get('numero_tarjeta')
        punto_venta_id = data.get('punto_venta_id')
        monto = data.get('monto')
        descripcion = data.get('descripcion', '')
        
        if not numero_tarjeta:
            return jsonify({
                'success': False,
                'error': 'El número de tarjeta es obligatorio'
            }), 400
        
        if not punto_venta_id:
            return jsonify({
                'success': False,
                'error': 'El ID del punto de venta es obligatorio'
            }), 400
        
        if not monto:
            return jsonify({
                'success': False,
                'error': 'El monto es obligatorio'
            }), 400
        
        try:
            monto = float(monto)
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'El monto debe ser un número válido'
            }), 400
        
        if monto <= 0:
            return jsonify({
                'success': False,
                'error': 'El monto debe ser mayor a cero'
            }), 400
        
        # Obtener la tarjeta
        tarjeta = Tarjeta.obtener_por_numero(numero_tarjeta)
        if not tarjeta:
            return jsonify({
                'success': False,
                'error': 'Tarjeta no encontrada o inactiva'
            }), 404
        
        # Verificar que la tarjeta esté activa
        if not tarjeta.get('activa', False):
            return jsonify({
                'success': False,
                'error': 'Tarjeta bloqueada. Recargue saldo para continuar.'
            }), 400
        
        # Verificar que el punto de venta existe
        punto_venta = PuntoVenta.obtener_por_id(punto_venta_id)
        if not punto_venta:
            return jsonify({
                'success': False,
                'error': 'Punto de venta no encontrado'
            }), 404
        
        # Verificar saldo suficiente
        saldo_actual = float(tarjeta['saldo'])
        if saldo_actual < monto:
            return jsonify({
                'success': False,
                'error': f'Saldo insuficiente. Saldo actual: ${saldo_actual:.2f}, Monto requerido: ${monto:.2f}'
            }), 400
        
        # Calcular nuevo saldo
        saldo_anterior = saldo_actual
        saldo_nuevo = saldo_anterior - monto
        
        # Actualizar saldo en la tarjeta
        Tarjeta.actualizar_saldo(tarjeta['id'], saldo_nuevo)
        
        # Bloquear tarjeta si el saldo llega a 0 o menos
        tarjeta_bloqueada = False
        if saldo_nuevo <= 0:
            from database import get_db_connection
            connection = get_db_connection()
            cursor = connection.cursor()
            try:
                cursor.execute("UPDATE tarjetas SET activa = FALSE WHERE id = %s", (tarjeta['id'],))
                connection.commit()
                tarjeta_bloqueada = True
            except Exception as e:
                connection.rollback()
                raise e
            finally:
                cursor.close()
                connection.close()
        
        # Registrar la transacción
        Transaccion.crear(
            tarjeta_id=tarjeta['id'],
            tipo='pago',
            monto=monto,
            saldo_anterior=saldo_anterior,
            saldo_nuevo=saldo_nuevo,
            punto_venta_id=punto_venta_id,
            descripcion=descripcion or f'Pago en {punto_venta["nombre"]}'
        )
        
        # Obtener tarjeta actualizada
        tarjeta_actualizada = Tarjeta.obtener_por_id(tarjeta['id'])
        
        return jsonify({
            'success': True,
            'message': f'Pago procesado correctamente: ${monto:.2f}' + (' (Tarjeta bloqueada por saldo insuficiente)' if tarjeta_bloqueada else ''),
            'data': {
                'tarjeta': tarjeta_actualizada,
                'punto_venta': punto_venta['nombre'],
                'monto_pagado': monto,
                'saldo_anterior': saldo_anterior,
                'saldo_nuevo': saldo_nuevo,
                'tarjeta_bloqueada': tarjeta_bloqueada
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def consultar_saldo():
    """
    Consulta el saldo actual de una tarjeta
    
    Endpoint: GET /api/tarjetas/saldo/<numero_tarjeta>
    """
    try:
        numero_tarjeta = request.view_args.get('numero_tarjeta')
        
        if not numero_tarjeta:
            return jsonify({
                'success': False,
                'error': 'El número de tarjeta es obligatorio'
            }), 400
        
        # Obtener la tarjeta
        tarjeta = Tarjeta.obtener_por_numero(numero_tarjeta)
        if not tarjeta:
            return jsonify({
                'success': False,
                'error': 'Tarjeta no encontrada o inactiva'
            }), 404
        
        return jsonify({
            'success': True,
            'data': {
                'numero_tarjeta': tarjeta['numero_tarjeta'],
                'asistente': tarjeta['asistente_nombre'],
                'saldo': float(tarjeta['saldo']),
                'saldo_formateado': f"${float(tarjeta['saldo']):.2f}"
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def obtener_historial():
    """
    Obtiene el historial de transacciones de una tarjeta
    
    Endpoint: GET /api/tarjetas/historial/<numero_tarjeta>
    """
    try:
        numero_tarjeta = request.view_args.get('numero_tarjeta')
        
        if not numero_tarjeta:
            return jsonify({
                'success': False,
                'error': 'El número de tarjeta es obligatorio'
            }), 400
        
        # Verificar que la tarjeta existe
        tarjeta = Tarjeta.obtener_por_numero(numero_tarjeta)
        if not tarjeta:
            return jsonify({
                'success': False,
                'error': 'Tarjeta no encontrada o inactiva'
            }), 404
        
        # Obtener historial
        transacciones = Transaccion.obtener_por_tarjeta(numero_tarjeta)
        
        # Formatear transacciones
        transacciones_formateadas = []
        for trans in transacciones:
            transacciones_formateadas.append({
                'id': trans['id'],
                'tipo': trans['tipo'],
                'monto': float(trans['monto']),
                'monto_formateado': f"${float(trans['monto']):.2f}",
                'saldo_anterior': float(trans['saldo_anterior']),
                'saldo_nuevo': float(trans['saldo_nuevo']),
                'punto_venta': trans.get('punto_venta_nombre', 'N/A'),
                'descripcion': trans.get('descripcion', ''),
                'fecha': trans['fecha_transaccion'].strftime('%Y-%m-%d %H:%M:%S') if trans.get('fecha_transaccion') else None
            })
        
        return jsonify({
            'success': True,
            'data': {
                'numero_tarjeta': numero_tarjeta,
                'asistente': tarjeta['asistente_nombre'],
                'saldo_actual': float(tarjeta['saldo']),
                'total_transacciones': len(transacciones_formateadas),
                'transacciones': transacciones_formateadas
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def listar_puntos_venta():
    """
    Lista todos los puntos de venta disponibles
    
    Endpoint: GET /api/puntos-venta
    """
    try:
        puntos_venta = PuntoVenta.listar_todos()
        
        return jsonify({
            'success': True,
            'data': puntos_venta
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def crear_punto_venta():
    """
    Crea un nuevo punto de venta (solo admin)
    Endpoint: POST /api/puntos-venta
    Body:
        - nombre (str): obligatorio
        - tipo (str): obligatorio
        - activo (bool, optional): default True
    """
    from auth.auth_routes import obtener_rol_usuario
    rol = obtener_rol_usuario()
    if rol != 'admin':
        return jsonify({'success': False, 'error': 'Solo los administradores pueden crear puntos de venta'}), 403

    try:
        data = request.get_json() or {}
        nombre = data.get('nombre')
        tipo = data.get('tipo')
        activo = data.get('activo', True)

        if not nombre or not str(nombre).strip():
            return jsonify({'success': False, 'error': 'El nombre es obligatorio'}), 400
        if not tipo or not str(tipo).strip():
            return jsonify({'success': False, 'error': 'El tipo es obligatorio'}), 400

        pv = PuntoVenta.crear(str(nombre).strip(), str(tipo).strip(), bool(activo))
        return jsonify({'success': True, 'message': 'Punto de venta creado', 'data': pv}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def actualizar_punto_venta(punto_venta_id):
    """
    Actualiza un punto de venta (solo admin)
    Endpoint: PUT /api/puntos-venta/<id>
    """
    from auth.auth_routes import obtener_rol_usuario
    rol = obtener_rol_usuario()
    if rol != 'admin':
        return jsonify({'success': False, 'error': 'Solo los administradores pueden actualizar puntos de venta'}), 403

    try:
        data = request.get_json() or {}

        if 'nombre' in data and (not data.get('nombre') or not str(data.get('nombre')).strip()):
            return jsonify({'success': False, 'error': 'El nombre no puede estar vacío'}), 400
        if 'tipo' in data and (not data.get('tipo') or not str(data.get('tipo')).strip()):
            return jsonify({'success': False, 'error': 'El tipo no puede estar vacío'}), 400

        pv = PuntoVenta.actualizar(
            punto_venta_id,
            nombre=str(data.get('nombre')).strip() if 'nombre' in data and data.get('nombre') is not None else None,
            tipo=str(data.get('tipo')).strip() if 'tipo' in data and data.get('tipo') is not None else None,
            activo=data.get('activo') if 'activo' in data else None
        )
        if not pv:
            return jsonify({'success': False, 'error': 'Punto de venta no encontrado'}), 404
        return jsonify({'success': True, 'message': 'Punto de venta actualizado', 'data': pv}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def eliminar_punto_venta(punto_venta_id):
    """
    Elimina (desactiva) un punto de venta (solo admin)
    Endpoint: DELETE /api/puntos-venta/<id>
    """
    from auth.auth_routes import obtener_rol_usuario
    rol = obtener_rol_usuario()
    if rol != 'admin':
        return jsonify({'success': False, 'error': 'Solo los administradores pueden eliminar puntos de venta'}), 403

    try:
        res = PuntoVenta.eliminar(punto_venta_id)
        if not res:
            return jsonify({'success': False, 'error': 'Punto de venta no encontrado'}), 404
        return jsonify({'success': True, 'message': 'Punto de venta eliminado'}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def listar_asistentes():
    """
    Lista todos los asistentes registrados
    
    Endpoint: GET /api/asistentes
    """
    try:
        asistentes = Asistente.listar_todos()
        
        return jsonify({
            'success': True,
            'data': asistentes
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def listar_asistentes_sin_tarjeta():
    """
    Lista todos los asistentes que NO tienen tarjeta asignada
    
    Endpoint: GET /api/asistentes/sin-tarjeta
    """
    try:
        asistentes = Asistente.listar_sin_tarjeta()
        
        return jsonify({
            'success': True,
            'data': asistentes
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def verificar_tarjeta():
    """
    Verifica el estado de una tarjeta (si existe y si está asignada)
    
    Endpoint: GET /api/tarjetas/verificar/<numero_tarjeta>
    """
    try:
        numero_tarjeta = request.view_args.get('numero_tarjeta')
        
        if not numero_tarjeta:
            return jsonify({
                'success': False,
                'error': 'El número de tarjeta es obligatorio'
            }), 400
        
        # Validar formato básico
        numero_tarjeta = numero_tarjeta.strip().upper()
        if not numero_tarjeta.startswith('TARJ-') or len(numero_tarjeta) != 11:
            return jsonify({
                'success': False,
                'error': 'El formato del número de tarjeta debe ser TARJ-XXXXXX'
            }), 400
        
        estado = Tarjeta.verificar_estado(numero_tarjeta)
        
        return jsonify({
            'success': True,
            'data': {
                'numero_tarjeta': numero_tarjeta,
                **estado
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def generar_qr():
    """
    Genera un código QR para una tarjeta
    
    Endpoint: GET /api/tarjetas/qr/<numero_tarjeta>
    
    Returns:
        Imagen PNG del código QR que contiene el número de tarjeta
    """
    try:
        from flask import send_file
        import qrcode
        import io
        
        # Obtener número de tarjeta de los argumentos de la ruta
        numero_tarjeta = request.view_args.get('numero_tarjeta')
        
        if not numero_tarjeta:
            return jsonify({
                'success': False,
                'error': 'El número de tarjeta es obligatorio'
            }), 400
        
        # Verificar que la tarjeta existe
        tarjeta = Tarjeta.obtener_por_numero(numero_tarjeta)
        if not tarjeta:
            return jsonify({
                'success': False,
                'error': 'Tarjeta no encontrada o inactiva'
            }), 404
        
        # Generar QR con el número de tarjeta
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(numero_tarjeta)
        qr.make(fit=True)
        
        # Crear imagen
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Guardar en buffer de memoria
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        return send_file(
            img_buffer,
            mimetype='image/png',
            as_attachment=False,
            download_name=f'QR_{numero_tarjeta}.png'
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================
# FUNCIONES DE PRODUCTOS
# ============================================

def listar_productos():
    """
    Lista todos los productos activos
    
    Endpoint: GET /api/productos
    Query params opcionales:
        - tipo: Filtrar por tipo de producto
    """
    try:
        tipo = request.args.get('tipo')
        
        if tipo:
            productos = Producto.listar_por_tipo(tipo)
        else:
            productos = Producto.listar_todos()
        
        return jsonify({
            'success': True,
            'data': productos
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def obtener_tipos_productos():
    """
    Obtiene la lista de tipos únicos de productos
    
    Endpoint: GET /api/productos/tipos
    """
    try:
        tipos = Producto.obtener_tipos()
        
        return jsonify({
            'success': True,
            'data': tipos
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def crear_producto():
    """
    Crea un nuevo producto
    SOLO ADMIN puede crear productos
    
    Endpoint: POST /api/productos
    Body:
        - nombre (str): Nombre del producto
        - precio (float): Precio del producto
        - tipo (str): Tipo/categoría del producto
        - punto_venta_id (int, optional): ID del punto de venta
        - descripcion (str, optional): Descripción del producto
        - imagen_url (str, optional): URL de la imagen del producto
        - activo (bool, optional): Estado activo/inactivo (default: True)
    """
    from flask import session
    from auth.auth_routes import obtener_rol_usuario
    
    # Verificar que solo admin puede crear productos
    rol = obtener_rol_usuario()
    if rol != 'admin':
        return jsonify({
            'success': False,
            'error': 'Solo los administradores pueden crear productos'
        }), 403
    
    try:
        data = request.get_json()
        
        nombre = data.get('nombre')
        precio = data.get('precio')
        tipo = data.get('tipo')
        punto_venta_id = data.get('punto_venta_id')
        descripcion = data.get('descripcion')
        imagen_url = data.get('imagen_url')
        activo = data.get('activo', True)
        
        # Validaciones
        if not nombre or not nombre.strip():
            return jsonify({
                'success': False,
                'error': 'El nombre del producto es obligatorio'
            }), 400
        
        if precio is None or precio <= 0:
            return jsonify({
                'success': False,
                'error': 'El precio debe ser mayor a 0'
            }), 400

        if not tipo or not str(tipo).strip():
            return jsonify({
                'success': False,
                'error': 'El tipo del producto es obligatorio'
            }), 400
        
        # Normalizar punto_venta_id
        if punto_venta_id in ('', None):
            punto_venta_id = None

        producto = Producto.crear(
            nombre.strip(),
            precio,
            str(tipo).strip(),
            punto_venta_id,
            descripcion.strip() if isinstance(descripcion, str) and descripcion.strip() else None,
            imagen_url.strip() if isinstance(imagen_url, str) and imagen_url.strip() else None,
        )
        
        # Si activo es False, actualizar
        if not activo:
            producto = Producto.actualizar(producto['id'], activo=False)
        
        return jsonify({
            'success': True,
            'message': 'Producto creado correctamente',
            'data': producto
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def obtener_producto(producto_id):
    """
    Obtiene un producto por su ID
    
    Endpoint: GET /api/productos/<producto_id>
    """
    try:
        producto = Producto.obtener_por_id(producto_id)
        
        if not producto:
            return jsonify({
                'success': False,
                'error': 'Producto no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'data': producto
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def actualizar_producto(producto_id):
    """
    Actualiza un producto existente
    SOLO ADMIN puede actualizar productos
    
    Endpoint: PUT /api/productos/<producto_id>
    Body:
        - nombre (str, optional): Nombre del producto
        - precio (float, optional): Precio del producto
        - tipo (str, optional): Tipo/categoría del producto
        - punto_venta_id (int, optional): ID del punto de venta
        - descripcion (str, optional): Descripción del producto
        - imagen_url (str, optional): URL de la imagen del producto
        - activo (bool, optional): Estado activo/inactivo
    """
    from flask import session
    from auth.auth_routes import obtener_rol_usuario
    
    # Verificar que solo admin puede actualizar productos
    rol = obtener_rol_usuario()
    if rol != 'admin':
        return jsonify({
            'success': False,
            'error': 'Solo los administradores pueden actualizar productos'
        }), 403
    
    try:
        data = request.get_json()
        
        # Validaciones si se proporcionan
        if 'nombre' in data and (not data.get('nombre') or not data.get('nombre').strip()):
            return jsonify({
                'success': False,
                'error': 'El nombre del producto no puede estar vacío'
            }), 400
        
        if 'precio' in data and (data.get('precio') is None or data.get('precio') <= 0):
            return jsonify({
                'success': False,
                'error': 'El precio debe ser mayor a 0'
            }), 400

        if 'tipo' in data and (not data.get('tipo') or not str(data.get('tipo')).strip()):
            return jsonify({
                'success': False,
                'error': 'El tipo del producto no puede estar vacío'
            }), 400
        
        punto_venta_id = data.get('punto_venta_id') if 'punto_venta_id' in data else None
        if 'punto_venta_id' in data and punto_venta_id in ('', None):
            punto_venta_id = None

        producto = Producto.actualizar(
            producto_id,
            nombre=data.get('nombre').strip() if data.get('nombre') else None,
            precio=data.get('precio'),
            tipo=str(data.get('tipo')).strip() if data.get('tipo') else None,
            punto_venta_id=punto_venta_id,
            descripcion=data.get('descripcion').strip() if isinstance(data.get('descripcion'), str) and data.get('descripcion').strip() else None,
            imagen_url=data.get('imagen_url').strip() if isinstance(data.get('imagen_url'), str) and data.get('imagen_url').strip() else None,
            activo=data.get('activo')
        )
        
        if not producto:
            return jsonify({
                'success': False,
                'error': 'Producto no encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Producto actualizado correctamente',
            'data': producto
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def eliminar_producto(producto_id):
    """
    Elimina (desactiva) un producto
    SOLO ADMIN puede eliminar productos
    
    Endpoint: DELETE /api/productos/<producto_id>
    """
    from flask import session
    from auth.auth_routes import obtener_rol_usuario
    
    # Verificar que solo admin puede eliminar productos
    rol = obtener_rol_usuario()
    if rol != 'admin':
        return jsonify({
            'success': False,
            'error': 'Solo los administradores pueden eliminar productos'
        }), 403
    
    try:
        resultado = Producto.eliminar(producto_id)
        
        if resultado:
            return jsonify({
                'success': True,
                'message': 'Producto eliminado correctamente'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Producto no encontrado'
            }), 404
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================
# FUNCIONES DE REPORTES
# ============================================

def parsear_productos_descripcion(descripcion):
    """
    Parsea la descripción de una transacción para extraer productos y cantidades
    Formato esperado: "Producto1 x2, Producto2 x1" o "Pago en Restaurante Principal"
    
    Returns:
        list: Lista de diccionarios con {nombre, cantidad, precio_unitario, total}
    """
    if not descripcion:
        return []
    
    productos = []
    # Intentar parsear productos del formato "Producto xCantidad"
    partes = descripcion.split(',')
    
    for parte in partes:
        parte = parte.strip()
        # Buscar patrón "Producto xCantidad"
        import re
        match = re.match(r'(.+?)\s+x\s*(\d+)', parte, re.IGNORECASE)
        if match:
            nombre = match.group(1).strip()
            cantidad = int(match.group(2))
            productos.append({
                'nombre': nombre,
                'cantidad': cantidad,
                'precio_unitario': None,  # No disponible en la descripción
                'total': None
            })
    
    return productos

def obtener_reporte_ventas():
    """
    Obtiene reporte de ventas con filtros
    
    Endpoint: GET /api/reportes/ventas
    Query params:
        - fecha_inicio: YYYY-MM-DD (opcional)
        - fecha_fin: YYYY-MM-DD (opcional)
        - punto_venta_id: int (opcional)
    """
    from flask import session
    from auth.auth_routes import obtener_rol_usuario
    
    # Verificar que solo admin puede ver reportes
    rol = obtener_rol_usuario()
    if rol != 'admin':
        return jsonify({
            'success': False,
            'error': 'Solo los administradores pueden ver reportes'
        }), 403
    
    try:
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        punto_venta_id = request.args.get('punto_venta_id', type=int)
        
        # Obtener ventas
        ventas = Transaccion.obtener_ventas(
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            punto_venta_id=punto_venta_id
        )
        
        # Obtener resumen
        resumen = Transaccion.obtener_resumen_ventas(
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            punto_venta_id=punto_venta_id
        )
        
        # Formatear ventas
        ventas_formateadas = []
        productos_vendidos = {}  # Para contar productos más vendidos
        
        for venta in ventas:
            # Extraer últimos 4 dígitos de la tarjeta
            numero_tarjeta = venta.get('numero_tarjeta', '')
            ultimos_4 = numero_tarjeta[-4:] if len(numero_tarjeta) > 4 else numero_tarjeta
            
            # Parsear productos de la descripción
            productos = parsear_productos_descripcion(venta.get('descripcion', ''))
            
            # Si no se pudieron parsear productos, crear uno genérico
            if not productos:
                productos = [{
                    'nombre': venta.get('descripcion', 'Venta general') or 'Venta general',
                    'cantidad': 1,
                    'precio_unitario': float(venta.get('monto', 0)),
                    'total': float(venta.get('monto', 0))
                }]
            else:
                # Distribuir el monto total entre los productos
                monto_total = float(venta.get('monto', 0))
                cantidad_total = sum(p['cantidad'] for p in productos)
                if cantidad_total > 0:
                    precio_promedio = monto_total / cantidad_total
                    for producto in productos:
                        producto['precio_unitario'] = precio_promedio
                        producto['total'] = producto['cantidad'] * precio_promedio
                        # Contar productos vendidos
                        nombre_prod = producto['nombre']
                        if nombre_prod not in productos_vendidos:
                            productos_vendidos[nombre_prod] = {'cantidad': 0, 'total': 0}
                        productos_vendidos[nombre_prod]['cantidad'] += producto['cantidad']
                        productos_vendidos[nombre_prod]['total'] += producto['total']
            
            # Crear una entrada por cada producto
            for producto in productos:
                ventas_formateadas.append({
                    'id': venta.get('id'),
                    'fecha_hora': venta.get('fecha_transaccion').strftime('%Y-%m-%d %H:%M:%S') if venta.get('fecha_transaccion') else None,
                    'punto_venta': venta.get('punto_venta_nombre', 'N/A'),
                    'punto_venta_id': venta.get('punto_venta_id'),
                    'producto': producto['nombre'],
                    'cantidad': producto['cantidad'],
                    'precio_unitario': producto.get('precio_unitario', 0),
                    'total': producto.get('total', float(venta.get('monto', 0))),
                    'tarjeta_ultimos_4': ultimos_4,
                    'tarjeta_completa': numero_tarjeta,
                    'asistente': venta.get('asistente_nombre', 'N/A'),
                    'asistente_id': venta.get('asistente_id'),
                    'usuario': 'Sistema',  # Por ahora, no hay tracking de usuario
                    'transaccion_id': venta.get('id')
                })
        
        # Ordenar productos más vendidos
        productos_mas_vendidos = sorted(
            productos_vendidos.items(),
            key=lambda x: x[1]['cantidad'],
            reverse=True
        )[:10]  # Top 10
        
        return jsonify({
            'success': True,
            'data': {
                'ventas': ventas_formateadas,
                'resumen': {
                    'total_ventas': resumen['totales'].get('total_ventas', 0) or 0,
                    'total_monto': float(resumen['totales'].get('total_monto', 0) or 0),
                    'promedio_venta': float(resumen['totales'].get('promedio_venta', 0) or 0),
                    'ventas_por_punto_venta': [
                        {
                            'punto_venta': pv.get('nombre', 'N/A'),
                            'total_ventas': pv.get('total_ventas', 0) or 0,
                            'total_monto': float(pv.get('total_monto', 0) or 0)
                        }
                        for pv in resumen['ventas_por_punto_venta']
                    ],
                    'productos_mas_vendidos': [
                        {
                            'producto': nombre,
                            'cantidad': datos['cantidad'],
                            'total': datos['total']
                        }
                        for nombre, datos in productos_mas_vendidos
                    ]
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def obtener_reporte_transacciones():
    """
    Obtiene reporte de transacciones (recargas y pagos) con filtros
    
    Endpoint: GET /api/reportes/transacciones
    Query params:
        - fecha_inicio: YYYY-MM-DD (opcional)
        - fecha_fin: YYYY-MM-DD (opcional)
        - tipo: 'recarga' o 'pago' (opcional)
        - punto_venta_id: int (opcional)
    """
    from flask import session
    from auth.auth_routes import obtener_rol_usuario
    
    # Verificar que solo admin puede ver reportes
    rol = obtener_rol_usuario()
    if rol != 'admin':
        return jsonify({
            'success': False,
            'error': 'Solo los administradores pueden ver reportes'
        }), 403
    
    try:
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        tipo = request.args.get('tipo')
        punto_venta_id = request.args.get('punto_venta_id', type=int)
        
        # Obtener transacciones
        transacciones = Transaccion.obtener_todas_transacciones(
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            tipo=tipo,
            punto_venta_id=punto_venta_id
        )
        
        # Formatear transacciones
        transacciones_formateadas = []
        totales = {'recargas': 0, 'pagos': 0, 'total_recargas': 0, 'total_pagos': 0}
        
        for trans in transacciones:
            # Extraer últimos 4 dígitos de la tarjeta
            numero_tarjeta = trans.get('numero_tarjeta', '')
            ultimos_4 = numero_tarjeta[-4:] if len(numero_tarjeta) > 4 else numero_tarjeta
            
            tipo_trans = trans.get('tipo', '')
            monto = float(trans.get('monto', 0))
            
            # Determinar estado
            saldo_anterior = float(trans.get('saldo_anterior', 0))
            saldo_nuevo = float(trans.get('saldo_nuevo', 0))
            
            if tipo_trans == 'pago':
                if saldo_anterior >= monto:
                    estado = 'exitosa'
                else:
                    estado = 'saldo_insuficiente'
            else:
                estado = 'exitosa'
            
            transacciones_formateadas.append({
                'id': trans.get('id'),
                'fecha_hora': trans.get('fecha_transaccion').strftime('%Y-%m-%d %H:%M:%S') if trans.get('fecha_transaccion') else None,
                'tipo': tipo_trans,
                'monto': monto,
                'monto_formateado': f"${monto:.2f}",
                'tarjeta_ultimos_4': ultimos_4,
                'tarjeta_completa': numero_tarjeta,
                'asistente': trans.get('asistente_nombre', 'N/A'),
                'asistente_id': trans.get('asistente_id'),
                'punto_venta': trans.get('punto_venta_nombre', 'N/A' if tipo_trans == 'pago' else None),
                'punto_venta_id': trans.get('punto_venta_id'),
                'usuario': 'Sistema',  # Por ahora, no hay tracking de usuario
                'estado': estado,
                'descripcion': trans.get('descripcion', ''),
                'saldo_anterior': saldo_anterior,
                'saldo_nuevo': saldo_nuevo
            })
            
            # Actualizar totales
            if tipo_trans == 'recarga':
                totales['recargas'] += 1
                totales['total_recargas'] += monto
            else:
                totales['pagos'] += 1
                totales['total_pagos'] += monto
        
        return jsonify({
            'success': True,
            'data': {
                'transacciones': transacciones_formateadas,
                'resumen': {
                    'total_transacciones': len(transacciones_formateadas),
                    'total_recargas': totales['recargas'],
                    'total_pagos': totales['pagos'],
                    'monto_total_recargas': totales['total_recargas'],
                    'monto_total_pagos': totales['total_pagos'],
                    'diferencia': totales['total_recargas'] - totales['total_pagos']
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================
# FUNCIONES DE PERFIL DE USUARIO
# ============================================

def obtener_perfil():
    """
    Obtiene el perfil del usuario actual
    
    Endpoint: GET /api/perfil
    """
    try:
        usuario_actual = session.get('usuario')
        if not usuario_actual:
            return jsonify({
                'success': False,
                'error': 'No hay usuario autenticado'
            }), 401
        
        usuario = Usuario.obtener_por_usuario(usuario_actual)
        if not usuario:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404
        
        # Ocultar la contraseña
        usuario_data = {
            'id': usuario['id'],
            'usuario': usuario['usuario'],
            'rol': usuario['rol'],
            'nombre_completo': usuario.get('nombre_completo'),
            'email': usuario.get('email'),
            'telefono': usuario.get('telefono'),
            'foto_perfil': usuario.get('foto_perfil'),
            'fecha_creacion': usuario.get('fecha_creacion').isoformat() if usuario.get('fecha_creacion') else None,
            'fecha_actualizacion': usuario.get('fecha_actualizacion').isoformat() if usuario.get('fecha_actualizacion') else None
        }
        
        return jsonify({
            'success': True,
            'data': usuario_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def actualizar_perfil():
    """
    Actualiza el perfil del usuario actual
    
    Endpoint: PUT /api/perfil
    Body (JSON o Form):
        - nombre_completo (str, optional)
        - email (str, optional)
        - telefono (str, optional)
        - foto_perfil (file, optional) - archivo de imagen
    """
    try:
        usuario_actual = session.get('usuario')
        if not usuario_actual:
            return jsonify({
                'success': False,
                'error': 'No hay usuario autenticado'
            }), 401
        
        # Obtener datos del formulario o JSON
        nombre_completo = request.form.get('nombre_completo') or (request.json.get('nombre_completo') if request.is_json else None)
        email = request.form.get('email') or (request.json.get('email') if request.is_json else None)
        telefono = request.form.get('telefono') or (request.json.get('telefono') if request.is_json else None)
        
        # Manejar subida de archivo
        foto_perfil = None
        print(f"[DEBUG] Actualizando perfil para usuario: {usuario_actual}")
        print(f"[DEBUG] Archivos recibidos: {list(request.files.keys())}")
        
        if 'foto_perfil' in request.files:
            file = request.files['foto_perfil']
            print(f"[DEBUG] Archivo recibido: {file.filename if file else 'None'}")
            
            if file and file.filename:
                from config import Config
                import os
                
                print(f"[DEBUG] Carpeta de uploads: {Config.UPLOAD_FOLDER}")
                
                # Crear directorio si no existe
                os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
                print(f"[DEBUG] Directorio creado/verificado: {Config.UPLOAD_FOLDER}")
                
                # Validar extensión
                filename = secure_filename(file.filename)
                ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
                print(f"[DEBUG] Extensión del archivo: {ext}")
                
                if ext not in Config.ALLOWED_EXTENSIONS:
                    print(f"[DEBUG] Extensión no permitida: {ext}")
                    return jsonify({
                        'success': False,
                        'error': f'Formato no permitido. Use: {", ".join(Config.ALLOWED_EXTENSIONS)}'
                    }), 400
                
                # Generar nombre único
                import uuid
                unique_filename = f"{usuario_actual}_{uuid.uuid4().hex[:8]}.{ext}"
                filepath = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
                print(f"[DEBUG] Guardando archivo en: {filepath}")
                
                # Guardar archivo
                try:
                    file.save(filepath)
                    print(f"[DEBUG] Archivo guardado exitosamente: {filepath}")
                    
                    # Verificar que el archivo existe
                    if os.path.exists(filepath):
                        print(f"[DEBUG] Archivo verificado en disco: {os.path.getsize(filepath)} bytes")
                    else:
                        print(f"[ERROR] Archivo no encontrado después de guardar: {filepath}")
                except Exception as save_error:
                    print(f"[ERROR] Error al guardar archivo: {str(save_error)}")
                    return jsonify({
                        'success': False,
                        'error': f'Error al guardar la imagen: {str(save_error)}'
                    }), 500
                
                # Ruta relativa para guardar en BD (debe coincidir con la carpeta real)
                foto_perfil = f"/static/uploads/fotos_perfil/{unique_filename}"
                print(f"[DEBUG] Ruta de foto para BD: {foto_perfil}")
            else:
                print("[DEBUG] No hay archivo o filename vacío")
        else:
            print("[DEBUG] No se recibió 'foto_perfil' en request.files")
        
        # Actualizar perfil
        usuario_actualizado = Usuario.actualizar_perfil(
            usuario_actual,
            nombre_completo=nombre_completo,
            email=email,
            telefono=telefono,
            foto_perfil=foto_perfil
        )
        
        if not usuario_actualizado:
            return jsonify({
                'success': False,
                'error': 'Error al actualizar el perfil'
            }), 500
        
        # Preparar respuesta
        usuario_data = {
            'id': usuario_actualizado['id'],
            'usuario': usuario_actualizado['usuario'],
            'rol': usuario_actualizado['rol'],
            'nombre_completo': usuario_actualizado.get('nombre_completo'),
            'email': usuario_actualizado.get('email'),
            'telefono': usuario_actualizado.get('telefono'),
            'foto_perfil': usuario_actualizado.get('foto_perfil'),
            'fecha_actualizacion': usuario_actualizado.get('fecha_actualizacion').isoformat() if usuario_actualizado.get('fecha_actualizacion') else None
        }
        
        return jsonify({
            'success': True,
            'message': 'Perfil actualizado correctamente',
            'data': usuario_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
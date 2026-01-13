# 🔒 PROPUESTA FASE 1: Bloqueo y Desbloqueo Automático de Tarjetas

## 📋 Resumen de Cambios

**Archivo a modificar**: `routes.py`

**Funciones a modificar**:
1. `procesar_pago()` - Líneas 271-385
2. `cargar_saldo()` - Líneas 183-269

**Objetivo**: 
- Bloquear tarjeta automáticamente cuando saldo llega a 0 después de un pago
- Desbloquear tarjeta automáticamente cuando saldo > 0 después de una recarga
- Validar que tarjeta esté activa antes de procesar pago

---

## 🔧 CAMBIO 1: Función `procesar_pago()`

### **Ubicación**: `routes.py`, líneas 271-385

### **Cambios propuestos**:

#### **A) Agregar validación de tarjeta activa** (Después de línea 330)

**Líneas actuales (325-330)**:
```python
        # Obtener la tarjeta
        tarjeta = Tarjeta.obtener_por_numero(numero_tarjeta)
        if not tarjeta:
            return jsonify({
                'success': False,
                'error': 'Tarjeta no encontrada o inactiva'
            }), 404
```

**Líneas propuestas (AGREGAR después de línea 330)**:
```python
        # Verificar que la tarjeta esté activa
        if not tarjeta.get('activa', False):
            return jsonify({
                'success': False,
                'error': 'Tarjeta bloqueada. Recargue saldo para continuar.'
            }), 400
```

---

#### **B) Agregar bloqueo automático cuando saldo = 0** (Después de línea 353)

**Líneas actuales (348-353)**:
```python
        # Calcular nuevo saldo
        saldo_anterior = saldo_actual
        saldo_nuevo = saldo_anterior - monto
        
        # Actualizar saldo en la tarjeta
        Tarjeta.actualizar_saldo(tarjeta['id'], saldo_nuevo)
```

**Líneas propuestas (AGREGAR después de línea 353)**:
```python
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
```

---

#### **C) Actualizar mensaje de respuesta** (Línea 371)

**Línea actual (371)**:
```python
            'message': f'Pago procesado correctamente: ${monto:.2f}',
```

**Línea propuesta (REEMPLAZAR)**:
```python
            'message': f'Pago procesado correctamente: ${monto:.2f}' + (' (Tarjeta bloqueada por saldo insuficiente)' if tarjeta_bloqueada else ''),
```

---

#### **D) Agregar información de bloqueo en respuesta** (Después de línea 377)

**Líneas actuales (372-378)**:
```python
            'data': {
                'tarjeta': tarjeta_actualizada,
                'punto_venta': punto_venta['nombre'],
                'monto_pagado': monto,
                'saldo_anterior': saldo_anterior,
                'saldo_nuevo': saldo_nuevo
            }
```

**Líneas propuestas (AGREGAR en 'data')**:
```python
            'data': {
                'tarjeta': tarjeta_actualizada,
                'punto_venta': punto_venta['nombre'],
                'monto_pagado': monto,
                'saldo_anterior': saldo_anterior,
                'saldo_nuevo': saldo_nuevo,
                'tarjeta_bloqueada': tarjeta_bloqueada
            }
```

---

## 🔧 CAMBIO 2: Función `cargar_saldo()`

### **Ubicación**: `routes.py`, líneas 183-269

### **Cambios propuestos**:

#### **A) Agregar desbloqueo automático cuando saldo > 0** (Después de línea 239)

**Líneas actuales (234-239)**:
```python
        # Calcular nuevos saldos
        saldo_anterior = float(tarjeta['saldo'])
        saldo_nuevo = saldo_anterior + monto
        
        # Actualizar saldo en la tarjeta
        Tarjeta.actualizar_saldo(tarjeta['id'], saldo_nuevo)
```

**Líneas propuestas (AGREGAR después de línea 239)**:
```python
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
```

---

#### **B) Actualizar mensaje de respuesta** (Línea 256)

**Línea actual (256)**:
```python
            'message': f'Saldo recargado correctamente: ${monto:.2f}',
```

**Línea propuesta (REEMPLAZAR)**:
```python
            'message': f'Saldo recargado correctamente: ${monto:.2f}' + (' (Tarjeta desbloqueada)' if tarjeta_desbloqueada else ''),
```

---

#### **C) Agregar información de desbloqueo en respuesta** (Después de línea 261)

**Líneas actuales (257-262)**:
```python
            'data': {
                'tarjeta': tarjeta_actualizada,
                'monto_recargado': monto,
                'saldo_anterior': saldo_anterior,
                'saldo_nuevo': saldo_nuevo
            }
```

**Líneas propuestas (AGREGAR en 'data')**:
```python
            'data': {
                'tarjeta': tarjeta_actualizada,
                'monto_recargado': monto,
                'saldo_anterior': saldo_anterior,
                'saldo_nuevo': saldo_nuevo,
                'tarjeta_desbloqueada': tarjeta_desbloqueada
            }
```

---

## 📊 Resumen de Líneas Modificadas

### **Función `procesar_pago()`**:
- **Línea ~330**: Agregar validación de tarjeta activa (5 líneas nuevas)
- **Línea ~353**: Agregar bloqueo automático (15 líneas nuevas)
- **Línea ~371**: Modificar mensaje (1 línea modificada)
- **Línea ~377**: Agregar campo en respuesta (1 línea nueva)

**Total**: ~22 líneas agregadas/modificadas

### **Función `cargar_saldo()`**:
- **Línea ~239**: Agregar desbloqueo automático (15 líneas nuevas)
- **Línea ~256**: Modificar mensaje (1 línea modificada)
- **Línea ~261**: Agregar campo en respuesta (1 línea nueva)

**Total**: ~17 líneas agregadas/modificadas

---

## ⚠️ Consideraciones

1. **No se modifica lógica existente**: Solo se agregan validaciones y acciones adicionales
2. **No se tocan otros archivos**: Solo `routes.py`
3. **Compatibilidad**: Los cambios son retrocompatibles con código existente
4. **Manejo de errores**: Se mantiene el mismo patrón de manejo de excepciones
5. **Base de datos**: Se usa la misma conexión que ya existe en el proyecto

---

## ✅ Validaciones Agregadas

1. **Antes de procesar pago**: Verificar que `tarjeta.activa = TRUE`
2. **Después de procesar pago**: Si `saldo_nuevo <= 0`, establecer `activa = FALSE`
3. **Después de recargar saldo**: Si `saldo_nuevo > 0`, establecer `activa = TRUE`

---

## 🧪 Casos de Prueba Esperados

1. **Pago con saldo suficiente**: Pago se procesa normalmente
2. **Pago que deja saldo = 0**: Pago se procesa y tarjeta se bloquea
3. **Pago con tarjeta bloqueada**: Error "Tarjeta bloqueada. Recargue saldo para continuar."
4. **Recarga a tarjeta bloqueada**: Recarga se procesa y tarjeta se desbloquea
5. **Recarga a tarjeta activa**: Recarga se procesa normalmente

---

## 📝 ¿Aplicar estos cambios?

¿Estás de acuerdo con esta propuesta? Si confirmas, procederé a aplicar los cambios exactamente como se muestra arriba.

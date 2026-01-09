# Documentación de la API

## Base URL
```
http://localhost:5000
```

## Endpoints Disponibles

### 1. Registrar Asistente
**POST** `/api/asistentes`

Registra un nuevo asistente en el sistema.

**Body (JSON o Form):**
```json
{
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "telefono": "1234567890"
}
```

**Respuesta exitosa (201):**
```json
{
    "success": true,
    "message": "Asistente registrado correctamente",
    "data": {
        "id": 1,
        "nombre": "Juan Pérez",
        "email": "juan@example.com",
        "telefono": "1234567890",
        "fecha_registro": "2026-01-07 12:00:00",
        "activo": true
    }
}
```

---

### 2. Listar Asistentes
**GET** `/api/asistentes`

Obtiene la lista de todos los asistentes registrados.

**Respuesta exitosa (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "nombre": "Juan Pérez",
            "email": "juan@example.com",
            "telefono": "1234567890",
            "fecha_registro": "2026-01-07 12:00:00",
            "activo": true
        }
    ]
}
```

---

### 3. Asignar Tarjeta
**POST** `/api/tarjetas/asignar`

Asigna una tarjeta inteligente a un asistente.

**Body (JSON o Form):**
```json
{
    "asistente_id": 1
}
```

**Respuesta exitosa (201):**
```json
{
    "success": true,
    "message": "Tarjeta asignada correctamente",
    "data": {
        "id": 1,
        "asistente_id": 1,
        "numero_tarjeta": "TARJ-123456",
        "saldo": 0.00,
        "fecha_asignacion": "2026-01-07 12:00:00",
        "activa": true,
        "asistente_nombre": "Juan Pérez"
    }
}
```

---

### 4. Recargar Saldo
**POST** `/api/tarjetas/recargar`

Recarga saldo a una tarjeta.

**Body (JSON o Form):**
```json
{
    "numero_tarjeta": "TARJ-123456",
    "monto": 500.00
}
```

**Respuesta exitosa (200):**
```json
{
    "success": true,
    "message": "Saldo recargado correctamente: $500.00",
    "data": {
        "tarjeta": {
            "id": 1,
            "numero_tarjeta": "TARJ-123456",
            "saldo": 500.00,
            "asistente_nombre": "Juan Pérez"
        },
        "monto_recargado": 500.00,
        "saldo_anterior": 0.00,
        "saldo_nuevo": 500.00
    }
}
```

---

### 5. Procesar Pago
**POST** `/api/tarjetas/pagar`

Procesa un pago con una tarjeta en un punto de venta.

**Body (JSON o Form):**
```json
{
    "numero_tarjeta": "TARJ-123456",
    "punto_venta_id": 1,
    "monto": 50.00,
    "descripcion": "Almuerzo"
}
```

**Respuesta exitosa (200):**
```json
{
    "success": true,
    "message": "Pago procesado correctamente: $50.00",
    "data": {
        "tarjeta": {
            "id": 1,
            "numero_tarjeta": "TARJ-123456",
            "saldo": 450.00,
            "asistente_nombre": "Juan Pérez"
        },
        "punto_venta": "Restaurante Principal",
        "monto_pagado": 50.00,
        "saldo_anterior": 500.00,
        "saldo_nuevo": 450.00
    }
}
```

**Errores posibles:**
- `400`: Saldo insuficiente
- `404`: Tarjeta o punto de venta no encontrado

---

### 6. Consultar Saldo
**GET** `/api/tarjetas/saldo/<numero_tarjeta>`

Consulta el saldo actual de una tarjeta.

**Ejemplo:**
```
GET /api/tarjetas/saldo/TARJ-123456
```

**Respuesta exitosa (200):**
```json
{
    "success": true,
    "data": {
        "numero_tarjeta": "TARJ-123456",
        "asistente": "Juan Pérez",
        "saldo": 450.00,
        "saldo_formateado": "$450.00"
    }
}
```

---

### 7. Historial de Transacciones
**GET** `/api/tarjetas/historial/<numero_tarjeta>`

Obtiene el historial completo de transacciones de una tarjeta.

**Ejemplo:**
```
GET /api/tarjetas/historial/TARJ-123456
```

**Respuesta exitosa (200):**
```json
{
    "success": true,
    "data": {
        "numero_tarjeta": "TARJ-123456",
        "asistente": "Juan Pérez",
        "saldo_actual": 450.00,
        "total_transacciones": 2,
        "transacciones": [
            {
                "id": 2,
                "tipo": "pago",
                "monto": 50.00,
                "monto_formateado": "$50.00",
                "saldo_anterior": 500.00,
                "saldo_nuevo": 450.00,
                "punto_venta": "Restaurante Principal",
                "descripcion": "Almuerzo",
                "fecha": "2026-01-07 12:30:00"
            },
            {
                "id": 1,
                "tipo": "recarga",
                "monto": 500.00,
                "monto_formateado": "$500.00",
                "saldo_anterior": 0.00,
                "saldo_nuevo": 500.00,
                "punto_venta": "N/A",
                "descripcion": "Recarga de $500.00",
                "fecha": "2026-01-07 12:15:00"
            }
        ]
    }
}
```

---

### 8. Listar Puntos de Venta
**GET** `/api/puntos-venta`

Lista todos los puntos de venta disponibles.

**Respuesta exitosa (200):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "nombre": "Restaurante Principal",
            "tipo": "restaurante",
            "activo": true
        },
        {
            "id": 2,
            "nombre": "Cafetería",
            "tipo": "cafeteria",
            "activo": true
        }
    ]
}
```

---

## Códigos de Estado HTTP

- `200`: Operación exitosa
- `201`: Recurso creado exitosamente
- `400`: Error en la solicitud (datos inválidos)
- `404`: Recurso no encontrado
- `500`: Error interno del servidor

## Formato de Respuesta de Error

Todas las respuestas de error siguen este formato:

```json
{
    "success": false,
    "error": "Mensaje de error descriptivo"
}
```

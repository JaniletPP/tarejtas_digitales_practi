# Guía de Pruebas del Backend

Esta guía te ayudará a probar el sistema paso a paso.

## 📋 Requisitos Previos

1. **Python 3.7+** instalado
2. **MySQL** instalado y ejecutándose
3. **Dependencias** instaladas (`pip install -r requirements.txt`)

---

## 🔧 Paso 1: Configurar la Base de Datos

### 1.1 Verificar configuración de MySQL

Edita el archivo `config.py` o crea un archivo `.env` con tus credenciales de MySQL:

```python
# En config.py o .env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=tu_contraseña
MYSQL_DATABASE=tarjetas_evento
```

### 1.2 Inicializar la Base de Datos

Abre una terminal en el directorio del proyecto y ejecuta:

```bash
cd tarjetas-inteligentes
python init_db.py
```

**Salida esperada:**
```
Inicializando base de datos...
==================================================
✓ Base de datos inicializada correctamente
✓ Tablas creadas: asistentes, tarjetas, puntos_venta, transacciones
✓ Puntos de venta por defecto insertados
==================================================
✓ Base de datos lista para usar
```

Si hay errores, verifica:
- MySQL está ejecutándose
- Las credenciales son correctas
- Tienes permisos para crear bases de datos

---

## 🚀 Paso 2: Ejecutar el Servidor Flask

### 2.1 Iniciar el servidor

En una terminal, ejecuta:

```bash
cd tarjetas-inteligentes
python app.py
```

**Salida esperada:**
```
 * Serving Flask app 'app'
 * Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment.
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://[tu-ip]:5000
Press CTRL+C to quit
```

El servidor estará disponible en: `http://localhost:5000`

### 2.2 Verificar que el servidor funciona

Abre otra terminal y prueba:

```bash
curl http://localhost:5000/
```

**Respuesta esperada:**
```html
<h1>Sistema de Tarjetas Inteligentes</h1><p>Evento Deportivo Sierra de Arteaga</p>
```

---

## 🧪 Paso 3: Probar los Endpoints con curl

### 3.1 Registrar un Asistente

```bash
curl -X POST http://localhost:5000/api/asistentes \
  -H "Content-Type: application/json" \
  -d "{\"nombre\": \"Juan Pérez\", \"email\": \"juan@example.com\", \"telefono\": \"1234567890\"}"
```

**Respuesta esperada:**
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

**Guarda el `id` del asistente** (en este caso: `1`) para los siguientes pasos.

---

### 3.2 Listar Todos los Asistentes

```bash
curl http://localhost:5000/api/asistentes
```

**Respuesta esperada:**
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

### 3.3 Listar Puntos de Venta

Primero, veamos qué puntos de venta están disponibles:

```bash
curl http://localhost:5000/api/puntos-venta
```

**Respuesta esperada:**
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
    },
    {
      "id": 3,
      "nombre": "Tienda de Souvenirs",
      "tipo": "tienda",
      "activo": true
    },
    {
      "id": 4,
      "nombre": "Bar",
      "tipo": "bar",
      "activo": true
    }
  ]
}
```

**Guarda los IDs** de los puntos de venta (usaremos el `1` para el Restaurante Principal).

---

### 3.4 Asignar una Tarjeta a un Asistente

Usa el `id` del asistente que obtuviste en el paso 3.1 (en este ejemplo: `1`):

```bash
curl -X POST http://localhost:5000/api/tarjetas/asignar \
  -H "Content-Type: application/json" \
  -d "{\"asistente_id\": 1}"
```

**Respuesta esperada:**
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

**⚠️ IMPORTANTE: Guarda el `numero_tarjeta`** (en este ejemplo: `TARJ-123456`) para los siguientes pasos.

---

### 3.5 Consultar Saldo de una Tarjeta

Usa el `numero_tarjeta` que obtuviste en el paso anterior:

```bash
curl http://localhost:5000/api/tarjetas/saldo/TARJ-123456
```

**Nota:** Reemplaza `TARJ-123456` con el número de tarjeta real que obtuviste.

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "numero_tarjeta": "TARJ-123456",
    "asistente": "Juan Pérez",
    "saldo": 0.0,
    "saldo_formateado": "$0.00"
  }
}
```

---

### 3.6 Recargar Saldo a una Tarjeta

```bash
curl -X POST http://localhost:5000/api/tarjetas/recargar \
  -H "Content-Type: application/json" \
  -d "{\"numero_tarjeta\": \"TARJ-123456\", \"monto\": 500.00}"
```

**Nota:** Reemplaza `TARJ-123456` con tu número de tarjeta real.

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Saldo recargado correctamente: $500.00",
  "data": {
    "tarjeta": {
      "id": 1,
      "numero_tarjeta": "TARJ-123456",
      "saldo": 500.0,
      "asistente_nombre": "Juan Pérez"
    },
    "monto_recargado": 500.0,
    "saldo_anterior": 0.0,
    "saldo_nuevo": 500.0
  }
}
```

---

### 3.7 Consultar Saldo Nuevamente (Verificar Recarga)

```bash
curl http://localhost:5000/api/tarjetas/saldo/TARJ-123456
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "numero_tarjeta": "TARJ-123456",
    "asistente": "Juan Pérez",
    "saldo": 500.0,
    "saldo_formateado": "$500.00"
  }
}
```

El saldo ahora debería ser `500.00`.

---

### 3.8 Procesar un Pago

Usa el `numero_tarjeta` y el `punto_venta_id` (del paso 3.3, usaremos `1` para Restaurante Principal):

```bash
curl -X POST http://localhost:5000/api/tarjetas/pagar \
  -H "Content-Type: application/json" \
  -d "{\"numero_tarjeta\": \"TARJ-123456\", \"punto_venta_id\": 1, \"monto\": 50.00, \"descripcion\": \"Almuerzo\"}"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Pago procesado correctamente: $50.00",
  "data": {
    "tarjeta": {
      "id": 1,
      "numero_tarjeta": "TARJ-123456",
      "saldo": 450.0,
      "asistente_nombre": "Juan Pérez"
    },
    "punto_venta": "Restaurante Principal",
    "monto_pagado": 50.0,
    "saldo_anterior": 500.0,
    "saldo_nuevo": 450.0
  }
}
```

---

### 3.9 Consultar Saldo Después del Pago

```bash
curl http://localhost:5000/api/tarjetas/saldo/TARJ-123456
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "numero_tarjeta": "TARJ-123456",
    "asistente": "Juan Pérez",
    "saldo": 450.0,
    "saldo_formateado": "$450.00"
  }
}
```

El saldo debería ser `450.00` (500 - 50).

---

### 3.10 Ver Historial de Transacciones

```bash
curl http://localhost:5000/api/tarjetas/historial/TARJ-123456
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "numero_tarjeta": "TARJ-123456",
    "asistente": "Juan Pérez",
    "saldo_actual": 450.0,
    "total_transacciones": 2,
    "transacciones": [
      {
        "id": 2,
        "tipo": "pago",
        "monto": 50.0,
        "monto_formateado": "$50.00",
        "saldo_anterior": 500.0,
        "saldo_nuevo": 450.0,
        "punto_venta": "Restaurante Principal",
        "descripcion": "Almuerzo",
        "fecha": "2026-01-07 12:30:00"
      },
      {
        "id": 1,
        "tipo": "recarga",
        "monto": 500.0,
        "monto_formateado": "$500.00",
        "saldo_anterior": 0.0,
        "saldo_nuevo": 500.0,
        "punto_venta": "N/A",
        "descripcion": "Recarga de $500.00",
        "fecha": "2026-01-07 12:15:00"
      }
    ]
  }
}
```

---

## 🧪 Pruebas de Validación (Casos de Error)

### Intentar Pagar con Saldo Insuficiente

```bash
curl -X POST http://localhost:5000/api/tarjetas/pagar \
  -H "Content-Type: application/json" \
  -d "{\"numero_tarjeta\": \"TARJ-123456\", \"punto_venta_id\": 1, \"monto\": 1000.00}"
```

**Respuesta esperada (400):**
```json
{
  "success": false,
  "error": "Saldo insuficiente. Saldo actual: $450.00, Monto requerido: $1000.00"
}
```

### Intentar Asignar Segunda Tarjeta al Mismo Asistente

```bash
curl -X POST http://localhost:5000/api/tarjetas/asignar \
  -H "Content-Type: application/json" \
  -d "{\"asistente_id\": 1}"
```

**Respuesta esperada (400):**
```json
{
  "success": false,
  "error": "El asistente ya tiene una tarjeta activa"
}
```

### Consultar Tarjeta Inexistente

```bash
curl http://localhost:5000/api/tarjetas/saldo/TARJ-999999
```

**Respuesta esperada (404):**
```json
{
  "success": false,
  "error": "Tarjeta no encontrada o inactiva"
}
```

---

## 📝 Notas para Windows (PowerShell)

Si estás usando PowerShell en Windows, los comandos curl pueden necesitar ajustes:

### Opción 1: Usar comillas simples y escape de comillas dobles

```powershell
curl -X POST http://localhost:5000/api/asistentes `
  -H "Content-Type: application/json" `
  -d '{\"nombre\": \"Juan Pérez\", \"email\": \"juan@example.com\"}'
```

### Opción 2: Usar Invoke-WebRequest (nativo de PowerShell)

```powershell
$body = @{
    nombre = "Juan Pérez"
    email = "juan@example.com"
    telefono = "1234567890"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/api/asistentes `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### Opción 3: Usar comillas simples para el JSON

```powershell
curl -X POST http://localhost:5000/api/asistentes `
  -H "Content-Type: application/json" `
  -d "{'nombre': 'Juan Pérez', 'email': 'juan@example.com'}"
```

---

## ✅ Checklist de Pruebas Completadas

- [ ] Servidor Flask ejecutándose
- [ ] Base de datos inicializada
- [ ] Registrar asistente
- [ ] Listar asistentes
- [ ] Listar puntos de venta
- [ ] Asignar tarjeta
- [ ] Consultar saldo (inicial)
- [ ] Recargar saldo
- [ ] Consultar saldo (después de recarga)
- [ ] Procesar pago
- [ ] Consultar saldo (después de pago)
- [ ] Ver historial de transacciones
- [ ] Probar validaciones (errores)

---

## 🐛 Solución de Problemas

### Error: "No module named 'flask'"
**Solución:** Instala las dependencias:
```bash
pip install -r requirements.txt
```

### Error: "Error al conectar a MySQL"
**Solución:** Verifica que:
- MySQL esté ejecutándose
- Las credenciales en `config.py` sean correctas
- La base de datos exista (ejecuta `init_db.py`)

### Error: "Address already in use"
**Solución:** El puerto 5000 está ocupado. Cambia el puerto en `app.py`:
```python
app.run(debug=Config.DEBUG, host='0.0.0.0', port=5001)
```

### Error: "curl: command not found" (Windows)
**Solución:** 
- Usa PowerShell con `Invoke-WebRequest`
- O instala curl desde: https://curl.se/windows/

---

¡Listo! Ahora puedes probar todo el sistema paso a paso. 🎉

# Contexto del Proyecto - Sistema de Tarjetas Inteligentes

## Descripción General

Sistema de tarjetas inteligentes para un evento deportivo anual en la Sierra de Arteaga con aproximadamente **5000 asistentes**.

## Objetivo del Sistema

Gestionar el consumo dentro del evento usando tarjetas inteligentes con saldo electrónico.

## Funcionalidades Obligatorias

1. **Registrar asistentes** al evento
2. **Asignar una tarjeta inteligente única** a cada asistente
3. **Generar un código QR** por tarjeta (identificación única mediante QR)
4. **Cargar saldo** a la tarjeta
5. **Usar la tarjeta para realizar pagos** en:
   - Restaurante Principal
   - Cafetería
   - Tienda de Souvenirs
   - Estacionamiento
   - Bar
6. **Registrar todas las transacciones** realizadas (recargas y pagos)
7. **Consultar el saldo** de la tarjeta en tiempo real
8. **Mostrar historial de transacciones** completo

## Stack Tecnológico

- **Backend**: Flask (Python)
- **Base de Datos**: MySQL
- **Frontend**: HTML, CSS y JavaScript
- **Comunicación**: API REST para comunicación frontend-backend
- **QR Codes**: qrcode[pil] para generación de códigos QR

## Arquitectura del Proyecto

Estructura de carpetas deseada:

```
tarjetas-inteligentes/
├── app.py                 # Aplicación Flask principal
├── config.py              # Configuración
├── routes/                # Rutas de la API
│   └── api.py
├── models/                # Lógica de datos
│   ├── asistente.py
│   ├── tarjeta.py
│   ├── transaccion.py
│   └── punto_venta.py
├── db/                     # Base de datos
│   ├── database.py         # Conexión
│   ├── schema.py           # Esquema
│   └── init_db.py          # Inicialización
├── templates/              # HTML
│   └── index.html
├── static/                 # Frontend
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
└── requirements.txt        # Dependencias
```

## Reglas de Negocio Importantes

1. **Cada asistente solo puede tener una tarjeta activa**
   - No se permite asignar múltiples tarjetas al mismo asistente
   - Si un asistente ya tiene una tarjeta activa, no se puede asignar otra

2. **No se permite pagar si el saldo es insuficiente**
   - El sistema debe validar el saldo antes de procesar un pago
   - Debe mostrar un mensaje claro cuando el saldo es insuficiente

3. **Todas las operaciones deben quedar registradas**
   - Cada recarga debe generar una transacción
   - Cada pago debe generar una transacción
   - Se debe mantener un historial completo de todas las operaciones

4. **El sistema debe ser simple, claro y funcional para eventos masivos**
   - Diseño intuitivo y fácil de usar
   - Interfaz clara para operaciones rápidas
   - Optimizado para manejar ~5000 asistentes

## Principios de Desarrollo

- **Mantener compatibilidad**: No romper funcionalidades existentes
- **Organización**: Código estructurado en carpetas lógicas
- **Simplicidad**: Soluciones claras y funcionales
- **Documentación**: Código autodocumentado y comentarios cuando sea necesario
- **Consistencia**: Seguir el contexto y las reglas establecidas

## Notas Adicionales

- El sistema está diseñado para eventos masivos con alta concurrencia
- La interfaz debe ser responsive y funcional en diferentes dispositivos
- La API REST debe mantener compatibilidad con el frontend existente
- Todas las operaciones financieras deben ser precisas y auditables

---

**Última actualización**: Este contexto debe ser consultado antes de realizar cualquier cambio o adición al proyecto.

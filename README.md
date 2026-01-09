# Sistema de Tarjetas Inteligentes - Evento Deportivo Sierra de Arteaga

Sistema de gestión de tarjetas inteligentes para evento deportivo con aproximadamente 5000 asistentes.

## Tecnologías Utilizadas

- **Backend**: Python 3.x con Flask
- **Base de Datos**: MySQL
- **Frontend**: HTML simple

## Instalación

### 1. Requisitos Previos

- Python 3.7 o superior
- MySQL Server instalado y ejecutándose
- pip (gestor de paquetes de Python)

### 2. Instalación de Dependencias

```bash
pip install -r requirements.txt
```

### 3. Configuración de la Base de Datos

1. Crear una base de datos en MySQL:
```sql
CREATE DATABASE tarjetas_evento;
```

2. Configurar las credenciales en el archivo `config.py` (se creará en el siguiente paso)

### 4. Ejecutar la Aplicación

```bash
python app.py
```

La aplicación estará disponible en: `http://localhost:5000`

## Estructura del Proyecto

```
proyecto/
├── app.py                 # Aplicación Flask principal
├── database.py            # Configuración y conexión a MySQL
├── models.py              # Modelos de datos
├── routes.py              # Rutas/endpoints de la API
├── config.py              # Configuración de la aplicación
├── templates/             # HTML templates
├── static/                # Archivos estáticos (CSS)
├── requirements.txt       # Dependencias Python
└── README.md              # Este archivo
```

## Funcionalidades

- Registro de asistentes
- Asignación de tarjetas inteligentes
- Carga de saldo a tarjetas
- Procesamiento de pagos en puntos de venta
- Consulta de saldo en tiempo real
- Historial de transacciones

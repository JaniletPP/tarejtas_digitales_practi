# 🚀 Guía para Subir la Aplicación a Hosting Gratuito

## Opciones Recomendadas (Gratuitas)

### 1. **Render.com** (⭐ RECOMENDADO)
- ✅ Gratis para aplicaciones web
- ✅ Base de datos PostgreSQL gratuita (puedes adaptar MySQL)
- ✅ SSL automático
- ✅ Deploy automático desde GitHub
- ⚠️ Se "duerme" después de 15 min de inactividad (gratis)

### 2. **Railway.app**
- ✅ Gratis con $5 de crédito mensual
- ✅ Base de datos MySQL disponible
- ✅ Deploy automático desde GitHub
- ⚠️ Créditos limitados

### 3. **PythonAnywhere**
- ✅ Gratis para aplicaciones básicas
- ✅ Base de datos MySQL incluida
- ⚠️ Limitado a 1 aplicación gratuita

---

## 📋 Pasos para Deploy en Render.com

### Paso 1: Preparar el Proyecto

1. **Crear archivo `render.yaml`** (opcional, para configuración automática)

2. **Crear archivo `Procfile`** (necesario):
```txt
web: gunicorn app:app
```

3. **Actualizar `requirements.txt`** (agregar gunicorn):
```txt
gunicorn==21.2.0
```

4. **Modificar `app.py`** para que funcione en producción:
```python
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
```

### Paso 2: Crear Cuenta en Render

1. Ve a https://render.com
2. Regístrate con GitHub
3. Conecta tu repositorio

### Paso 3: Crear Base de Datos PostgreSQL

1. En Render Dashboard → New → PostgreSQL
2. Nombre: `tarjetas-db`
3. Plan: Free
4. Guarda las credenciales (Database URL)

### Paso 4: Crear Web Service

1. En Render Dashboard → New → Web Service
2. Conecta tu repositorio de GitHub
3. Configuración:
   - **Name**: `tarjetas-inteligentes`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: Free

4. **Variables de Entorno**:
   ```
   DATABASE_URL=<tu_database_url_de_postgres>
   FLASK_ENV=production
   SECRET_KEY=<genera_una_clave_secreta>
   ```

### Paso 5: Adaptar para PostgreSQL

Si usas PostgreSQL en lugar de MySQL:

1. Instalar psycopg2:
```bash
pip install psycopg2-binary
```

2. Actualizar `database.py` para usar PostgreSQL:
```python
# Cambiar de MySQL a PostgreSQL
connection = psycopg2.connect(
    host=host,
    database=database,
    user=user,
    password=password,
    port=port
)
```

---

## 📋 Pasos para Deploy en Railway.app

### Paso 1: Preparar el Proyecto

1. Crear `Procfile`:
```txt
web: gunicorn app:app
```

2. Actualizar `requirements.txt` con gunicorn

### Paso 2: Crear Cuenta

1. Ve a https://railway.app
2. Regístrate con GitHub
3. New Project → Deploy from GitHub

### Paso 3: Agregar Base de Datos MySQL

1. En tu proyecto → New → Database → MySQL
2. Railway crea automáticamente las variables de entorno

### Paso 4: Configurar Variables

Railway detecta automáticamente Flask, pero asegúrate de tener:
- `DATABASE_URL` (automático)
- `SECRET_KEY` (genera una)
- `FLASK_ENV=production`

---

## 📋 Pasos para Deploy en PythonAnywhere

### Paso 1: Crear Cuenta

1. Ve a https://www.pythonanywhere.com
2. Crea cuenta gratuita

### Paso 2: Subir Código

1. **Opción A**: Clonar desde GitHub
   ```bash
   cd ~
   git clone https://github.com/JaniletPP/tarejtas_digitales_practi.git
   ```

2. **Opción B**: Subir archivos manualmente

### Paso 3: Configurar Base de Datos

1. Databases → Crear nueva base de datos MySQL
2. Guarda credenciales

### Paso 4: Configurar Web App

1. Web → Add a new web app
2. Selecciona Flask
3. Python 3.10
4. Ruta: `/home/tu_usuario/tarejtas_digitales_practi/app.py`

### Paso 5: Configurar WSGI

Edita el archivo WSGI:
```python
import sys
path = '/home/tu_usuario/tarejtas_digitales_practi'
if path not in sys.path:
    sys.path.append(path)

from app import app as application
```

### Paso 6: Variables de Entorno

En Web → Environment variables:
```
DATABASE_URL=mysql://usuario:password@host/database
SECRET_KEY=tu_clave_secreta
```

---

## 🔧 Configuraciones Importantes

### 1. Actualizar `config.py` para producción:

```python
import os

class Config:
    # Usar variable de entorno o valor por defecto
    DATABASE_URL = os.environ.get('DATABASE_URL') or 'mysql://...'
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'cambiar-en-produccion'
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
```

### 2. Crear `.env.example` (ya existe, verificar)

### 3. Agregar a `.gitignore`:
```
.env
__pycache__/
*.pyc
instance/
```

---

## 🚨 Importante antes de Deploy

1. **Cambiar SECRET_KEY** en producción
2. **No subir `.env`** con credenciales reales
3. **Usar HTTPS** (Render y Railway lo hacen automático)
4. **Configurar CORS** si es necesario
5. **Probar localmente** con `gunicorn` antes de deploy

---

## 📝 Comandos Útiles

### Probar localmente con Gunicorn:
```bash
pip install gunicorn
gunicorn app:app
```

### Ver logs en producción:
- **Render**: Dashboard → Logs
- **Railway**: Deployments → View Logs
- **PythonAnywhere**: Web → Error log / Server log

---

## 🎯 Recomendación Final

**Para empezar rápido**: Usa **Render.com**
- Más fácil de configurar
- PostgreSQL gratuito (solo necesitas adaptar el código)
- Deploy automático desde GitHub
- SSL incluido

¿Necesitas ayuda adaptando el código para PostgreSQL o configurando el deploy?

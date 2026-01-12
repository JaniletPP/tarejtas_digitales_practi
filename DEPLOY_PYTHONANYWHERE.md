# 🚀 Guía Completa para Deploy en PythonAnywhere

## 📋 Paso 1: Crear Cuenta en PythonAnywhere

1. Ve a **https://www.pythonanywhere.com**
2. Click en **"Sign up for free"** (o "Create account")
3. Completa el registro:
   - Username: (el que elijas será tu dominio: `tuusuario.pythonanywhere.com`)
   - Email: tu email
   - Password: contraseña segura
4. Verifica tu email

---

## 📋 Paso 2: Subir tu Código

### Opción A: Clonar desde GitHub (RECOMENDADO)

1. En PythonAnywhere, ve a la pestaña **"Consoles"**
2. Click en **"Bash"** (abre una terminal)
3. Ejecuta:
   ```bash
   cd ~
   git clone https://github.com/JaniletPP/tarejtas_digitales_practi.git
   cd tarejtas_digitales_practi
   ```

### Opción B: Subir archivos manualmente

1. En PythonAnywhere, ve a la pestaña **"Files"**
2. Navega a `/home/tuusuario/`
3. Click en **"Upload a file"**
4. Sube todos los archivos de tu proyecto

---

## 📋 Paso 3: Instalar Dependencias

1. En la pestaña **"Consoles"**, abre **"Bash"**
2. Ejecuta:
   ```bash
   cd ~/tarejtas_digitales_practi
   pip3.10 install --user -r requirements.txt
   ```

   ⚠️ **Nota**: PythonAnywhere usa Python 3.10, asegúrate de usar `pip3.10`

---

## 📋 Paso 4: Crear Base de Datos MySQL

1. En PythonAnywhere, ve a la pestaña **"Databases"**
2. Click en **"Create"** para crear una nueva base de datos MySQL
3. Anota las credenciales:
   - **Host**: `tuusuario.mysql.pythonanywhere-services.com`
   - **Username**: `tuusuario`
   - **Database name**: `tuusuario$tarjetas_evento`
   - **Password**: (la que te muestre)

---

## 📋 Paso 5: Configurar Variables de Entorno

1. En la pestaña **"Files"**, navega a `/home/tuusuario/tarejtas_digitales_practi/`
2. Crea un archivo `.env` (click en "New file")
3. Agrega:
   ```
   DATABASE_HOST=tuusuario.mysql.pythonanywhere-services.com
   DATABASE_USER=tuusuario
   DATABASE_PASSWORD=tu_password_de_mysql
   DATABASE_NAME=tuusuario$tarjetas_evento
   SECRET_KEY=tu_clave_secreta_muy_larga_y_aleatoria
   FLASK_ENV=production
   DEBUG=False
   ```

   ⚠️ **IMPORTANTE**: Reemplaza `tuusuario` con tu username de PythonAnywhere

---

## 📋 Paso 6: Inicializar la Base de Datos

1. En **"Consoles"** → **"Bash"**, ejecuta:
   ```bash
   cd ~/tarejtas_digitales_practi
   python3.10 init_db.py
   ```

   Esto creará todas las tablas necesarias.

---

## 📋 Paso 7: Configurar la Aplicación Web

1. En PythonAnywhere, ve a la pestaña **"Web"**
2. Click en **"Add a new web app"**
3. Selecciona:
   - **Domain**: `tuusuario.pythonanywhere.com`
   - **Python Web Framework**: Flask
   - **Python version**: Python 3.10
   - **Path**: `/home/tuusuario/tarejtas_digitales_practi/app.py`
4. Click en **"Next"** y luego **"Finish"**

---

## 📋 Paso 8: Configurar WSGI

1. En la pestaña **"Web"**, busca **"WSGI configuration file"**
2. Click en el enlace (algo como `/var/www/tuusuario_pythonanywhere_com_wsgi.py`)
3. **BORRA TODO** el contenido y reemplázalo con:

```python
import sys
import os

# Agregar el directorio del proyecto al path
path = '/home/tuusuario/tarejtas_digitales_practi'
if path not in sys.path:
    sys.path.insert(0, path)

# Cambiar al directorio del proyecto
os.chdir(path)

# Importar la aplicación
from app import app as application

# Configurar variables de entorno si es necesario
if not os.environ.get('DATABASE_HOST'):
    os.environ['DATABASE_HOST'] = 'tuusuario.mysql.pythonanywhere-services.com'
    os.environ['DATABASE_USER'] = 'tuusuario'
    os.environ['DATABASE_PASSWORD'] = 'tu_password'
    os.environ['DATABASE_NAME'] = 'tuusuario$tarjetas_evento'
    os.environ['SECRET_KEY'] = 'tu_clave_secreta'
    os.environ['FLASK_ENV'] = 'production'
```

⚠️ **IMPORTANTE**: Reemplaza `tuusuario` con tu username real y `tu_password` con tu password de MySQL.

---

## 📋 Paso 9: Configurar Rutas Estáticas

1. En la pestaña **"Web"**, busca **"Static files"**
2. Agrega:
   - **URL**: `/static/`
   - **Directory**: `/home/tuusuario/tarejtas_digitales_practi/static/`

---

## 📋 Paso 10: Verificar Configuración de Base de Datos

1. Edita `config.py` para que funcione con las variables de entorno:

```python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Base de datos
    DATABASE_HOST = os.environ.get('DATABASE_HOST') or 'localhost'
    DATABASE_USER = os.environ.get('DATABASE_USER') or 'root'
    DATABASE_PASSWORD = os.environ.get('DATABASE_PASSWORD') or ''
    DATABASE_NAME = os.environ.get('DATABASE_NAME') or 'tarjetas_evento'
    DATABASE_PORT = int(os.environ.get('DATABASE_PORT', 3306))
    
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'cambiar-en-produccion'
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    # Uploads
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads', 'fotos_perfil')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    
    # Crear directorio de uploads si no existe
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
```

---

## 📋 Paso 11: Crear Directorios Necesarios

1. En **"Consoles"** → **"Bash"**, ejecuta:
   ```bash
   cd ~/tarejetas-inteligentes
   mkdir -p static/uploads/fotos_perfil
   mkdir -p static/qr_codes
   ```

---

## 📋 Paso 12: Reiniciar la Aplicación

1. En la pestaña **"Web"**, busca el botón **"Reload"** o **"Reload tuusuario.pythonanywhere.com"**
2. Click en **"Reload"**
3. Espera unos segundos

---

## 📋 Paso 13: Probar la Aplicación

1. Ve a: `https://tuusuario.pythonanywhere.com`
2. Deberías ver tu aplicación funcionando

---

## 🔧 Solución de Problemas Comunes

### Error: "No module named 'flask'"
**Solución**: Instala las dependencias:
```bash
pip3.10 install --user -r requirements.txt
```

### Error: "Can't connect to MySQL server"
**Solución**: 
1. Verifica que las credenciales en `.env` sean correctas
2. Verifica que el nombre de la base de datos tenga el formato: `tuusuario$nombre_db`

### Error: "Permission denied"
**Solución**: 
```bash
chmod 755 ~/tarejetas-inteligentes
chmod 755 ~/tarejetas-inteligentes/static
```

### La aplicación no carga
**Solución**:
1. Revisa los **Error logs** en la pestaña "Web"
2. Revisa los **Server logs** para ver errores de Python
3. Verifica que el WSGI esté configurado correctamente

### Error 500 Internal Server Error
**Solución**:
1. Ve a **"Web"** → **"Error log"**
2. Lee el error específico
3. Verifica que todas las rutas estén correctas

---

## 📝 Comandos Útiles

### Ver logs de la aplicación:
- **Error log**: Pestaña "Web" → "Error log"
- **Server log**: Pestaña "Web" → "Server log"

### Reiniciar aplicación:
- Pestaña "Web" → Botón "Reload"

### Actualizar código desde GitHub:
```bash
cd ~/tarejetas-inteligentes
git pull origin main
```
Luego recarga la aplicación en "Web"

### Verificar que la base de datos funciona:
```bash
cd ~/tarejetas-inteligentes
python3.10
>>> from database import get_connection
>>> conn = get_connection()
>>> print("Conexión exitosa!")
```

---

## 🎯 Checklist Final

Antes de considerar el deploy completo, verifica:

- [ ] Código subido a PythonAnywhere
- [ ] Dependencias instaladas (`pip3.10 install --user -r requirements.txt`)
- [ ] Base de datos MySQL creada
- [ ] Archivo `.env` configurado con credenciales correctas
- [ ] Base de datos inicializada (`python3.10 init_db.py`)
- [ ] Web app creada en PythonAnywhere
- [ ] WSGI configurado correctamente
- [ ] Rutas estáticas configuradas
- [ ] Directorios de uploads creados
- [ ] Aplicación recargada
- [ ] Sitio accesible en `tuusuario.pythonanywhere.com`
- [ ] Login funciona correctamente
- [ ] Base de datos funciona

---

## 🚨 Limitaciones del Plan Gratuito

- ✅ 1 aplicación web
- ✅ Base de datos MySQL incluida
- ✅ 512 MB de almacenamiento
- ⚠️ Solo puedes acceder desde `tuusuario.pythonanywhere.com` (no dominio personalizado)
- ⚠️ La aplicación se "duerme" después de inactividad (se despierta al primer acceso)
- ⚠️ Límite de CPU: 100 segundos/día

---

## 💡 Tips Adicionales

1. **Backup**: Haz backup de tu base de datos regularmente
2. **Logs**: Revisa los logs regularmente para detectar errores
3. **Actualizaciones**: Usa `git pull` para actualizar el código
4. **Testing**: Prueba todas las funcionalidades después del deploy

---

¿Necesitas ayuda con algún paso específico? ¡Avísame!

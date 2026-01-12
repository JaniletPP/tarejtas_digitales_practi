# 🔧 Solución: Error de Autenticación Git en PythonAnywhere

## ❌ Problema
GitHub ya no permite autenticación con contraseña. Necesitas usar un **Personal Access Token (PAT)**.

---

## ✅ SOLUCIÓN 1: Hacer el Repositorio Público (MÁS RÁPIDO)

### Pasos:
1. Ve a tu repositorio en GitHub: https://github.com/JaniletPP/tarejtas_digitales_practi
2. Click en **"Settings"** (Configuración)
3. Scroll hacia abajo hasta **"Danger Zone"**
4. Click en **"Change visibility"** → **"Make public"**
5. Confirma

### Luego en PythonAnywhere:
```bash
cd ~
git clone https://github.com/JaniletPP/tarejtas_digitales_practi.git
cd tarejetas_digitales_practi
```

✅ **Ventaja**: No necesitas token, funciona inmediatamente
⚠️ **Desventaja**: Cualquiera puede ver tu código (pero no puede modificarlo sin permisos)

---

## ✅ SOLUCIÓN 2: Usar Personal Access Token (MÁS SEGURO)

### Paso 1: Crear Token en GitHub

1. Ve a GitHub → Click en tu foto de perfil (arriba derecha)
2. Click en **"Settings"**
3. En el menú lateral izquierdo, click en **"Developer settings"** (al final)
4. Click en **"Personal access tokens"** → **"Tokens (classic)"**
5. Click en **"Generate new token"** → **"Generate new token (classic)"**
6. Configura:
   - **Note**: `PythonAnywhere Deploy`
   - **Expiration**: Elige una fecha (ej: 90 días)
   - **Scopes**: Marca solo **`repo`** (acceso completo a repositorios)
7. Click en **"Generate token"**
8. ⚠️ **COPIA EL TOKEN INMEDIATAMENTE** (solo se muestra una vez)
   - Se verá algo como: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Paso 2: Usar el Token en PythonAnywhere

En PythonAnywhere, ejecuta:

```bash
cd ~
git clone https://ghp_TU_TOKEN_AQUI@github.com/JaniletPP/tarejtas_digitales_practi.git
```

**Reemplaza `ghp_TU_TOKEN_AQUI` con tu token real**

Ejemplo:
```bash
git clone https://ghp_abc123xyz456@github.com/JaniletPP/tarejtas_digitales_practi.git
```

### Alternativa: Configurar Git Credential Helper

```bash
git config --global credential.helper store
git clone https://github.com/JaniletPP/tarejtas_digitales_practi.git
# Cuando pida username: JaniletPP
# Cuando pida password: Pega tu token aquí
```

---

## ✅ SOLUCIÓN 3: Subir Archivos Manualmente (SIN GIT)

Si ninguna de las anteriores funciona:

1. En tu computadora local, comprime el proyecto:
   ```bash
   # En Windows, crea un ZIP del proyecto
   ```

2. En PythonAnywhere:
   - Ve a la pestaña **"Files"**
   - Navega a `/home/tuusuario/`
   - Click en **"Upload a file"**
   - Sube el ZIP
   - Click derecho en el ZIP → **"Extract here"**

3. Luego continúa con los pasos de la guía de deploy

---

## 🎯 RECOMENDACIÓN

**Para empezar rápido**: Usa la **Solución 1** (hacer el repo público)
- Es la más rápida
- No necesitas crear tokens
- Puedes hacerlo privado después si quieres

**Para producción**: Usa la **Solución 2** (token)
- Más seguro
- El repositorio sigue privado
- Mejor práctica

---

## 📝 Después de Clonar

Una vez que hayas clonado exitosamente, continúa con:

```bash
cd ~/tarejetas_digitales_practi
pip3.10 install --user -r requirements.txt
python3.10 init_db.py
```

Y sigue con los pasos de `DEPLOY_PYTHONANYWHERE.md`

---

¿Necesitas ayuda con algún paso? ¡Avísame!

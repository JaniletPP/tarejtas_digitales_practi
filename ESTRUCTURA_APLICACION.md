# 📋 Estructura de la Aplicación - Tarjetas Inteligentes

## 🎯 Resumen

La aplicación tiene **3 módulos completamente separados**, cada uno con su propia interfaz y funcionalidad:

1. **Admin** - Panel de administración
2. **Punto de Venta (POS)** - Caja registradora
3. **Recargas** - Estación de recarga de tarjetas

---

## 📁 Estructura de Módulos

### 1. 🔐 ADMIN (`/admin/dashboard`)
**Ruta**: `http://localhost:5000/admin/dashboard`  
**Rol requerido**: `admin`  
**Template**: `templates/admin/dashboard.html`  
**JavaScript**: `static/js/admin-base.js`

**Funcionalidades**:
- ✅ Gestión de Asistentes (registrar, listar)
- ✅ Gestión de Tarjetas (asignar, consultar, escanear QR)
- ✅ Gestión de Productos (crear, listar, buscar)
- ✅ Reportes de Ventas
- ✅ Reportes de Transacciones
- ✅ Mi Perfil (editar perfil, subir foto)

**Acceso**:
- Usuario: `admin`
- Password: `admin123`

---

### 2. 💰 PUNTO DE VENTA (POS) (`/pos`)
**Ruta**: `http://localhost:5000/pos`  
**Rol requerido**: `punto_venta`  
**Template**: `templates/pos/index.html`  
**JavaScript**: `static/js/pos.js`

**Funcionalidades**:
- ✅ Escanear/Buscar tarjeta
- ✅ Ver saldo disponible
- ✅ Agregar productos al carrito
- ✅ Procesar pagos
- ✅ Ver historial de transacciones
- ✅ Escanear QR de tarjetas

**Acceso**:
- Usuario: `punto_venta`
- Password: `venta123`

---

### 3. 💳 RECARGAS (`/recargas`)
**Ruta**: `http://localhost:5000/recargas`  
**Rol requerido**: `recargas`  
**Template**: `templates/recargas/index.html`  
**JavaScript**: `static/js/recargas.js`

**Funcionalidades**:
- ✅ Escanear/Buscar tarjeta
- ✅ Recargar saldo
- ✅ Consultar saldo
- ✅ Ver historial de transacciones
- ✅ Escanear QR de tarjetas

**Acceso**:
- Usuario: `recargas`
- Password: `recarga123`

---

## 🔄 Flujo de Acceso

```
1. Usuario va a: http://localhost:5000/
2. Si no está logueado → Redirige a /login
3. Usuario inicia sesión
4. Según su rol, redirige a:
   - admin → /admin/dashboard
   - punto_venta → /pos
   - recargas → /recargas
```

---

## 📂 Estructura de Archivos

```
templates/
├── admin/
│   └── dashboard.html      # Panel completo de administración
├── pos/
│   └── index.html          # Interfaz de punto de venta
├── recargas/
│   └── index.html          # Interfaz de recargas
├── login.html              # Página de login
├── index.html              # Página principal (redirige según rol)
└── scan.html               # Escaneo público de QR

static/js/
├── admin-base.js           # Lógica del panel admin
├── pos.js                  # Lógica del punto de venta
└── recargas.js             # Lógica de recargas
```

---

## 🎭 Roles y Permisos

### Admin
- ✅ Acceso completo a `/admin/dashboard`
- ✅ Puede gestionar asistentes, tarjetas, productos
- ✅ Puede ver reportes
- ❌ NO puede acceder a `/pos` o `/recargas` (redirige a su dashboard)

### Punto de Venta
- ✅ Acceso a `/pos`
- ✅ Puede procesar pagos
- ✅ Puede ver productos y tarjetas
- ❌ NO puede acceder a `/admin/dashboard` o `/recargas`

### Recargas
- ✅ Acceso a `/recargas`
- ✅ Puede recargar tarjetas
- ✅ Puede consultar saldos
- ❌ NO puede acceder a `/admin/dashboard` o `/pos`

---

## 🔗 Rutas Principales

| Ruta | Rol | Descripción |
|------|-----|-------------|
| `/` | Todos | Redirige según rol |
| `/login` | Público | Página de login |
| `/admin/dashboard` | Admin | Panel de administración |
| `/pos` | Punto Venta | Interfaz de punto de venta |
| `/recargas` | Recargas | Interfaz de recargas |
| `/scan` | Público | Escaneo público de QR |

---

## 💡 Respuesta a tu Pregunta

**¿El admin incluye el punto de venta?**

**NO**, son módulos completamente separados:

- **Admin** (`/admin/dashboard`): Solo gestión administrativa
  - Asistentes, Tarjetas, Productos, Reportes
  
- **Punto de Venta** (`/pos`): Solo para ventas
  - Escanear tarjeta, agregar productos, procesar pagos
  
- **Recargas** (`/recargas`): Solo para recargas
  - Recargar saldo, consultar saldo

Cada módulo tiene su propia URL, template y JavaScript.

---

## 🧪 Cómo Probar Cada Módulo

### Probar Admin:
1. Ve a: `http://localhost:5000/login`
2. Usuario: `admin`
3. Password: `admin123`
4. Te redirige a `/admin/dashboard`

### Probar Punto de Venta:
1. Ve a: `http://localhost:5000/login`
2. Usuario: `punto_venta`
3. Password: `venta123`
4. Te redirige a `/pos`

### Probar Recargas:
1. Ve a: `http://localhost:5000/login`
2. Usuario: `recargas`
3. Password: `recarga123`
4. Te redirige a `/recargas`

---

## 📝 Notas Importantes

1. **Cada módulo es independiente**: No se mezclan funcionalidades
2. **Seguridad por roles**: Cada usuario solo ve su módulo
3. **Misma base de datos**: Todos comparten la misma BD pero con diferentes vistas
4. **Admin puede ver todo**: El admin tiene acceso completo desde su dashboard

---

¿Tienes alguna duda sobre la estructura? ¡Avísame!

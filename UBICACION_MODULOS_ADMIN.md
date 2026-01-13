# 📍 Ubicación de Módulos en el Panel Admin

## 🎯 Ubicación del Módulo "Punto de Venta"

### **En el Menú Lateral (Sidebar)**:

El módulo **"🛒 Punto de Venta"** aparece en el menú lateral del admin, en el siguiente orden:

1. 📊 **Dashboard**
2. ⚙️ **Gestión** (dropdown)
   - 👥 Asistentes
   - 💳 Tarjetas
   - 🛍️ Productos
3. 📈 **Reportes** (dropdown)
   - 💰 Ventas
   - 📜 Transacciones
4. 💰 **Caja** ← Recarga de saldo
5. 🛒 **Punto de Venta** ← **AQUÍ ESTÁ** ← Procesar ventas
6. 👤 **Mi Perfil**
7. 🔧 **Configuración**

---

## 🖥️ Cómo Acceder

### **Opción 1: Desde el Menú Lateral**
1. Inicia sesión como admin
2. En el menú lateral izquierdo, busca **"🛒 Punto de Venta"**
3. Haz clic en **"Punto de Venta"**
4. Se abrirá la sección de Punto de Venta

### **Opción 2: Directo desde el código**
- El `data-section` es: `punto-venta`
- La sección HTML tiene el ID: `section-punto-venta`

---

## 📋 Estructura del Módulo Punto de Venta

Una vez que entres al módulo, verás:

### **Columna Izquierda**:
1. **Selector de Punto de Venta**
   - Dropdown para seleccionar: Bar, Snack, Restaurante 1, Restaurante 2, Estacionamiento

2. **Buscar Tarjeta**
   - Input para número de tarjeta (TARJ-XXXXXX)
   - Botón para escanear QR
   - Botón "Buscar Tarjeta"
   - Panel de información de tarjeta (se muestra después de buscar)

3. **Productos Disponibles**
   - Grid de productos del punto de venta seleccionado
   - Agrupados por tipo (bebida, comida, postre, etc.)

### **Columna Derecha**:
1. **Carrito de Compras**
   - Lista de productos agregados
   - Botones para modificar cantidad (+/-)
   - Botón para eliminar productos
   - Resumen con subtotal y total
   - Botón "Procesar Venta"

2. **Ventas Recientes**
   - Historial de las últimas 10 ventas realizadas

---

## 🔍 Si No Aparece el Menú

### **Verificaciones**:

1. **¿Recargaste la página?**
   - Presiona `Ctrl + F5` para recargar sin caché

2. **¿Estás en la rama correcta?**
   - Verifica que estés en la rama `jani` o `main` con los últimos cambios

3. **¿Hay errores en la consola?**
   - Abre la consola del navegador (F12)
   - Busca errores en rojo
   - Verifica que `admin-base.js` se esté cargando

4. **¿El menú está visible?**
   - El menú lateral debe estar visible en el lado izquierdo
   - Si no aparece, verifica que no haya errores de CSS

---

## 📸 Ubicación Visual

```
┌─────────────────────────────────────────┐
│  SISTEMA DE TARJETAS                    │
│  Sierra de Arteaga                      │
├─────────────────────────────────────────┤
│  📊 Dashboard                           │
│  ⚙️ Gestión ▼                           │
│  📈 Reportes ▼                           │
│  💰 Caja                                 │
│  🛒 Punto de Venta  ← AQUÍ              │
│  👤 Mi Perfil                           │
│  🔧 Configuración                        │
└─────────────────────────────────────────┘
```

---

## ✅ Confirmación

El módulo **"🛒 Punto de Venta"** debería aparecer:
- ✅ En el menú lateral, después de "💰 Caja"
- ✅ Antes de "👤 Mi Perfil"
- ✅ Con el ícono 🛒 y el texto "Punto de Venta"

Si no lo ves, avísame y revisamos juntos.

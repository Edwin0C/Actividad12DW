# Lümenik - Sistema de Gestión de Instalación y Descarga de Juegos

## 📋 Descripción del Proyecto

**Lümenik** es una aplicación web diseñada para automatizar y modernizar el proceso de gestión de instalación y descarga de juegos en consolas (PSP, PS2, PS3, PS4). 

### Problema a Resolver
Actualmente, el almacén Lümenik registra manualmente en archivos de Word:
- Información de clientes
- Historial de trabajos realizados
- Detalles de instalaciones y descargas
- Disponibilidad de juegos

Esta gestión manual es ineficiente, propensa a errores y dificulta el seguimiento de información.

### Solución Propuesta
Una aplicación web moderna que:
1. **Centraliza la información** de clientes, juegos y servicios
2. **Permite a clientes** consultar y seleccionar juegos por consola
3. **Ofrece a empleados** herramientas para gestionar historial de clientes
4. **Automatiza procesos** de registro y consulta de información
5. **Proporciona interfaz responsiva** para usar desde cualquier dispositivo

---

## 🎮 Características Principales

### Para Clientes
- Autenticación mediante usuario y contraseña
- Catálogo de juegos por consola (PSP, PS2, PS3, PS4)
- Visualización de imagen, nombre, peso (GB) de cada juego
- Selección múltiple de juegos con suma automática de GB
- Verificación de espacio disponible (4GB, 8GB, etc.)
- Solicitud de instalación/descarga

### Para Empleados
- Panel de gestión de clientes asignados
- Registro de trabajos realizados
- Seguimiento de fechas y horas de servicios
- Descripción detallada de instalaciones

### Para Administrador
- Gestión completa de usuarios
- Asignación de roles a empleados
- Creación y gestión de juegos
- Visualización de reportes

---

## 🛠️ Stack Tecnológico

### Backend
- **Lenguaje**: Python 3.9+
- **Framework**: Flask (con extensiones para autenticación y base de datos)
- **ORM**: PyMongo para MongoDB
- **Autenticación**: JWT (JSON Web Tokens)

### Frontend
- **HTML5** - Estructura semántica
- **CSS3 + Tailwind CSS** - Estilos responsivos
- **JavaScript (Vanilla)** - Interactividad del lado cliente
- **Responsive Design** - Optimizado para móviles, tablets y escritorio

### Base de Datos
- **MongoDB** (instalado localmente)
- Base de datos: `lumenik_db`

---

## 📁 Estructura del Proyecto

```
Lumenik_App/
│
├── backend/
│   ├── modelos/
│   │   ├── usuario.py              # Modelo de Usuario
│   │   ├── cliente.py              # Modelo de Cliente
│   │   ├── juego.py                # Modelo de Juego
│   │   └── registro_trabajo.py      # Modelo de Registro de Trabajos
│   │
│   ├── controladores/
│   │   ├── auth_controlador.py      # Gestión de autenticación
│   │   ├── usuario_controlador.py   # Gestión de usuarios
│   │   ├── juego_controlador.py     # Gestión de juegos
│   │   └── trabajo_controlador.py   # Gestión de registros
│   │
│   ├── rutas/
│   │   ├── auth_rutas.py            # Rutas de autenticación
│   │   ├── usuario_rutas.py         # Rutas de usuarios
│   │   ├── juego_rutas.py           # Rutas de juegos
│   │   └── trabajo_rutas.py         # Rutas de trabajos
│   │
│   ├── app.py                       # Aplicación principal Flask
│   ├── configuracion.py             # Configuración de la aplicación
│   ├── requisitos.txt               # Dependencias Python
│   └── datos_ejemplo.py             # Script para llenar BD con datos de prueba
│
├── frontend/
│   ├── index.html                   # Página de inicio/login
│   ├── dashboard_cliente.html       # Panel del cliente
│   ├── dashboard_empleado.html      # Panel del empleado
│   ├── dashboard_admin.html         # Panel del administrador
│   ├── seleccionar_juegos.html      # Selector de juegos
│   ├── gestionar_clientes.html      # Gestión de clientes (empleado)
│   │
│   ├── css/
│   │   ├── estilos.css              # Estilos personalizados
│   │   └── responsive.css           # Media queries
│   │
│   ├── js/
│   │   ├── autenticacion.js         # Manejo de login
│   │   ├── cliente_dashboard.js     # Lógica de panel cliente
│   │   ├── selector_juegos.js       # Lógica de selección de juegos
│   │   ├── empleado_dashboard.js    # Lógica de panel empleado
│   │   ├── admin_dashboard.js       # Lógica de panel administrador
│   │   ├── api.js                   # Funciones de API
│   │   └── utilidades.js            # Funciones auxiliares
│   │
│   └── imagenes/                    # Imágenes de juegos
│
├── documentacion/
│   ├── MANUAL_USUARIO.md            # Manual para usuarios finales
│   ├── MANUAL_TECNICO.md            # Manual técnico para desarrolladores
│   ├── DIAGRAMA_BD.md               # Descripción de la estructura de BD
│   └── API_ENDPOINTS.md             # Documentación de API REST
│
└── .env.ejemplo                     # Variables de entorno de ejemplo
```

---

## 🗄️ Estructura de Base de Datos (MongoDB)

### Colecciones

#### **usuarios**
```json
{
  "_id": ObjectId,
  "nombre_usuario": "string",
  "contraseña_hash": "string",
  "email": "string",
  "rol": "administrador|empleado|cliente",
  "nombre_completo": "string",
  "telefono": "string",
  "fecha_creacion": "datetime",
  "estado": "activo|inactivo"
}
```

#### **clientes**
```json
{
  "_id": ObjectId,
  "usuario_id": ObjectId,
  "telefono": "string",
  "direccion": "string",
  "ciudad": "string",
  "cliente_desde": "datetime",
  "consolas_principales": ["PSP", "PS2", "PS3", "PS4"]
}
```

#### **juegos**
```json
{
  "_id": ObjectId,
  "nombre": "string",
  "consola": "PSP|PS2|PS3|PS4",
  "peso_gb": "float",
  "descripcion": "string",
  "imagen_url": "string",
  "fecha_agregado": "datetime",
  "disponible": "boolean"
}
```

#### **registros_trabajo**
```json
{
  "_id": ObjectId,
  "cliente_id": ObjectId,
  "empleado_id": ObjectId,
  "tipo_servicio": "instalacion|descarga",
  "juegos_instalados": [ObjectId],
  "descripcion": "string",
  "fecha_inicio": "datetime",
  "fecha_fin": "datetime",
  "costo": "float",
  "estado": "completado|pendiente|cancelado"
}
```

---

## 🚀 Cómo Ejecutar el Proyecto

### Requisitos Previos
- Python 3.9+
- MongoDB instalado localmente
- Navegador web moderno
- Visual Studio Code o editor similar

### Pasos de Instalación

1. **Clonar/Descargar el proyecto**
   ```bash
   cd Lumenik_App
   ```

2. **Crear entorno virtual Python**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # En Windows
   ```

3. **Instalar dependencias**
   ```bash
   pip install -r backend/requisitos.txt
   ```

4. **Verificar MongoDB**
   - Asegurarse de que MongoDB está corriendo localmente
   - Crear base de datos: `lumenik_db`

5. **Llenar datos de ejemplo**
   ```bash
   python backend/datos_ejemplo.py
   ```

6. **Ejecutar la aplicación**
   ```bash
   python backend/app.py
   ```

7. **Abrir en navegador**
   - Ir a: `http://localhost:5000`

---

## 👥 Usuarios de Prueba

| Usuario | Contraseña | Rol | Email |
|---------|-----------|-----|-------|
| admin | admin123 | administrador | admin@lumenik.com |
| empleado1 | emp123 | empleado | empleado@lumenik.com |
| cliente1 | cli123 | cliente | cliente@lumenik.com |

---

## 📝 Documentación Adicional

- [Manual de Usuario](./documentacion/MANUAL_USUARIO.md)
- [Manual Técnico](./documentacion/MANUAL_TECNICO.md)
- [Estructura de Base de Datos](./documentacion/DIAGRAMA_BD.md)
- [Endpoints de API](./documentacion/API_ENDPOINTS.md)

---

## ✨ Funcionalidades Destacadas

✅ Autenticación con JWT  
✅ Gestión de roles (Admin, Empleado, Cliente)  
✅ Catálogo responsivo de juegos por consola  
✅ Cálculo automático de GB  
✅ Sistema de registro de trabajos realizados  
✅ Interfaz amigable y moderna con Tailwind CSS  
✅ Base de datos MongoDB centralizada  
✅ API RESTful con Python/Flask  

---

## 📞 Soporte

Para consultas o reportes de errores, contactar al equipo de desarrollo de Lümenik.

---

**Versión**: 1.0  
**Fecha**: Enero 2026  
**Autor**: Ingeniero de Sistemas - Especialista en Desarrollo Web

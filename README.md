# Lümenik - Sistema de Gestión de Instalación y Descarga de Juegos

## 📁 Estructura del Proyecto

El proyecto principal se encuentra dentro del directorio `Lumenik_App`.

## 🛠️ Stack Tecnológico

### Backend
- **Lenguaje**: Python 3.9+
- **Framework**: Flask
- **Base de Datos**: MongoDB (PyMongo)
- **Autenticación**: JWT

### Frontend
- **HTML5** & **CSS3** (Tailwind CSS)
- **JavaScript** (Vanilla)

---

## 🚀 Cómo Ejecutar el Proyecto

### Requisitos Previos
- Python 3.9+
- MongoDB instalado localmente

### Pasos de Instalación

1. **Entrar al directorio de la aplicación**
   ```bash
   cd Lumenik_App
   ```

2. **Crear entorno virtual Python**
   ```bash
   python -m venv venv
   # En Windows:
   venv\Scripts\activate
   # En macOS/Linux:
   # source venv/bin/activate
   ```

3. **Instalar dependencias**
   ```bash
   pip install -r backend/requisitos.txt
   ```

4. **Verificar MongoDB**
   - Asegurarse de que MongoDB está corriendo localmente
   - La aplicación creará la base de datos `lumenik_db` automáticamente.

5. **Ejecutar la aplicación**
   ```bash
   python backend/app.py
   ```

6. **Abrir en navegador**
   - Ir a: `http://localhost:5000`

---

## 👥 Usuarios de Prueba

| Usuario | Contraseña | Rol | Email |
|---------|-----------|-----|-------|
| admin | admin123 | administrador | admin@lumenik.com |
| empleado1 | emp123 | empleado | empleado@lumenik.com |
| cliente1 | cli123 | cliente | cliente@lumenik.com |

---

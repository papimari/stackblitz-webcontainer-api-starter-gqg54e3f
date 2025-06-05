# Sistema de Gestión de Archivos con WebContainer API Papiweb

Este proyecto implementa un sistema de gestión de archivos moderno utilizando WebContainer API, con una interfaz web interactiva y una terminal Linux integrada.

## Características Principales 🚀

- **Gestión de Archivos**
  - Límite de 15MB por archivo
  - Soporte para múltiples formatos (imágenes, PDFs, documentos Office)
  - Almacenamiento seguro con MongoDB GridFS
  - Sistema de carga y descarga optimizado

- **Terminal Linux Integrada**
  - Interfaz moderna con tema Tokyo Night
  - Historial de comandos
  - Autocompletado
  - Comandos personalizados

- **Interfaz de Usuario**
  - Diseño responsivo y moderno
  - Terminal con tema oscuro
  - Visualización de archivos
  - Indicadores de progreso
  
- **Backend Robusto**
  - API RESTful
  - Sistema CRUD completo
  - Validación de tipos MIME
  - Manejo de errores avanzado

## Requisitos Previos 📋

- Node.js (versión más reciente)
- MongoDB instalado y ejecutándose
- Navegador moderno con soporte para WebContainer API

## Instalación 🔧

1. Clonar el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
cd [NOMBRE_DEL_PROYECTO]
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar MongoDB:
- Asegúrate de que MongoDB está ejecutándose en `localhost:27017`
- La base de datos se creará automáticamente

4. Iniciar la aplicación:
```bash
npm run dev
```

## Uso de la CLI 💻

El proyecto incluye una CLI para gestión de archivos. Para utilizarla:

```bash
npm run cli -- [comando]
```

Comandos disponibles:
- `list`: Listar todos los archivos
- `upload <ruta>`: Subir un archivo
- `download <id> [ruta-destino]`: Descargar un archivo
- `delete <id>`: Eliminar un archivo

## API Endpoints 🛣️

### Usuarios
- `POST /api/users`: Crear usuario
- `GET /api/users`: Listar usuarios
- `GET /api/users/:id`: Obtener usuario
- `PUT /api/users/:id`: Actualizar usuario
- `DELETE /api/users/:id`: Eliminar usuario

### Archivos
- `POST /api/files/upload`: Subir archivo
- `GET /api/files`: Listar archivos
- `GET /api/files/:id`: Descargar archivo
- `DELETE /api/files/:id`: Eliminar archivo

## Seguridad 🔒

- Validación de tipos MIME
- Límite de tamaño de archivos
- Sanitización de entradas
- Manejo seguro de archivos

### Configuración de Seguridad

El WebContainer requiere [SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer) y aislamiento de origen cruzado. El documento raíz debe servirse con:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

La aplicación debe servirse sobre HTTPS en producción (no necesario en localhost).

## Tecnologías Utilizadas 🛠️

- Express.js
- MongoDB con GridFS
- WebContainer API
- Multer para gestión de archivos
- Commander.js para la CLI
- FontAwesome para iconos

## Contribuir 🤝

Las contribuciones son bienvenidas. Por favor:
1. Haz Fork del proyecto
2. Crea una rama para tu característica
3. Haz commit de tus cambios
4. Envía un Pull Request

## Licencia 📄

Copyright 2025 Papiweb - Desarrollos Informáticos
Todos los derechos reservados

## Soporte 🍺

¿Te gusta este proyecto? Puedes [invitarnos un café](https://link.mercadopago.com.ar/papiweb)

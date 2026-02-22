# EVOL

Proyecto para gestionar clases de un gimnasio con **dos clientes**:

- **Escritorio/Web:** Vue 3 + Vite (y si quieres, se puede arrancar en Electron)
- **Móvil:** React Native con Expo

Las dos apps hacen lo mismo a nivel de usuario: registro/login, ver clases, apuntarse y cancelar.  
Y a nivel admin: crear clases y ver inscritos.

---

## Contenido
1. [Arquitectura](#arquitectura)
2. [Qué se puede hacer](#qué-se-puede-hacer)
3. [Reglas de negocio](#reglas-de-negocio)
4. [Tecnologías](#tecnologías)
5. [Estructura del repo](#estructura-del-repo)
6. [Cómo arrancarlo](#cómo-arrancarlo)
7. [Variables de entorno](#variables-de-entorno)
8. [API](#api)
9. [Modelo de datos](#modelo-de-datos)

---

## Arquitectura

En el repo hay **dos clientes** y **dos backends** (uno para cada cliente), pero ambos trabajan contra **MongoDB** (BD: `evol`):

- `EVOL/` → app Vue (web/escritorio)
- `EVOL/server/` → backend Express para Vue (`http://localhost:3002`)
- `evol-react/` → app Expo/React Native
- `evol-react/server/` → backend Express para móvil (`http://localhost:3003`)

> Nota: los endpoints son prácticamente los mismos en los dos servidores (usuarios, clases, inscribirse y cancelar).

---

## Qué se puede hacer

### Usuario
- Registrarse (`nombreUsuario`, nombre, apellidos, contraseña)
- Iniciar sesión
- Ver clases
- Apuntarse a una clase
- Ver “Mis clases”
- Cancelar inscripción
- Ver perfil y cerrar sesión

### Administrador
- Entrar al panel
- Crear clases (nombre, descripción, fecha/hora, plazas e imagen)
- Ver listado de clases
- Ver inscritos por clase

---

## Reglas de negocio

- **Evita duplicados de inscripción:** se usa `$addToSet` en `inscritos`.
- **Cancelación con límite de 15 min:**
  - Si faltan **más de 15 min**, se borra al usuario de `inscritos`.
  - Si faltan **15 min o menos**, se guarda en `cancelaciones` y **no se libera la plaza**.
- **Limpieza de clases antiguas (solo en `EVOL/server`):** al consultar clases, se eliminan las de más de 1 semana.

---

## Tecnologías

### Web/Escritorio (`EVOL`)
- Vue 3
- Vite
- Electron
- Bootstrap
- Zod (validación del registro en frontend)

### Móvil (`evol-react`)
- React Native
- Expo + Expo Router
- TypeScript
- `@react-native-community/datetimepicker`

### Backend
- Node.js + Express
- MongoDB (driver `mongodb`)
- `bcrypt`
- En `EVOL/server`: `jsonwebtoken`, `node-cron`, `axios` (Telegram)

---

## Estructura de los repositorios

```text
├─ EVOL/
│  ├─ src/
│  ├─ server/
│  └─ main.js            # Electron
└─ evol-react/
   ├─ app/
   ├─ components/
   ├─ constants/
   └─ server/
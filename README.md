# Gestión de Proveedores — API REST

![Tests](https://github.com/OselkoNico/Angular-NodeJS-Backend/actions/workflows/test.yml/badge.svg)

API REST para la gestión de un catálogo de proveedores, con autenticación por
token y control de acceso por rol. Node.js con Express y persistencia en MySQL.

- **Backend:** este repositorio
- **Frontend:** [gestion-proveedores](https://github.com/OselkoNico/gestion-proveedores) — Angular 21, con capturas de la aplicación

## Stack

| Capa           | Tecnología                        |
| -------------- | --------------------------------- |
| Servidor       | Node.js + Express 5 (ESM)         |
| Base de datos  | MySQL 8                           |
| Driver         | `mysql2` (promesas)               |
| Autenticación  | JSON Web Tokens + bcrypt          |
| Pruebas        | Vitest + supertest                |
| Configuración  | `dotenv`                          |

## Requisitos

- Node.js 22 o superior
- MySQL 8 en ejecución

## Puesta en marcha

El código vive en la carpeta `Backend/`.

**1. Clonar e instalar:**

```bash
git clone https://github.com/OselkoNico/Angular-NodeJS-Backend.git
cd Angular-NodeJS-Backend/Backend
npm install
```

**2. Crear la base de datos.** `schema.sql` crea el esquema y las dos tablas:

```bash
mysql -u root -p < schema.sql
```

**3. Cargar datos de ejemplo** (opcional). Quince proveedores con los que
probar el listado, el buscador y la paginación sin darlos de alta a mano:

```bash
mysql -u root -p --default-character-set=utf8mb4 < seed.sql
```

El `--default-character-set=utf8mb4` es necesario para que los acentos y las
eñes de los nombres de empresa se almacenen correctamente. El fichero usa
`INSERT IGNORE`, así que puede ejecutarse más de una vez sin fallar.

**4. Configurar el entorno:**

```bash
cp .env.example .env
```

Rellena las credenciales de MySQL y genera un secreto para firmar los tokens:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**5. Crear el usuario administrador.** El registro público solo crea usuarios
sin privilegios, así que el primer administrador se crea por línea de comandos:

```bash
npm run crear-admin -- admin@ejemplo.com micontrasena123
```

El `--` es necesario para que npm pase los argumentos al script en lugar de
interpretarlos como suyos.

**6. Arrancar:**

```bash
npm start
```

Si la conexión con MySQL falla, el servidor **no arranca** y muestra el motivo.
Es deliberado: es preferible enterarse al arrancar que en la primera petición.

## Variables de entorno

Se cargan desde `Backend/.env`, que no se versiona. `.env.example` documenta las
claves necesarias con los valores sensibles vacíos.

| Variable         | Descripción                        | Por defecto             |
| ---------------- | ---------------------------------- | ----------------------- |
| `DB_HOST`        | Host de MySQL                      | —                       |
| `DB_PORT`        | Puerto de MySQL                    | `3306`                  |
| `DB_USER`        | Usuario                            | —                       |
| `DB_PASSWORD`    | Contraseña                         | —                       |
| `DB_NAME`        | Nombre de la base de datos         | `gestion_proveedores`   |
| `PORT`           | Puerto de la API                   | `3000`                  |
| `JWT_SECRET`     | Clave de firma de los tokens       | —                       |
| `JWT_EXPIRES_IN` | Vigencia del token                 | `2h`                    |
| `CORS_ORIGIN`    | Origen autorizado                  | `http://localhost:4200` |

`JWT_SECRET` es el dato más sensible del proyecto: quien lo posea puede firmar
un token válido para cualquier usuario y cualquier rol.

## Modelo de datos

```sql
CREATE TABLE proveedores (
  cif         VARCHAR(20)  PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  activity    VARCHAR(120),
  address     VARCHAR(200),
  city        VARCHAR(100),
  postal_code VARCHAR(5),
  phone       VARCHAR(15),
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuarios (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(120) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

La columna `password` guarda un hash de bcrypt, nunca la contraseña. Las tablas
usan `snake_case` y el cliente `camelCase`, así que las consultas devuelven
`postal_code AS postalCode`. `utf8mb4` es necesario para almacenar acentos y
eñes correctamente.

## API REST

Base: `http://localhost:3000`

### Autenticación

| Método | Ruta             | Descripción                    | Acceso       | Respuestas          |
| ------ | ---------------- | ------------------------------ | ------------ | ------------------- |
| `POST` | `/auth/register` | Alta de usuario (rol `user`)   | Público      | `201`, `400`        |
| `POST` | `/auth/login`    | Devuelve token y usuario       | Público      | `200`, `400`, `401` |
| `GET`  | `/auth/me`       | Datos del usuario del token    | Autenticado  | `200`, `401`        |

### Proveedores

| Método   | Ruta                | Descripción      | Acceso        | Respuestas                        |
| -------- | ------------------- | ---------------- | ------------- | --------------------------------- |
| `GET`    | `/proveedores`      | Listado paginado | Autenticado   | `200`, `401`                      |
| `GET`    | `/proveedores/:cif` | Consulta por CIF | Autenticado   | `200`, `401`, `404`               |
| `POST`   | `/proveedores`      | Alta             | Administrador | `201`, `400`, `401`, `403`        |
| `PUT`    | `/proveedores/:cif` | Modificación     | Administrador | `200`, `400`, `401`, `403`, `404` |
| `DELETE` | `/proveedores/:cif` | Baja             | Administrador | `200`, `401`, `403`, `404`        |

El token se envía en la cabecera:

```
Authorization: Bearer <token>
```

Un **401** significa que no hay identificación válida; un **403**, que la hay
pero no basta para esa operación.

### Parámetros del listado

| Parámetro | Descripción                        | Por defecto | Límite |
| --------- | ---------------------------------- | ----------- | ------ |
| `page`    | Página solicitada                  | `1`         | —      |
| `limit`   | Elementos por página               | `10`        | `100`  |
| `search`  | Filtra por nombre de empresa o CIF | —           | —      |

Los valores inválidos —negativos, cero, decimales o no numéricos— recaen en el
valor por defecto.

```
GET /proveedores?page=2&limit=10&search=garcia
```

```json
{
  "message": "Ok",
  "proveedores": [ { "cif": "B12345678", "...": "..." } ],
  "total": 15,
  "page": 2,
  "limit": 10,
  "totalPages": 2
}
```

### Formato del proveedor

```json
{
  "cif": "B12345678",
  "name": "Suministros García S.L.",
  "activity": "Distribución",
  "address": "C/ Mayor 12",
  "city": "Valencia",
  "postalCode": "46001",
  "phone": "961234567"
}
```

Solo `cif` y `name` son obligatorios. El CIF es el identificador y no es
modificable: aunque viaje en el cuerpo de un `PUT`, se ignora y se toma el de
la URL.

Cualquier ruta no reconocida devuelve `404` con
`{ "message": "Incorrect route or params." }`, y un error no controlado devuelve
`500` con `{ "message": "Error interno del servidor." }`.

## Estructura

```
.github/workflows/       # Integración continua
Backend/
├── server.js            # Arranque del servidor
├── app.js               # Configuración de la aplicación Express
├── db.js                # Pool de conexiones a MySQL
├── schema.sql           # Creación de la base de datos y las tablas
├── seed.sql             # Datos de ejemplo (opcional)
├── .env.example         # Plantilla de configuración
├── middleware/
│   └── auth.js          # Verificación de token y comprobación de rol
├── routes/
│   ├── proveedores.js   # CRUD del catálogo
│   └── auth.js          # Registro, inicio de sesión y perfil
├── utils/
│   └── paginacion.js    # Validación de los parámetros de página
└── scripts/
    └── crear-admin.js   # Alta o promoción de un administrador
```

## Decisiones de diseño

**Las restricciones viven en la base de datos.** La unicidad del CIF es la clave
primaria, la del correo un índice único, y la obligatoriedad del nombre un
`NOT NULL`. El controlador se limita a traducir el error de MySQL al código HTTP
correspondiente:

```js
if (error.code === 'ER_DUP_ENTRY') {
  return res.status(400).json({ message: 'CIF already exists' });
}
```

Comprobar la existencia con un `SELECT` previo, además de duplicar la regla,
deja una ventana entre la comprobación y la inserción por la que otra petición
podría colarse.

**Consultas parametrizadas en todo dato de entrada.** Los valores viajan aparte
de la sentencia mediante `?`. La única excepción son `LIMIT` y `OFFSET`, que se
interpolan **ya convertidos a entero**: `mysql2` envía los parámetros preparados
como cadenas y MySQL no las admite en esa posición.

**El `ORDER BY` del listado es obligatorio, no estético.** Sin un orden
explícito, dos páginas consecutivas podrían solaparse o saltarse registros.

**JWT en lugar de sesiones de servidor.** El cliente es una SPA en otro origen;
un token en la cabecera evita depender de cookies y mantiene la API sin estado.
A cambio, un token no se puede revocar antes de caducar, y por eso su vigencia
es corta.

**El contenido del token es legible.** Solo lleva identificador, correo y rol.
La firma garantiza que nadie lo ha modificado, no que nadie pueda leerlo.

**El inicio de sesión no distingue entre correo inexistente y contraseña
incorrecta.** Ambos devuelven el mismo mensaje, para no permitir averiguar qué
cuentas están registradas.

**La verificación del token se aplica con `router.use`**, antes de definir las
rutas, de modo que cualquier endpoint que se añada quede protegido por omisión.
En seguridad, lo que depende de recordar algo acaba fallando.

**CORS acotado no sustituye a la autenticación.** Es una política que aplica el
navegador: una petición desde `curl` o Postman no se ve afectada. Quien protege
la API es el token.

**SQL directo, sin ORM.** Con una decena de consultas y dos tablas, un ORM
añadiría configuración, migraciones y abstracción que no compensan.

## Pruebas

```bash
npm test
```

Se ejecutan **sin necesidad de MySQL en marcha**: la capa de acceso a datos se
sustituye por un doble. Unas pruebas que exigen un servidor de base de datos con
datos concretos son unas pruebas que nadie ejecuta y que no pueden correr en
integración continua.

| Área          | Qué se verifica                                                                 |
| ------------- | ------------------------------------------------------------------------------- |
| Paginación    | Valores por defecto, cota máxima, negativos, cero, no numéricos y decimales      |
| Middleware    | Token ausente, esquema incorrecto, firma inválida, caducado, y que la cadena se detiene |
| Proveedores   | `401` sin sesión, `403` sin rol, `404` inexistente y traducción de `ER_DUP_ENTRY` |
| Autenticación | El hash nunca sale en la respuesta, mensaje idéntico ante credenciales erróneas, y el registro solo crea usuarios sin privilegios |

Dos detalles del enfoque:

**Se comprueba que las peticiones rechazadas no llegan a consultar la base de
datos**, no solo que devuelven el código correcto. Rechazar *después* de
consultar sigue revelando información y consumiendo recursos.

**Los tests se escribieron según el comportamiento deseado, no observando el
código.** Gracias a eso destaparon dos fallos reales en la validación de la
paginación: un `limit` negativo devolvía un único elemento mientras que un
`limit` de cero recaía en el valor por defecto, y una página decimal generaba un
`OFFSET` no entero que MySQL rechaza, convirtiendo una entrada malformada en un
error 500.

`app.js` exporta la aplicación y `server.js` la arranca. Esa separación no es
cosmética: es lo que permite importarla en una prueba sin ocupar un puerto.

## Integración continua

Cada push y cada pull request ejecutan la suite completa mediante GitHub
Actions. El resultado aparece en el propio PR antes de poder fusionarlo.

## Limitaciones conocidas

- **Los tokens no se pueden revocar** antes de su caducidad. Un cierre de sesión
  solo descarta el token en el cliente. Resolverlo requeriría tokens de refresco
  o una lista de revocación.
- **Sin recuperación de contraseña.** No hay flujo de restablecimiento por
  correo.
- **Sin límite de intentos de inicio de sesión.** No hay protección frente a
  ataques de fuerza bruta por repetición.
- **Sin despliegue.** El proyecto se ejecuta en local.
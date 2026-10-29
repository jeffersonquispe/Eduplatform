## Purpose

Permite a las personas registrarse, iniciar sesión y actuar como instructor o estudiante, de modo que cada rol solo pueda realizar las acciones que le corresponden.

## ADDED Requirements

### Requirement: Registro con rol
El sistema SHALL permitir a una persona registrarse con correo y contraseña, eligiendo el rol de instructor o de estudiante, y SHALL crear su perfil con ese rol.

#### Scenario: Registro como estudiante
- **WHEN** una persona se registra con datos válidos y elige el rol estudiante
- **THEN** se crea su cuenta y su perfil con rol estudiante

#### Scenario: Registro como instructor
- **WHEN** una persona se registra con datos válidos y elige el rol instructor
- **THEN** se crea su cuenta y su perfil con rol instructor

#### Scenario: Correo ya registrado
- **WHEN** una persona intenta registrarse con un correo que ya tiene cuenta
- **THEN** el sistema rechaza el registro e informa que el correo ya existe

### Requirement: Inicio y cierre de sesión
El sistema SHALL permitir a un usuario registrado iniciar y cerrar sesión, y SHALL rechazar credenciales inválidas sin revelar cuál de los dos datos es incorrecto.

#### Scenario: Credenciales válidas
- **WHEN** un usuario registrado envía su correo y contraseña correctos
- **THEN** se inicia su sesión

#### Scenario: Credenciales inválidas
- **WHEN** un usuario envía credenciales incorrectas
- **THEN** el sistema rechaza el inicio de sesión con un mensaje genérico

### Requirement: Rol inmutable por el propio usuario
El sistema MUST impedir que un usuario cambie su propio rol después del registro mediante la API de datos.

#### Scenario: Intento de escalar rol
- **WHEN** un estudiante intenta actualizar su perfil para establecer el rol instructor
- **THEN** la base de datos rechaza el cambio y el rol permanece como estudiante

### Requirement: Perfil público limitado
El sistema SHALL exponer públicamente solo el nombre visible, la biografía y la foto del instructor, y MUST NOT exponer su correo ni otros datos privados.

#### Scenario: Visitante consulta un instructor
- **WHEN** un visitante anónimo consulta el perfil de un instructor
- **THEN** recibe nombre visible, biografía y foto, sin correo

### Requirement: Autorización aplicada en la base de datos
El sistema MUST aplicar las reglas de acceso mediante políticas de seguridad a nivel de fila en todas las tablas de la aplicación, de modo que no dependan de la interfaz.

#### Scenario: Acceso directo a la API sin permiso
- **WHEN** un cliente llama directamente a la API de datos intentando leer o modificar filas que su rol no permite
- **THEN** la base de datos no devuelve ni modifica esas filas

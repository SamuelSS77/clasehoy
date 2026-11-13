// =============================================
// cuentaCliente.js — registro de clientes compartido por cliente.html y admin.html
// (cargar DESPUÉS de supabaseClient.js)
// =============================================

// ¿El error de signUp es "ese correo ya existe en Auth"?
function esCorreoYaRegistrado(error) {
  return error?.code === 'user_already_exists' || /already registered/i.test(error?.message || '');
}

// Registra un cliente. El perfil en cliente_prueba lo crea el trigger
// sql/arreglar_cliente_prueba.sql a partir de options.data.
//
// Si el correo YA existe en Auth (p. ej. un registro anterior que creó la
// cuenta pero falló al crear el perfil), se intenta iniciar sesión con la
// contraseña escrita y, si coincide, se crea el perfil que faltaba: con la
// sesión abierta la política RLS "auth.uid() = id" sí lo permite.
//
// Devuelve { ok: true, mensaje } o { ok: false, mensaje }.
async function registrarCuentaCliente(nombre, correo, contrasena) {
  const { data, error } = await db.auth.signUp({
    email: correo,
    password: contrasena,
    options: { data: { nombre, tipo: 'cliente' } },
  });

  if (!error) {
    return {
      ok: true,
      mensaje: data.session
        ? '¡Cuenta de cliente creada! Bienvenido/a, ' + nombre + '.'
        : 'Cuenta de cliente creada. Ahora inicia sesión con ese correo y contraseña.',
    };
  }

  if (!esCorreoYaRegistrado(error)) {
    console.log('Error al registrar:', error);
    return { ok: false, mensaje: 'Error al registrar: ' + error.message };
  }

  // ---- El correo ya existe: intentar reparar la cuenta ----
  const { data: login, error: errorLogin } = await db.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  });

  if (errorLogin?.code === 'email_not_confirmed' || /not confirmed/i.test(errorLogin?.message || '')) {
    return {
      ok: false,
      mensaje: 'Ese correo ya está registrado, pero falta confirmarlo. Revisa tu bandeja de entrada y luego inicia sesión.',
    };
  }

  if (errorLogin) {
    return {
      ok: false,
      mensaje: 'Ese correo ya está registrado. Si es tuyo, inicia sesión con tu contraseña.',
    };
  }

  const perfil = await asegurarPerfilCliente(login.user.id, nombre);

  if (perfil.estado === 'existia') {
    return { ok: true, mensaje: 'Ya tenías una cuenta de cliente con ese correo: sesión iniciada.' };
  }
  if (perfil.estado === 'creado') {
    return { ok: true, mensaje: 'Cuenta de cliente recuperada. ¡Bienvenido/a, ' + nombre + '!' };
  }

  await db.auth.signOut();
  return { ok: false, mensaje: perfil.mensaje };
}

// Con la sesión YA iniciada: confirma que la cuenta tenga perfil de cliente
// y, si le falta (cuenta "a medias"), lo crea con la función de la base de
// datos crear_mi_perfil_cliente (sql/arreglar_cliente_prueba.sql), que no
// depende de las políticas RLS.
// Devuelve { estado: 'existia' | 'creado' | 'admin' | 'error', mensaje }.
async function asegurarPerfilCliente(id, nombre = '') {
  const { data: perfilCliente } = await db.from('cliente_prueba').select('id').eq('id', id).maybeSingle();
  if (perfilCliente) return { estado: 'existia' };

  const { data: perfilAdmin } = await db.from('admin_prueba').select('id').eq('id', id).maybeSingle();
  if (perfilAdmin) {
    return { estado: 'admin', mensaje: 'Esa cuenta es de administrador. Inicia sesión desde el acceso de administradores.' };
  }

  const { error } = await db.rpc('crear_mi_perfil_cliente', { p_nombre: nombre });
  if (error) {
    console.log('Error al crear el perfil:', error);
    return { estado: 'error', mensaje: 'No se pudo crear el perfil: ' + error.message };
  }
  return { estado: 'creado' };
}

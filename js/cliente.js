// El registro (db.auth.signUp + perfil en cliente_prueba) está en
// js/cuentaCliente.js → registrarCuentaCliente(), compartido con admin.html.

// 'submit' es el evento que dispara un <form> cuando alguien hace clic en
// su botón de tipo submit (o presiona Enter dentro de un campo). Por
// defecto, ese evento hace que el navegador RECARGUE la página entera —
// comportamiento heredado de cuando los formularios mandaban sus datos a
// otra página de servidor, décadas atrás. Como aquí todo lo manejamos con
// JavaScript (sin recargar nada), hay que apagar ese comportamiento a
// propósito.
document.getElementById('form-registro').addEventListener('submit', async (event) => {

  // event.preventDefault() le dice al navegador "no hagas lo que harías
  // normalmente con este evento" — en este caso, no recargues la página.
  // Sin esta línea, la página se refrescaría apenas se hiciera clic en
  // "Crear cuenta", y perderías cualquier mensaje que fueras a mostrar.
  event.preventDefault();

  // event.target es el elemento que disparó el evento — en un 'submit',
  // siempre es el propio <form>. Lo guardamos en una variable para poder
  // usarlo más abajo (form.reset()) sin tener que volver a buscarlo.
  const form = event.target;

  const resultado = await registrarCuentaCliente(
    document.getElementById('registro-nombre').value.trim(),
    document.getElementById('registro-correo').value.trim(),
    document.getElementById('registro-password').value
  );

  if (resultado.ok) {
    form.reset(); // vacía los 3 campos del formulario, para la próxima persona
    alternarModoRegistro(false); // vuelve al login de cliente
    await mostrarEstadoSesion();
  }
  document.getElementById('estado-sesion').textContent = resultado.mensaje;
});

async function iniciarSesion(correo, contrasena) {

  // db.auth.signInWithPassword() es para alguien que YA se registró antes
  // (sección 4.1) — no crea ningún usuario nuevo, solo verifica que el
  // correo y la contraseña coincidan con uno que ya existe en Auth.
  //
  // Lo importante pasa "por detrás", sin que se vea en este código: si la
  // verificación sale bien, el cliente de Supabase (la variable db, la
  // misma de siempre) GUARDA la sesión internamente — normalmente en el
  // almacenamiento del navegador — y, desde este momento, la adjunta sola
  // a cada petición futura que hagas con db, sea a productos_practica, a
  // clientes_practica o a cualquier otra tabla. No hay que "pasarle" el
  // usuario a mano a ninguna otra función.
  const { data, error } = await db.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  });

  if (error) {
    console.log('Error al iniciar sesión:', error);
    return null;
  }

  // Aquí data.user también trae el id real del usuario — el mismo valor
  // que auth.uid() va a devolver dentro de cualquier política de RLS
  // mientras esta sesión siga activa.
  //
  // Clientes y admins comparten el mismo Auth, así que la contraseña
  // correcta no basta: esta puerta es SOLO para cuentas con fila en
  // cliente_prueba. Una cuenta de admin se rechaza y se cierra su sesión.
  // Si a la cuenta le falta el perfil (registro que quedó a medias), se crea
  // aquí; si es una cuenta de admin, se rechaza.
  const perfil = await asegurarPerfilCliente(data.user.id);

  if (perfil.estado === 'admin' || perfil.estado === 'error') {
    await db.auth.signOut();
    return { rechazado: true, mensaje: perfil.mensaje };
  }

  return data.user;
}

// Login (por defecto) ⇄ registro de cliente
let modoRegistro = false;
function alternarModoRegistro(valor = !modoRegistro) {
  modoRegistro = valor;
  document.getElementById('btn-alternar-registro').textContent =
    modoRegistro ? '← Ya tengo cuenta, iniciar sesión' : '¿No tienes cuenta? Regístrate';
}
document.getElementById('btn-alternar-registro').addEventListener('click', () => {
  alternarModoRegistro();
  mostrarEstadoSesion();
});

// Mismo patrón explicado en el formulario de registro: 'submit' es el
// evento del <form>, y hay que apagar la recarga automática de página.
document.getElementById('form-login').addEventListener('submit', async (event) => {
  event.preventDefault(); // evita que el navegador recargue la página
  const form = event.target; // el propio <form>, guardado para usar después

  const usuario = await iniciarSesion(
    document.getElementById('login-correo').value.trim(),
    document.getElementById('login-password').value
  );

  if (usuario?.rechazado) {
    await mostrarEstadoSesion();
    document.getElementById('estado-sesion').textContent = usuario.mensaje;
  } else if (usuario) {
    form.reset();
    mostrarEstadoSesion(); // definida en la sección 5
  } else {
    document.getElementById('estado-sesion').textContent =
      'Correo o contraseña incorrectos.';
  }
});

// Muestra u oculta los formularios y los datos del cliente según haya sesión.
async function mostrarEstadoSesion() {
  const estado = document.getElementById('estado-sesion');
  const formRegistro = document.getElementById('form-registro');
  const formLogin = document.getElementById('form-login');
  const info = document.getElementById('info-cliente');
  const btnLogout = document.getElementById('btn-logout');

  const { data: { session } } = await db.auth.getSession();

  document.getElementById('form-editar').hidden = true;
  document.getElementById('btn-config').hidden = !session;

  document.getElementById('btn-alternar-registro').hidden = !!session;

  if (!session) {
    estado.textContent = 'No has iniciado sesión.';
    formRegistro.hidden = !modoRegistro;
    formLogin.hidden = modoRegistro;
    info.hidden = true;
    btnLogout.hidden = true;
    return;
  }

  // Trae la fila del cliente cuyo id coincide con el usuario autenticado.
  const { data: cliente, error } = await db
    .from('cliente_prueba')
    .select('nombre, correo, telefono, direccion, ciudad')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) console.log('Error al leer el perfil:', error);

  formRegistro.hidden = true;
  formLogin.hidden = true;
  btnLogout.hidden = false;

  if (!cliente) {
    // La sesión es compartida con admin.html: puede ser un admin logueado allá
    estado.textContent =
      'Tienes una sesión de administrador activa. Esta área es solo para clientes: cierra sesión para entrar como cliente.';
    info.hidden = true;
    document.getElementById('btn-config').hidden = true;
    return;
  }

  estado.textContent = '¡Inicio de sesión exitoso! Bienvenido/a, ' + (cliente.nombre || '') + '.';
  document.getElementById('dato-nombre').textContent = cliente.nombre || '—';
  document.getElementById('dato-correo').textContent = cliente.correo || session.user.email;
  document.getElementById('dato-telefono').textContent = cliente.telefono || '—';
  document.getElementById('dato-direccion').textContent = cliente.direccion || '—';
  document.getElementById('dato-ciudad').textContent = cliente.ciudad || '—';
  info.hidden = false;
  clienteActual = cliente;
}

let clienteActual = null;

// UPDATE: actualiza nombre, teléfono y dirección del cliente con sesión activa.
// El correo no se edita aquí porque es el de Auth (login).
async function actualizarCliente(datos) {
  const { data: { session } } = await db.auth.getSession();
  if (!session) return null;

  const { data, error } = await db
    .from('cliente_prueba')
    .update(datos)
    .eq('id', session.user.id)
    .select();

  if (error) {
    console.log('Error al actualizar:', error);
    return null;
  }
  // Si RLS bloquea el UPDATE, no hay error pero data llega vacío.
  if (!data || data.length === 0) {
    console.log('No se actualizó ninguna fila (revisa la política UPDATE de RLS).');
    return null;
  }
  return data[0];
}

// Engranaje: abre/cierra el formulario con los datos actuales precargados.
document.getElementById('btn-config').addEventListener('click', () => {
  const form = document.getElementById('form-editar');
  if (form.hidden) {
    document.getElementById('editar-nombre').value = clienteActual?.nombre || '';
    document.getElementById('editar-telefono').value = clienteActual?.telefono || '';
    document.getElementById('editar-direccion').value = clienteActual?.direccion || '';
    document.getElementById('editar-ciudad').value = clienteActual?.ciudad || '';
    document.getElementById('info-cliente').hidden = true;
    form.hidden = false;
  } else {
    form.hidden = true;
    document.getElementById('info-cliente').hidden = false;
  }
});

document.getElementById('btn-cancelar-edicion').addEventListener('click', () => {
  document.getElementById('form-editar').hidden = true;
  document.getElementById('info-cliente').hidden = false;
});

document.getElementById('form-editar').addEventListener('submit', async (event) => {
  event.preventDefault();

  const actualizado = await actualizarCliente({
    nombre: document.getElementById('editar-nombre').value.trim(),
    telefono: document.getElementById('editar-telefono').value.trim(),
    direccion: document.getElementById('editar-direccion').value.trim(),
    ciudad: document.getElementById('editar-ciudad').value.trim(),
  });

  if (actualizado) {
    await mostrarEstadoSesion(); // recarga los datos y vuelve a la vista normal
    document.getElementById('estado-sesion').textContent = 'Datos actualizados correctamente.';
  } else {
    document.getElementById('estado-sesion').textContent =
      'No se pudieron actualizar los datos. Revisa la consola.';
  }
});

// Al cargar la página, si ya hay una sesión guardada, la muestra.
mostrarEstadoSesion();

document.getElementById('btn-logout').addEventListener('click', async () => {
  await db.auth.signOut();
  mostrarEstadoSesion();
});
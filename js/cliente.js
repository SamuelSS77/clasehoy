async function registrarCliente(nombre, correo, contrasena) {

  // db.auth.signUp() NO toca ninguna tabla tuya todavía — habla directo con
  // el sistema de autenticación interno de Supabase (algo así como una
  // tabla especial, auth.users, que tú no administras a mano). Le mandas
  // correo y contraseña, y Supabase por detrás: valida el formato del
  // correo, guarda la contraseña de forma segura (nunca en texto plano),
  // y crea un identificador único nuevo (un uuid) para esta persona.
  //
  // El resultado llega en dos partes, igual que en todas las llamadas a
  // Supabase que ya conoces (data / error):
  //   - data.user   → los datos del usuario recién creado. data.user.id
  //                   es el uuid real — EL MISMO que vamos a usar como id
  //                   en clientes_practica, dos líneas más abajo.
  //   - data.session → si tu proyecto exige confirmar el correo antes de
  //                   dejar entrar (ver guía, sección 7), esto llega en
  //                   null: el usuario ya existe, pero todavía no hay
  //                   sesión iniciada hasta que confirme.
  const { data, error } = await db.auth.signUp({
    email: correo,
    password: contrasena,
  });

  // Mismo patrón de "revisar error antes de seguir" que ya usaste en el
  // CRUD de productos — si signUp() falló (correo repetido, contraseña
  // muy corta, etc.), ni siquiera intentamos el segundo paso.
  if (error) {
    console.log('Error al registrar:', error);
    return null;
  }

  // Ahora sí tocamos una tabla tuya: clientes_practica. Este insert() es
  // igual al que ya usaste en agregarProducto() — la única diferencia es
  // que aquí SÍ mandamos el id a mano (data.user.id), en vez de dejar que
  // Supabase lo autogenere, porque este id tiene que coincidir exactamente
  // con el que Auth le acaba de asignar al usuario.
  const { data: cliente, error: errorCliente } = await db
    .from('cliente_prueba')
    .insert([{ id: data.user.id, nombre, correo, rol: 'cliente' }])
    .select();

  if (errorCliente) {
    console.log('Error al crear el perfil:', errorCliente);
    return null;
  }

  return cliente[0];
}

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

  const cliente = await registrarCliente(
    document.getElementById('registro-nombre').value.trim(),
    document.getElementById('registro-correo').value.trim(),
    document.getElementById('registro-password').value
  );

  if (cliente) {
    document.getElementById('estado-sesion').textContent =
      'Cuenta creada. Ahora inicia sesión con ese correo y contraseña.';
    form.reset(); // vacía los 3 campos del formulario, para la próxima persona
  } else {
    document.getElementById('estado-sesion').textContent =
      'No se pudo crear la cuenta. Revisa la consola.';
  }
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
  return data.user;
}

// Mismo patrón explicado en el formulario de registro: 'submit' es el
// evento del <form>, y hay que apagar la recarga automática de página.
document.getElementById('form-login').addEventListener('submit', async (event) => {
  event.preventDefault(); // evita que el navegador recargue la página
  const form = event.target; // el propio <form>, guardado para usar después

  const usuario = await iniciarSesion(
    document.getElementById('login-correo').value.trim(),
    document.getElementById('login-password').value
  );

  if (usuario) {
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

  if (!session) {
    estado.textContent = 'No has iniciado sesión.';
    formRegistro.hidden = false;
    formLogin.hidden = false;
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
    estado.textContent = 'Sesión iniciada, pero no se encontró tu perfil.';
    info.hidden = true;
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
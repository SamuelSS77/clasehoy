// admin.js - Gestión CRUD de productos en MITABLA1 con Supabase

// Nota de clase sobre async/await y Supabase vs localStorage:
// "async" convierte una función en ASÍNCRONA: una función que PUEDE usar "await"
// adentro para esperar algo que tarda, sin congelar el resto de la página mientras espera.
// Diferencia clave con localStorage (semana 7): localStorage.getItem() y localStorage.setItem()
// son operaciones SINCRÓNICAS — ocurren al instante, en tu propio computador.
// Una consulta a Supabase viaja por internet hasta el servidor y la respuesta tiene que volver.

// =============================================
// 5.1 CREATE — agregarProducto()
// =============================================
// AHORA (Supabase):
async function agregarProducto(datos) {

  const { data, error } = await supabaseClient
    .from('MITABLA1')            // la tabla
    .insert([datos])             // insert() siempre recibe un ARRAY de objetos,
    // aunque insertes uno solo
    .select();                    // .select() le pide a Supabase que te
  // devuelva la fila ya creada (con su id
  // nuevo) — sin esto, insert() no te
  // devuelve nada útil

  if (error) {
    console.log("Error al agregar:", error);
    return null;
  }

  return data[0];   // data siempre es un array — tomamos el primer
  // elemento, que es la fila recién creada
}

// Variable para saber si el formulario está creando (null) o editando un ID existente
let idProductoEditando = null;
let ultimoErrorUpdate = '';
// true solo si hay sesión iniciada y el rol en cliente_prueba es 'admin'
let esAdmin = false;

// =============================================
// Utilidades de Rough Street (conversión entre el formulario y Supabase)
// =============================================
// "Skate / Lifestyle"  ->  ["Skate", "Lifestyle"]   (columna categoria, tipo json)
function textoACategorias(texto) {
  const lista = texto.split('/').map(t => t.trim()).filter(Boolean);
  return lista.length ? lista : null;
}

// "7, 7.5, 8"  ->  [7, 7.5, 8]   (columna tallas_us, tipo jsonb)
function textoATallas(texto) {
  const lista = texto.split(',').map(t => Number(t.trim())).filter(n => !Number.isNaN(n) && n > 0);
  return lista.length ? lista : null;
}

// Evita que comillas o < > de un nombre rompan el HTML de las cards
function escaparHTML(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Función para mostrar notificación y hacerla visible
function mostrarNotificacion(mensaje) {
  const notif = document.getElementById('notificacion');
  notif.innerText = mensaje;
}

// Espacio para formulario de agregar o modificar producto
document.getElementById('form-producto').addEventListener('submit', async (e) => {
  e.preventDefault();

  const btnGuardar = document.getElementById('btn-guardar-form');
  const textoBtn = document.getElementById('texto-btn-form');
  const unidades = Number(document.getElementById('input-unidades').value) || 0;
  const datosFormulario = {
    marca: document.getElementById('input-marca').value.trim(),
    sku: document.getElementById('input-sku').value.trim() || null,
    Nombre: document.getElementById('input-nombre').value.trim(),
    colorway: document.getElementById('input-colorway').value.trim() || null,
    categoria: textoACategorias(document.getElementById('input-categoria').value),
    precio: Number(document.getElementById('input-precio').value) || 0,
    precio_usd: Number(document.getElementById('input-precio-usd').value) || null,
    unidades: unidades,
    disponible: unidades > 0,
    badge: document.getElementById('input-badge').value.trim() || null,
    tallas_us: textoATallas(document.getElementById('input-tallas').value),
    descripcion: document.getElementById('input-descripcion').value.trim(),
    image_url: document.getElementById('input-imagen').value.trim() || null
  };

  btnGuardar.disabled = true;

  try {
    // Si estamos en modo edición, usamos 5.3 UPDATE — modificarProducto()
    if (idProductoEditando !== null) {
      textoBtn.textContent = 'ACTUALIZANDO...';
      const actualizado = await modificarProducto(idProductoEditando, datosFormulario);

      if (actualizado) {
        mostrarNotificacion(
          `✅ Producto #${actualizado.id} ("${actualizado.Nombre}") actualizado correctamente.`
        );
        salirModoEdicion();
        await mostrarProductosEnCards();
      } else {
        mostrarNotificacion(
          ultimoErrorUpdate ||
          '⚠️ No se pudo actualizar en Supabase. Revisa que la tabla MITABLA1 tenga permiso/política RLS para UPDATE.'
        );
        textoBtn.textContent = 'GUARDAR CAMBIOS';
      }
      return;
    }

    // Si no estamos editando, usamos CREATE — agregarProducto()
    textoBtn.textContent = 'GUARDANDO...';
    const respuesta = await agregarProducto(datosFormulario);
    if (respuesta) {
      mostrarNotificacion('✅ Producto agregado con ID: ' + respuesta.id);
      e.target.reset();
      await mostrarProductosEnCards();
    } else {
      mostrarNotificacion('❌ Error al agregar producto.');
    }
  } finally {
    btnGuardar.disabled = false;
    if (idProductoEditando === null) {
      textoBtn.textContent = 'GUARDAR SNEAKER';
    }
  }
});

// Función auxiliar para cargar un producto en el formulario y editarlo
function cargarProductoEnFormulario(producto) {
  idProductoEditando = producto.id;
  document.getElementById('input-marca').value = producto.marca ?? '';
  document.getElementById('input-sku').value = producto.sku ?? '';
  document.getElementById('input-nombre').value = producto.Nombre ?? '';
  document.getElementById('input-colorway').value = producto.colorway ?? '';
  document.getElementById('input-categoria').value = Array.isArray(producto.categoria) ? producto.categoria.join(' / ') : '';
  document.getElementById('input-precio').value = producto.precio ?? 0;
  document.getElementById('input-precio-usd').value = producto.precio_usd ?? '';
  document.getElementById('input-unidades').value = producto.unidades ?? 0;
  document.getElementById('input-badge').value = producto.badge ?? '';
  document.getElementById('input-tallas').value = Array.isArray(producto.tallas_us) ? producto.tallas_us.join(', ') : '';
  document.getElementById('input-descripcion').value = producto.descripcion ?? '';
  document.getElementById('input-imagen').value = producto.image_url ?? '';

  document.querySelector('#form-producto .form-kicker').textContent = `ROUGH STREET // EDITANDO ID #${producto.id}`;
  document.querySelector('#form-producto h2').textContent = 'MODIFICAR SNEAKER';
  document.getElementById('texto-btn-form').textContent = 'GUARDAR CAMBIOS';
  document.getElementById('btn-cancelar-edicion').style.display = 'block';

  document.getElementById('form-producto').scrollIntoView({ behavior: 'smooth' });
}

function salirModoEdicion() {
  idProductoEditando = null;
  document.getElementById('form-producto').reset();
  document.querySelector('#form-producto .form-kicker').textContent = 'ROUGH STREET // NUEVO DROP';
  document.querySelector('#form-producto h2').textContent = 'AGREGAR SNEAKER';
  document.getElementById('texto-btn-form').textContent = 'GUARDAR SNEAKER';
  document.getElementById('btn-cancelar-edicion').style.display = 'none';
}

document.getElementById('btn-cancelar-edicion').addEventListener('click', salirModoEdicion);

// =============================================
// método Read (leer y mostrar productos como Cards)
// =============================================
async function mostrarProductosEnCards(listaFiltrada = null) {
  const contenedor = document.getElementById('contenedor-cards');
  const contador = document.getElementById('contador-productos');

  let data = listaFiltrada;

  if (!data) {
    contenedor.innerHTML = '<p class="estado-cards">Cargando productos...</p>';

    const respuesta = await supabaseClient
      .from('MITABLA1')
      .select('*')
      .order('id', { ascending: true });

    if (respuesta.error) {
      contenedor.innerHTML = `<p class="estado-cards">Error al cargar: ${respuesta.error.message}</p>`;
      return;
    }

    data = respuesta.data;
  }

  if (contador) {
    const total = data ? data.length : 0;
    contador.textContent = `${total} ${total === 1 ? 'PAR' : 'PARES'}`;
  }

  if (!data || data.length === 0) {
    contenedor.innerHTML = '<p class="estado-cards">No se encontraron sneakers.</p>';
    return;
  }

  contenedor.innerHTML = data.map(producto => {
    const nombre = escaparHTML(producto.Nombre || 'Sin nombre');
    const imagen = producto.image_url
      ? `<img src="${escaparHTML(producto.image_url)}" alt="${nombre}" class="card-img" loading="lazy" />`
      : `<div class="card-img-placeholder">ROUGH STREET // SIN IMAGEN</div>`;

    const precioFormateado = Number(producto.precio || 0).toLocaleString('es-CO');
    const precioUsd = producto.precio_usd ? `US$${Number(producto.precio_usd).toLocaleString('en-US')}` : '';
    const unidadesActuales = producto.unidades ?? 0;
    const stockTexto = unidadesActuales === 0 ? 'AGOTADO' : unidadesActuales <= 8 ? `ÚLTIMOS ${unidadesActuales}` : `${unidadesActuales} PARES`;

    const badge = producto.badge ? `<span class="card-badge">${escaparHTML(producto.badge)}</span>` : '';
    const estilos = Array.isArray(producto.categoria) ? producto.categoria.join(' / ') : '';
    const meta = [producto.marca, estilos].filter(Boolean).map(escaparHTML).join(' · ');
    const tallas = Array.isArray(producto.tallas_us) && producto.tallas_us.length
      ? `<div class="card-tallas">${producto.tallas_us.map(t => `<span>${escaparHTML(t)}</span>`).join('')}</div>`
      : '';

    return `
      <article class="producto-card" data-id="${producto.id}">
        <div class="card-top-bar">
          <span class="card-id">${escaparHTML(producto.sku || 'ID #' + producto.id)}</span>
          <span class="card-stock${unidadesActuales <= 8 ? ' card-stock-bajo' : ''}">${stockTexto}</span>
        </div>
        <div class="card-media">
          ${badge}
          ${imagen}
        </div>
        <div class="card-body">
          ${meta ? `<span class="card-meta">${meta}</span>` : ''}
          <h3 class="card-titulo">${nombre}</h3>
          ${producto.colorway ? `<span class="card-colorway">${escaparHTML(producto.colorway)}</span>` : ''}
          <p class="card-desc">${escaparHTML(producto.descripcion || 'Sin descripción')}</p>
          ${tallas}
          <div class="card-footer">
            <span class="card-precio">$${precioFormateado}</span>
            <span class="card-precio-usd">${precioUsd}</span>
          </div>
          ${esAdmin ? `
          <div class="card-actions">
            <button type="button" class="btn-card btn-editar" data-id="${producto.id}">
              EDITAR
            </button>
            <button type="button" class="btn-card btn-eliminar" data-id="${producto.id}">
              ELIMINAR
            </button>
          </div>` : ''}
        </div>
      </article>
    `;
  }).join('');

  // Eventos de los botones de cada Card (UPDATE y DELETE)
  contenedor.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', () => {
      const producto = data.find(p => String(p.id) === String(btn.dataset.id));
      if (producto) cargarProductoEnFormulario(producto);
    });
  });

  contenedor.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', async () => {
      const producto = data.find(p => String(p.id) === String(btn.dataset.id));
      if (!producto) return;

      const confirmar = confirm(`¿Seguro que deseas eliminar "${producto.Nombre}" (ID #${producto.id})?`);
      if (!confirmar) return;

      const seElimino = await eliminarProducto(producto.id);
      if (seElimino) {
        mostrarNotificacion(`🗑️ Producto "${producto.Nombre}" (ID #${producto.id}) eliminado correctamente.`);
        if (String(idProductoEditando) === String(producto.id)) {
          salirModoEdicion();
        }
        await mostrarProductosEnCards();
      } else {
        mostrarNotificacion('❌ Error al eliminar el producto en Supabase. Revisa la política RLS de DELETE.');
      }
    });
  });
}

// Buscador en tiempo real usando buscarProductosPorNombre()
const inputBuscar = document.getElementById('input-buscar');
if (inputBuscar) {
  inputBuscar.addEventListener('input', async (e) => {
    const texto = e.target.value.trim();
    if (!texto) {
      await mostrarProductosEnCards();
      return;
    }
    const filtrados = await buscarProductosPorNombre(texto);
    await mostrarProductosEnCards(filtrados);
  });
}

// =============================================
// MODO ADMIN — solo el admin ve el formulario y los botones EDITAR / ELIMINAR
// =============================================
// ⚠️ Ocultar botones es solo VISUAL. La protección real son las políticas RLS
// de MITABLA1 en Supabase: aunque alguien muestre los botones desde la consola
// del navegador, Supabase rechaza el INSERT / UPDATE / DELETE si no es admin.
async function verificarAdmin() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return false;   // visitante sin sesión → público

  // La sesión la comparte cliente.html (mismo sitio), así que si el admin
  // inició sesión allá, aquí también aparece. Leemos su rol de cliente_prueba.
  const { data, error } = await supabaseClient
    .from('cliente_prueba')
    .select('rol')
    .eq('id', session.user.id)
    .single();

  if (error || !data) return false;
  return data.rol === 'admin';
}

async function aplicarModoAdmin() {
  esAdmin = await verificarAdmin();
  document.body.classList.toggle('modo-admin', esAdmin);
  if (!esAdmin && idProductoEditando !== null) salirModoEdicion();
  await mostrarProductosEnCards();
}

// Si alguien inicia o cierra sesión en otra pestaña, se vuelve a revisar el rol
supabaseClient.auth.onAuthStateChange((evento) => {
  if (evento === 'SIGNED_IN' || evento === 'SIGNED_OUT') aplicarModoAdmin();
});

// Al abrir la página: primero se revisa si es admin y luego se cargan las Cards
aplicarModoAdmin();


// =============================================
// 5.2 READ con filtros — buscarProductoPorId() y buscarProductosPorNombre()
// =============================================
async function buscarProductoPorId(id) {
  const { data, error } = await supabaseClient
    .from('MITABLA1')
    .select('*')
    .eq('id', id)    // eq = "equal" (igual a) — equivalente a find(p => p.id === id)
    .single();       // single() = "espero exactamente una fila, dámela
                     // como objeto, no como array de un elemento"

  if (error) return null;
  return data;
}

async function buscarProductosPorNombre(texto) {
  // quitamos comas y paréntesis porque .or() los usa como separadores
  const limpio = texto.replace(/[,()]/g, ' ');
  const { data, error } = await supabaseClient
    .from('MITABLA1')
    .select('*')
    .or(`Nombre.ilike.%${limpio}%,marca.ilike.%${limpio}%`)
    .order('id', { ascending: true });
    // ilike = "like" insensible a mayúsculas/minúsculas.
    // los símbolos % significan "cualquier texto antes/después" —
    // equivalente a .toLowerCase().includes(texto)
    // .or() busca la coincidencia en el modelo O en la marca

  if (error) return [];
  return data;
}


// =============================================
// 5.3 UPDATE — modificarProducto()
// =============================================
// AHORA (Supabase resuelve "encontrar y actualizar" en una sola instrucción):
async function modificarProducto(id, cambios) {
  ultimoErrorUpdate = '';

  const { data, error } = await supabaseClient
    .from('MITABLA1')
    .update(cambios)   // solo actualiza las propiedades que vengan en "cambios"
    .eq('id', id)      // ...de la fila donde el id coincida
    .select();

  if (error) {
    console.error("Error al modificar en Supabase:", error);
    ultimoErrorUpdate = '❌ Error de Supabase al modificar: ' + error.message;
    return null;
  }

  // Si Supabase devuelve [] (array vacío) sin error, es porque RLS bloqueó el UPDATE
  if (!data || data.length === 0) {
    console.warn("Supabase devolvió 0 filas modificadas. Falta política RLS para UPDATE en MITABLA1.");
    ultimoErrorUpdate =
      '⚠️ Supabase bloqueó el UPDATE (0 filas afectadas). En Supabase ve a Authentication > Policies en MITABLA1 y crea una política para UPDATE (o desactiva RLS).';
    return null;
  }

  return data[0];
}


// =============================================
// 5.4 DELETE — eliminarProducto()
// =============================================
// AHORA:
async function eliminarProducto(id) {

  const { data, error } = await supabaseClient
    .from('MITABLA1')
    .delete()
    .eq('id', id)
    .select();     // .select() devuelve la fila borrada; si llega vacío [], RLS bloqueó el borrado

  if (error) {
    console.error("Error al eliminar en Supabase:", error);
    return false;
  }

  // Si devuelve 0 filas borradas, falta la política RLS para DELETE en Supabase
  if (!data || data.length === 0) {
    console.warn("Supabase devolvió 0 filas eliminadas. Falta política RLS para DELETE en MITABLA1.");
    return false;
  }

  return !error;   // true si NO hubo error y sí borró la fila en Supabase
}
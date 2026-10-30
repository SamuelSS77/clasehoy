// prueba.js - Gestión CRUD de productos en MITABLA1 con Supabase

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
  const datosFormulario = {
    Nombre: document.getElementById('input-nombre').value.trim(),
    precio: Number(document.getElementById('input-precio').value) || 0,
    descripcion: document.getElementById('input-descripcion').value.trim(),
    unidades: Number(document.getElementById('input-unidades').value) || 0,
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
      textoBtn.textContent = 'GUARDAR PRODUCTO';
    }
  }
});

// Función auxiliar para cargar un producto en el formulario y editarlo
function cargarProductoEnFormulario(producto) {
  idProductoEditando = producto.id;
  document.getElementById('input-nombre').value = producto.Nombre ?? '';
  document.getElementById('input-precio').value = producto.precio ?? 0;
  document.getElementById('input-unidades').value = producto.unidades ?? 0;
  document.getElementById('input-descripcion').value = producto.descripcion ?? '';
  document.getElementById('input-imagen').value = producto.image_url ?? '';

  document.querySelector('#form-producto .form-kicker').textContent = `TODO A MIL // EDITANDO ID #${producto.id}`;
  document.querySelector('#form-producto h2').textContent = 'MODIFICAR PRODUCTO';
  document.getElementById('texto-btn-form').textContent = 'GUARDAR CAMBIOS';
  document.getElementById('btn-cancelar-edicion').style.display = 'block';

  document.getElementById('form-producto').scrollIntoView({ behavior: 'smooth' });
}

function salirModoEdicion() {
  idProductoEditando = null;
  document.getElementById('form-producto').reset();
  document.querySelector('#form-producto .form-kicker').textContent = 'TODO A MIL // NUEVO ITEM';
  document.querySelector('#form-producto h2').textContent = 'AGREGAR PRODUCTO';
  document.getElementById('texto-btn-form').textContent = 'GUARDAR PRODUCTO';
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
    contador.textContent = `${total} ${total === 1 ? 'PRODUCTO' : 'PRODUCTOS'}`;
  }

  if (!data || data.length === 0) {
    contenedor.innerHTML = '<p class="estado-cards">No se encontraron productos.</p>';
    return;
  }

  contenedor.innerHTML = data.map(producto => {
    const imagen = producto.image_url
      ? `<img src="${producto.image_url}" alt="${producto.Nombre}" class="card-img" />`
      : `<div class="card-img-placeholder">TODO A MIL // SIN IMAGEN</div>`;

    const precioFormateado = Number(producto.precio || 0).toLocaleString('es-CO');
    const unidadesActuales = producto.unidades ?? 0;

    return `
      <article class="producto-card" data-id="${producto.id}">
        <div class="card-top-bar">
          <span class="card-id">ID #${producto.id}</span>
          <span class="card-stock">${unidadesActuales} UNDS</span>
        </div>
        <div class="card-media">
          ${imagen}
        </div>
        <div class="card-body">
          <h3 class="card-titulo">${producto.Nombre || 'Sin nombre'}</h3>
          <p class="card-desc">${producto.descripcion || 'Sin descripción'}</p>
          <div class="card-footer">
            <span class="card-precio">$${precioFormateado}</span>
            <span class="card-arrow">↗</span>
          </div>
          <div class="card-actions">
            <button type="button" class="btn-card btn-editar" data-id="${producto.id}">
              EDITAR
            </button>
            <button type="button" class="btn-card btn-eliminar" data-id="${producto.id}">
              ELIMINAR
            </button>
          </div>
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

// Cargar el catálogo de Cards automáticamente al abrir la página
mostrarProductosEnCards();


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
  const { data, error } = await supabaseClient
    .from('MITABLA1')
    .select('*')
    .ilike('Nombre', `%${texto}%`);
    // ilike = "like" insensible a mayúsculas/minúsculas.
    // los símbolos % significan "cualquier texto antes/después" —
    // equivalente a .toLowerCase().includes(texto)

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
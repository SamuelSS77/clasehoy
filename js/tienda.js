// =============================================
// tienda.js — "Productos tienda" en cliente.html
// Lee los productos de MITABLA1 (igual que admin.js) y los muestra con las
// mismas fichas, pero en vez de EDITAR / ELIMINAR cada ficha tiene:
//   [ − ] cantidad [ + ]  y  AGREGAR AL CARRITO
// El carrito se guarda en el navegador (localStorage) para no perderse al
// recargar la página. Solo se guardan id → cantidad; nombre y precio se leen
// siempre de la base de datos para que estén actualizados.
// =============================================
(() => {
  const CLAVE_CARRITO = 'rough-street-carrito';

  let productos = [];        // filas de MITABLA1
  const cantidades = {};     // cantidad elegida en cada ficha (id → n)
  let carrito = leerCarrito(); // id → unidades en el carrito

  const contenedor = document.getElementById('contenedor-tienda');
  const inputBuscar = document.getElementById('tienda-buscar');

  // ---------- Utilidades ----------
  function escaparHTML(valor) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const formatoCOP = (valor) => '$' + Number(valor || 0).toLocaleString('es-CO');

  function leerCarrito() {
    try {
      const guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
      return guardado && typeof guardado === 'object' ? guardado : {};
    } catch {
      return {};
    }
  }

  function guardarCarrito() {
    try {
      localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
    } catch {
      // Sin almacenamiento (modo privado, etc.): el carrito vive solo en memoria
    }
  }

  const buscarProducto = (id) => productos.find(p => String(p.id) === String(id));
  const stockDe = (producto) => Math.max(0, Number(producto?.unidades ?? 0));
  const enCarrito = (id) => carrito[id] || 0;
  // Unidades que aún se pueden agregar sin superar el stock
  const disponibles = (producto) => Math.max(0, stockDe(producto) - enCarrito(producto.id));

  // ---------- READ: cargar productos ----------
  async function cargarProductos() {
    contenedor.innerHTML = '<p class="estado-cards">Cargando productos...</p>';

    const { data, error } = await supabaseClient
      .from('MITABLA1')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      contenedor.innerHTML = `<p class="estado-cards">Error al cargar: ${escaparHTML(error.message)}</p>`;
      return;
    }

    productos = data || [];

    // Se quita del carrito lo que ya no existe y se ajusta al stock actual
    for (const id of Object.keys(carrito)) {
      const producto = buscarProducto(id);
      const maximo = stockDe(producto);
      if (!producto || maximo === 0) delete carrito[id];
      else carrito[id] = Math.min(carrito[id], maximo);
    }
    guardarCarrito();

    pintarProductos();
    pintarCarrito();
  }

  // ---------- Fichas ----------
  function productosFiltrados() {
    const texto = inputBuscar.value.trim().toLowerCase();
    if (!texto) return productos;
    return productos.filter(p =>
      [p.Nombre, p.marca, p.sku, p.colorway].some(campo => String(campo || '').toLowerCase().includes(texto))
    );
  }

  function pintarProductos() {
    const lista = productosFiltrados();

    if (lista.length === 0) {
      contenedor.innerHTML = '<p class="estado-cards">No se encontraron sneakers.</p>';
      return;
    }

    contenedor.innerHTML = lista.map(producto => {
      const nombre = escaparHTML(producto.Nombre || 'Sin nombre');
      const imagen = producto.image_url
        ? `<img src="${escaparHTML(producto.image_url)}" alt="${nombre}" class="card-img" loading="lazy" />`
        : `<div class="card-img-placeholder">ROUGH STREET // SIN IMAGEN</div>`;

      const precioUsd = producto.precio_usd ? `US$${Number(producto.precio_usd).toLocaleString('en-US')}` : '';
      const stock = stockDe(producto);
      const stockTexto = stock === 0 ? 'AGOTADO' : stock <= 8 ? `ÚLTIMOS ${stock}` : `${stock} PARES`;

      const badge = producto.badge ? `<span class="card-badge">${escaparHTML(producto.badge)}</span>` : '';
      const estilos = Array.isArray(producto.categoria) ? producto.categoria.join(' / ') : '';
      const meta = [producto.marca, estilos].filter(Boolean).map(escaparHTML).join(' · ');
      const tallas = Array.isArray(producto.tallas_us) && producto.tallas_us.length
        ? `<div class="card-tallas">${producto.tallas_us.map(t => `<span>${escaparHTML(t)}</span>`).join('')}</div>`
        : '';

      // Cantidad elegida: entre 1 y lo que queda disponible
      const libres = disponibles(producto);
      const cantidad = Math.min(Math.max(1, cantidades[producto.id] || 1), Math.max(1, libres));
      cantidades[producto.id] = cantidad;
      const sinUnidades = libres === 0;
      const yaEnCarrito = enCarrito(producto.id);

      return `
        <article class="producto-card" data-id="${producto.id}">
          <div class="card-top-bar">
            <span class="card-id">${escaparHTML(producto.sku || 'ID #' + producto.id)}</span>
            <span class="card-stock${stock <= 8 ? ' card-stock-bajo' : ''}">${stockTexto}</span>
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
              <span class="card-precio">${formatoCOP(producto.precio)}</span>
              <span class="card-precio-usd">${precioUsd}</span>
            </div>
            <div class="card-compra">
              <div class="selector-cantidad">
                <button type="button" data-accion="restar" data-id="${producto.id}" aria-label="Restar una unidad"
                  ${sinUnidades || cantidad <= 1 ? 'disabled' : ''}>−</button>
                <output aria-live="polite">${sinUnidades ? 0 : cantidad}</output>
                <button type="button" data-accion="sumar" data-id="${producto.id}" aria-label="Sumar una unidad"
                  ${sinUnidades || cantidad >= libres ? 'disabled' : ''}>+</button>
              </div>
              <button type="button" class="btn-agregar" data-accion="agregar" data-id="${producto.id}"
                ${sinUnidades ? 'disabled' : ''}>
                ${stock === 0 ? 'AGOTADO' : sinUnidades ? 'SIN MÁS STOCK' : 'AGREGAR AL CARRITO'}
              </button>
            </div>
            ${yaEnCarrito ? `<span class="card-en-carrito">✓ ${yaEnCarrito} EN EL CARRITO</span>` : ''}
          </div>
        </article>
      `;
    }).join('');
  }

  // Un solo listener para todos los botones de las fichas (delegación de eventos)
  contenedor.addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton) return;

    const producto = buscarProducto(boton.dataset.id);
    if (!producto) return;
    const id = producto.id;
    const libres = disponibles(producto);

    if (boton.dataset.accion === 'sumar') {
      cantidades[id] = Math.min((cantidades[id] || 1) + 1, libres);
    } else if (boton.dataset.accion === 'restar') {
      cantidades[id] = Math.max((cantidades[id] || 1) - 1, 1);
    } else if (boton.dataset.accion === 'agregar') {
      const aAgregar = Math.min(cantidades[id] || 1, libres);
      if (aAgregar <= 0) return;
      carrito[id] = enCarrito(id) + aAgregar;
      cantidades[id] = 1;
      guardarCarrito();
      pintarCarrito();
    }

    pintarProductos();
  });

  inputBuscar.addEventListener('input', pintarProductos);

  // ---------- Carrito ----------
  function pintarCarrito() {
    const lista = document.getElementById('carrito-lista');
    const items = Object.entries(carrito)
      .map(([id, cantidad]) => ({ producto: buscarProducto(id), cantidad }))
      .filter(item => item.producto && item.cantidad > 0);

    const totalUnidades = items.reduce((suma, item) => suma + item.cantidad, 0);
    const totalPrecio = items.reduce((suma, item) => suma + item.cantidad * Number(item.producto.precio || 0), 0);

    document.getElementById('carrito-contador').textContent =
      `${totalUnidades} ${totalUnidades === 1 ? 'PAR' : 'PARES'}`;
    document.getElementById('carrito-total').textContent = formatoCOP(totalPrecio);
    document.getElementById('btn-vaciar-carrito').disabled = items.length === 0;

    if (items.length === 0) {
      lista.innerHTML = '<li class="carrito-vacio">Tu carrito está vacío.</li>';
      return;
    }

    lista.innerHTML = items.map(({ producto, cantidad }) => `
      <li class="carrito-item">
        <span class="carrito-item-nombre">${escaparHTML(producto.Nombre || 'Sin nombre')}</span>
        <span class="carrito-item-subtotal">${formatoCOP(cantidad * Number(producto.precio || 0))}</span>
        <div class="selector-cantidad">
          <button type="button" data-accion="restar" data-id="${producto.id}" aria-label="Restar una unidad">−</button>
          <output aria-live="polite">${cantidad}</output>
          <button type="button" data-accion="sumar" data-id="${producto.id}" aria-label="Sumar una unidad"
            ${cantidad >= stockDe(producto) ? 'disabled' : ''}>+</button>
        </div>
        <button type="button" class="btn-quitar" data-accion="quitar" data-id="${producto.id}">QUITAR ✕</button>
      </li>
    `).join('');
  }

  // Sumar / restar / quitar directamente desde el carrito
  document.getElementById('carrito-lista').addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton) return;

    const producto = buscarProducto(boton.dataset.id);
    if (!producto) return;
    const id = producto.id;

    if (boton.dataset.accion === 'sumar') {
      carrito[id] = Math.min(enCarrito(id) + 1, stockDe(producto));
    } else if (boton.dataset.accion === 'restar') {
      carrito[id] = enCarrito(id) - 1;
      if (carrito[id] <= 0) delete carrito[id]; // restar la última unidad la quita
    } else if (boton.dataset.accion === 'quitar') {
      delete carrito[id];
    }

    guardarCarrito();
    pintarCarrito();
    pintarProductos();
  });

  document.getElementById('btn-vaciar-carrito').addEventListener('click', () => {
    carrito = {};
    guardarCarrito();
    pintarCarrito();
    pintarProductos();
  });

  cargarProductos();
})();

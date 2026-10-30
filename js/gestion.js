// =============================================
// 4° gestion.js
// Lógica de la interfaz (usa el objeto Datos)
// =============================================

const form = document.getElementById("formEstudiante");
const inputId = document.getElementById("idEstudiante");
const inputNombre = document.getElementById("nombre");
const inputCorreo = document.getElementById("correo");
const inputCurso = document.getElementById("curso");
const inputEdad = document.getElementById("edad");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");
const titulo = document.getElementById("tituloFormulario");
const tbody = document.getElementById("tablaEstudiantes");
const buscador = document.getElementById("buscar");
const estado = document.getElementById("estadoConexion");
const mensaje = document.getElementById("mensaje");

let estudiantes = [];

// ---------- Utilidades ----------
function mostrarMensaje(texto, tipo = "ok") {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
  setTimeout(() => mensaje.classList.add("oculto"), 3000);
}

function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

function limpiarFormulario() {
  form.reset();
  inputId.value = "";
  titulo.textContent = "Nuevo estudiante";
  btnGuardar.textContent = "Guardar";
  btnCancelar.classList.add("oculto");
}

// ---------- Renderizado ----------
function renderizarTabla(lista) {
  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="vacio">No hay registros</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(e => `
    <tr>
      <td>${escaparHTML(e.nombre)}</td>
      <td>${escaparHTML(e.correo)}</td>
      <td>${escaparHTML(e.curso)}</td>
      <td>${escaparHTML(String(e.edad))}</td>
      <td class="celda-acciones">
        <button class="btn btn-editar" data-id="${e.id}" data-accion="editar">✏️</button>
        <button class="btn btn-eliminar" data-id="${e.id}" data-accion="eliminar">🗑️</button>
      </td>
    </tr>
  `).join("");
}

function filtrar() {
  const texto = buscador.value.trim().toLowerCase();
  const filtrados = estudiantes.filter(e =>
    [e.nombre, e.correo, e.curso].some(v => (v || "").toLowerCase().includes(texto))
  );
  renderizarTabla(filtrados);
}

// ---------- Operaciones ----------
async function cargarEstudiantes() {
  try {
    estudiantes = await Datos.listar();
    filtrar();
    estado.textContent = "● Conectado";
    estado.className = "estado conectado";
  } catch (err) {
    console.error(err);
    estado.textContent = "● Sin conexión";
    estado.className = "estado error";
    tbody.innerHTML = `<tr><td colspan="5" class="vacio">Error al cargar: ${escaparHTML(err.message)}</td></tr>`;
  }
}

async function guardar(evento) {
  evento.preventDefault();

  const registro = {
    nombre: inputNombre.value.trim(),
    correo: inputCorreo.value.trim(),
    curso: inputCurso.value.trim(),
    edad: parseInt(inputEdad.value, 10)
  };

  btnGuardar.disabled = true;
  try {
    if (inputId.value) {
      await Datos.actualizar(inputId.value, registro);
      mostrarMensaje("Estudiante actualizado ✅");
    } else {
      await Datos.crear(registro);
      mostrarMensaje("Estudiante creado ✅");
    }
    limpiarFormulario();
    await cargarEstudiantes();
  } catch (err) {
    console.error(err);
    mostrarMensaje("Error: " + err.message, "error");
  } finally {
    btnGuardar.disabled = false;
  }
}

function editar(id) {
  const e = estudiantes.find(x => String(x.id) === String(id));
  if (!e) return;
  inputId.value = e.id;
  inputNombre.value = e.nombre;
  inputCorreo.value = e.correo;
  inputCurso.value = e.curso;
  inputEdad.value = e.edad;
  titulo.textContent = "Editar estudiante";
  btnGuardar.textContent = "Actualizar";
  btnCancelar.classList.remove("oculto");
  inputNombre.focus();
}

async function eliminar(id) {
  if (!confirm("¿Seguro que deseas eliminar este estudiante?")) return;
  try {
    await Datos.eliminar(id);
    mostrarMensaje("Estudiante eliminado 🗑️");
    if (inputId.value === String(id)) limpiarFormulario();
    await cargarEstudiantes();
  } catch (err) {
    console.error(err);
    mostrarMensaje("Error: " + err.message, "error");
  }
}

// ---------- Eventos ----------
form.addEventListener("submit", guardar);
btnCancelar.addEventListener("click", limpiarFormulario);
buscador.addEventListener("input", filtrar);

tbody.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) return;
  const { id, accion } = boton.dataset;
  if (accion === "editar") editar(id);
  if (accion === "eliminar") eliminar(id);
});

// ---------- Inicio ----------
document.addEventListener("DOMContentLoaded", cargarEstudiantes);

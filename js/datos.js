// =============================================
// 3° datos.js
// Capa de acceso a datos (CRUD) con Supabase
// =============================================

const TABLA = "estudiantes";

const Datos = {
  // Obtener todos los registros
  async listar() {
    const { data, error } = await supabaseClient
      .from(TABLA)
      .select("*")
      .order("id", { ascending: false });
    if (error) throw error;
    return data;
  },

  // Obtener un registro por id
  async obtener(id) {
    const { data, error } = await supabaseClient
      .from(TABLA)
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  // Insertar un nuevo registro
  async crear(registro) {
    const { data, error } = await supabaseClient
      .from(TABLA)
      .insert([registro])
      .select();
    if (error) throw error;
    return data[0];
  },

  // Actualizar un registro existente
  async actualizar(id, cambios) {
    const { data, error } = await supabaseClient
      .from(TABLA)
      .update(cambios)
      .eq("id", id)
      .select();
    if (error) throw error;
    return data[0];
  },

  // Eliminar un registro
  async eliminar(id) {
    const { error } = await supabaseClient
      .from(TABLA)
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  }
};

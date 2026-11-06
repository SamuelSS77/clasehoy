// =============================================
// 2° supabaseClient.js
// Crea el cliente de Supabase (disponible globalmente)
// =============================================

// 👉 Reemplaza con los datos de tu proyecto:
// Supabase > Project Settings > API
const SUPABASE_URL = "https://xosrosvjvqhuetxhepzm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvc3Jvc3ZqdnFodWV0eGhlcHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMzE4MDcsImV4cCI6MjEwNzcwNzgwN30.jHvBeF28XeLCs8ZEqMYnYtjJBP1y0a3y8LHEBgMceVE";

// La librería del CDN expone el objeto global "supabase"
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const db = supabaseClient;

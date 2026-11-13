-- ROUGH STREET // Actualizar Air Jordan 4 Retro 'Thunder' (fila id 18)
-- Ejecutar en Supabase > SQL Editor
update public."MITABLA1"
set
  codigo      = 'STR-006',
  "Nombre"    = 'Air Jordan 4 Retro ''Thunder''',
  marca       = 'Jordan',
  categoria   = '["Basketball","Hype"]',
  colorway    = 'Black / Tour Yellow',
  precio_usd  = 210,
  precio      = 870000,   -- COP: 210 USD a la misma tasa del catálogo (~4.140)
  tallas_us   = '[7.5,8,8.5,9,10,10.5,11]',
  unidades    = 15,
  disponible  = true,
  badge       = 'New Drop', -- isNewDrop: true
  descripcion = 'Silueta icónica de 1989 en nobuck negro con acentos vibrantes en amarillo Tour Yellow, malla lateral clásica y unidad Air visible.',
  image_url   = 'https://images.unsplash.com/photo-1579338559194-a162d19bf842?auto=format&fit=crop&w=800&q=80'
where codigo = 'snk-005' or id = 18
returning id, codigo, "Nombre", precio, precio_usd, unidades, badge;

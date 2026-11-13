-- =============================================================
-- ROUGH STREET // Catálogo de sneakers en public."MITABLA1"
-- Ejecutar COMPLETO en Supabase > SQL Editor.
-- 1) Agrega las columnas nuevas  2) Borra los productos viejos
-- 3) Inserta los 15 sneakers
-- =============================================================

alter table public."MITABLA1"
  add column if not exists codigo     text,
  add column if not exists sku        text,
  add column if not exists marca      text,
  add column if not exists colorway   text,
  add column if not exists precio_usd numeric,
  add column if not exists tallas_us  jsonb,
  add column if not exists badge      text;

-- "precio" = precio en COP, "unidades" = stock,
-- "categoria" (json) = estilos, ej: ["Skate","Lifestyle"]

delete from public."MITABLA1";

insert into public."MITABLA1"
  (codigo, sku, marca, "Nombre", colorway, categoria, precio, precio_usd, unidades, descuento, disponible, tallas_us, badge, descripcion, image_url)
values
  ('snk-001', 'NK-DNK-PND-01', 'Nike', 'Nike Dunk Low Retro ''Panda''', 'White / Black', '["Skate","Lifestyle"]', 480000, 115, 24, 0, true, '[7,7.5,8,8.5,9,9.5,10,11]', 'Best Seller', 'Silueta clásica de los 80 con bloques de color en blanco y negro de alto contraste en cuero premium.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'),
  ('snk-002', 'JB-AJ1-CHI-02', 'Jordan', 'Air Jordan 1 Retro High OG ''Lost & Found''', 'Varsity Red / Black / Sail', '["Basketball","Grails"]', 750000, 180, 8, 0, true, '[8,8.5,9,9.5,10,10.5]', 'Hype Drop', 'El ícono del streetwear con acabado vintage envejecido en el cuello y la clásica combinación Chicago.', 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80'),
  ('snk-003', 'NB-550-GRN-03', 'New Balance', 'New Balance 550 ''White Green''', 'White / Pine Green', '["Retro Basketball"]', 500000, 120, 18, 0, true, '[7,8,8.5,9,10,11]', 'Trending', 'Estética retro de cancha de 1989 con cuero perforado y detalles en verde pino.', 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80'),
  ('snk-004', 'AD-SMB-OGB-04', 'Adidas', 'Adidas Samba OG ''Cloud White''', 'Cloud White / Core Black', '["Terrace","Street"]', 420000, 100, 30, 0, true, '[6.5,7,7.5,8,8.5,9,9.5,10]', 'Essential', 'Puntera en T de gamuza y suela de goma caramelo que domina la moda urbana actual.', 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=800&q=80'),
  ('STR-006', 'JB-AJ4-BCT-05', 'Jordan', 'Air Jordan 4 Retro ''Thunder''', 'Black / Tour Yellow', '["Basketball","Hype"]', 870000, 210, 15, 0, true, '[7.5,8,8.5,9,10,10.5,11]', 'New Drop', 'Silueta icónica de 1989 en nobuck negro con acentos vibrantes en amarillo Tour Yellow, malla lateral clásica y unidad Air visible.', 'https://images.unsplash.com/photo-1579338559194-a162d19bf842?auto=format&fit=crop&w=800&q=80'),
  ('snk-006', 'NK-AF1-WHT-06', 'Nike', 'Nike Air Force 1 ''07 Low ''Triple White''', 'White / White', '["Lifestyle","Classic"]', 480000, 115, 45, 0, true, '[7,7.5,8,8.5,9,9.5,10,10.5,11,12]', 'Classic', 'El pilar indiscutible del streetwear en cuero blanco impecable con placa metálica AF1 en los cordones.', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80'),
  ('snk-007', 'AS-K14-SLV-07', 'ASICS', 'ASICS Gel-Kayano 14 ''Cream Metallic''', 'Cream / Pure Silver', '["Tech Runner","Y2K"]', 620000, 150, 14, 0, true, '[7.5,8,8.5,9,9.5,10]', 'Y2K Trend', 'Estética runner de finales de los 2000 con malla transpirable, capas plateadas metálicas y amortiguación GEL.', 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80'),
  ('snk-008', 'NB-9060-GRY-08', 'New Balance', 'New Balance 9060 ''Sea Salt''', 'Sea Salt / Rain Cloud', '["Chunky","Futuristic"]', 660000, 160, 12, 0, true, '[7,8,8.5,9,9.5,10,10.5]', 'Hot Release', 'Silueta robusta y futurista con suela ondulada exagerada y amortiguación dual ABZORB y SBS.', 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=800&q=80'),
  ('snk-009', 'AD-CMP-00S-09', 'Adidas', 'Adidas Campus 00s ''Core Black''', 'Core Black / Cloud White', '["Skate","Chunky"]', 450000, 110, 22, 0, true, '[7,7.5,8,8.5,9,10,11]', 'Skate Favorite', 'Proporciones infladas inspiradas en el skate de los años 2000 con cordones anchos y gamuza suave.', 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80'),
  ('snk-010', 'SL-XT6-BLK-10', 'Salomon', 'Salomon XT-6 ''Black Phantom''', 'Black / Phantom / Pewter', '["Gorpcore","Trail"]', 830000, 200, 10, 0, true, '[8,8.5,9,9.5,10,10.5,11]', 'Gorpcore', 'El referente del estilo técnico urbano con sistema de atado rápido Quicklace y chasis Agile Chassis System.', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80'),
  ('snk-011', 'VN-KNU-SKL-11', 'Vans', 'Vans Knu Skool ''Black White''', 'Black / True White', '["Skate","Street"]', 310000, 75, 28, 0, true, '[6.5,7,7.5,8,8.5,9,9.5,10,11]', 'Value Pick', 'Reinterpretación noventera del Old Skool con lengüeta acolchada gigante y Sidestripe 3D moldeado.', 'https://images.unsplash.com/photo-1562183241-b937e95585b6?auto=format&fit=crop&w=800&q=80'),
  ('snk-012', 'NK-AM90-INF-12', 'Nike', 'Nike Air Max 90 ''Infrared''', 'White / Cool Grey / Infrared', '["Retro Runner"]', 560000, 135, 16, 0, true, '[8,8.5,9,9.5,10,10.5,11]', 'Icon', 'Diseño legendario de Tinker Hatfield con cámara de aire visible enmarcada en rojo infrarrojo.', 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=800&q=80'),
  ('snk-013', 'PM-PLM-BLU-13', 'Puma', 'Puma Palermo Leather ''Cobalt''', 'Cobalt Glaze / White / Gum', '["Terrace","Retro"]', 375000, 90, 20, 0, true, '[7,7.5,8,8.5,9,9.5,10]', 'New Arrival', 'Clásico de los archivos de fútbol de los 80 con etiqueta dorada lateral y suela de goma clásica.', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80'),
  ('snk-014', 'JB-AJ1L-TRV-14', 'Jordan', 'Air Jordan 1 Low SE ''Reverse Mocha''', 'Sail / University Red / Ridgerock', '["Grails","Collab Style"]', 810000, 195, 5, 0, true, '[8,8.5,9,9.5,10]', 'Ultra Limited', 'Tonos tierra en nubuck café con superposiciones color crema y detalles carmesí de alto impacto.', 'https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=800&q=80'),
  ('snk-015', 'CV-C70-BLK-15', 'Converse', 'Converse Chuck 70 High ''Vintage Black''', 'Black / Egret', '["Street Classic"]', 375000, 90, 35, 0, true, '[6,7,7.5,8,8.5,9,9.5,10,11]', 'Streetwear Staple', 'Versión mejorada con lona de alto gramaje, costuras laterales reforzadas y entresuela barnizada en tono crema.', 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80');

-- -------------------------------------------------------------
-- OPCIONAL: hoy la clave anónima (anon) solo puede LEER MITABLA1.
-- Si quieres que el formulario de admin.html pueda crear, editar
-- y borrar sin iniciar sesión, descomenta estas políticas.
-- (Solo para práctica: cualquiera con la anon key podría modificar el catálogo.)
-- -------------------------------------------------------------
-- create policy "anon inserta productos" on public."MITABLA1" for insert to anon with check (true);
-- create policy "anon edita productos"   on public."MITABLA1" for update to anon using (true) with check (true);
-- create policy "anon borra productos"   on public."MITABLA1" for delete to anon using (true);
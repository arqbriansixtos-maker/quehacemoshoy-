-- Módulo 3: Lugares y Eventos
-- Carga lugares reales de Ciudad de México, uno (o dos) por categoría,
-- y algunos eventos de ejemplo asociados a esos lugares.

alter table lugares enable row level security;
drop policy if exists "ver_lugares" on lugares;
create policy "ver_lugares" on lugares for select to authenticated using (true);

alter table eventos enable row level security;
drop policy if exists "ver_eventos" on eventos;
create policy "ver_eventos" on eventos for select to authenticated using (true);

insert into lugares (nombre, latitud, longitud, categoria_id, descripcion) values
('Parque Hundido', 19.3782922, -99.1787472,
  (select id from categorias where nombre = 'Aire libre'),
  'Parque urbano con senderos, esculturas y espacio para caminar o correr.'),

('Ling Ling by Hakkasan', 19.4240425, -99.1757592,
  (select id from categorias where nombre = 'Gastronomía'),
  'Restaurante asiático de alta cocina con vista panorámica de la ciudad.'),

('Museo Nacional de Arte', 19.4362023, -99.1393955,
  (select id from categorias where nombre = 'Arte y cultura'),
  'Edificio histórico con colección de arte mexicano desde el siglo XVI.'),

('Terraza Catedral', 19.435168, -99.133609,
  (select id from categorias where nombre = 'Vida nocturna'),
  'Terraza con vista a la Catedral Metropolitana, buena carta de cocteles.'),

('Centro Deportivo Chapultepec', 19.4264817, -99.1792972,
  (select id from categorias where nombre = 'Deporte'),
  'Complejo deportivo con alberca, tenis, squash y actividades culturales.'),

('Foro Puebla 186', 19.422089, -99.163743,
  (select id from categorias where nombre = 'Música en vivo'),
  'Foro íntimo para conciertos pequeños en la colonia Roma.'),

('Zoológico de Chapultepec', 19.4232085, -99.1895256,
  (select id from categorias where nombre = 'Planes en familia'),
  'Zoológico gratuito, ideal para pasar el día en familia.'),

('Zona Benessere SPA', 19.3066997, -99.1666198,
  (select id from categorias where nombre = 'Bienestar y relax'),
  'Spa con masajes, faciales y paquetes de relajación.'),

('Centro Santa Fe', 19.3613493, -99.2736160,
  (select id from categorias where nombre = 'Compras'),
  'Uno de los centros comerciales más grandes de Latinoamérica.'),

('Cineteca Nacional', 19.360612, -99.1645128,
  (select id from categorias where nombre = 'Cine y series'),
  'Cine cultural con funciones nacionales e internacionales, cafés y librería.')
on conflict do nothing;

insert into eventos (lugar_id, fecha_inicio, fecha_fin)
select id, now() + interval '2 days', now() + interval '2 days 3 hours'
from lugares where nombre = 'Foro Puebla 186'
on conflict do nothing;

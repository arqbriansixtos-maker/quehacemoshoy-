-- Módulo 7b: Importación automática de lugares desde fuentes verídicas
-- Agrega trazabilidad: de dónde vino cada lugar (captura manual vs. fuente externa).

alter table lugares add column if not exists fuente text default 'manual';

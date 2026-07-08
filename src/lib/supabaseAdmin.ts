import { createClient } from '@supabase/supabase-js'

// ⚠️ Este cliente usa la "service role key": tiene permiso para saltarse
// TODAS las reglas de seguridad (RLS). Solo se debe usar en rutas de
// servidor (nunca en componentes del navegador), y solo para tareas
// administrativas como esta importación automática de lugares.
export function crearClienteAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Este archivo es la ÚNICA puerta de entrada a Supabase.
// Cualquier parte de la app que necesite hablar con la base de datos
// pasa por aquí. Así, si algún día cambiamos de proveedor,
// solo modificamos este archivo.

import { createBrowserClient } from '@supabase/ssr'

export function crearClienteSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

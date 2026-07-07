'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearClienteSupabase } from '@/lib/supabase'
import type { Perfil } from '@/types/database'

export default function PaginaPerfil() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [cargando, setCargando] = useState(true)
  const router = useRouter()
  const supabase = crearClienteSupabase()

  useEffect(() => {
    async function cargarPerfil() {
      const { data: { session } } = await supabase.auth.getSession()

      // Si no hay sesión activa, lo mandamos a iniciar sesión.
      if (!session) {
        router.push('/auth/login')
        return
      }

      const { data } = await supabase
        .from('perfiles')
        .select('*')
        .eq('usuario_id', session.user.id)
        .single()

      setPerfil(data)
      setCargando(false)
    }

    cargarPerfil()
  }, [])

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (cargando) return <p style={{ textAlign: 'center', marginTop: 80 }}>Cargando...</p>
  if (!perfil) return <p style={{ textAlign: 'center', marginTop: 80 }}>No se encontró el perfil.</p>

  return (
    <div style={{ maxWidth: 360, margin: '80px auto' }}>
      <h1>Hola, {perfil.nombre}</h1>
      <p>Ciudad: {perfil.ciudad ?? 'No especificada'}</p>
      <p>Edad: {perfil.edad ?? 'No especificada'}</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <a href="/preferencias">Editar mis preferencias</a>
        <a href="/lugares">Ver lugares</a>
        <a href="/mapa">Ver mapa</a>
        <a href="/feed">Mi feed</a>
        <button onClick={cerrarSesion}>Cerrar sesión</button>
      </div>
    </div>
  )
}

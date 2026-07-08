'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearClienteSupabase } from '@/lib/supabase'
import type { Lugar, Categoria } from '@/types/database'

type LugarConCategoria = Lugar & { categorias: Categoria | null }

export default function PaginaLugares() {
  const [lugares, setLugares] = useState<LugarConCategoria[]>([])
  const [cargando, setCargando] = useState(true)
  const router = useRouter()
  const supabase = crearClienteSupabase()

  useEffect(() => {
    async function cargarLugares() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      // Trae cada lugar junto con el nombre de su categoría
      const { data } = await supabase
        .from('lugares')
        .select('*, categorias(*)')
        .order('nombre')

      setLugares((data as LugarConCategoria[]) ?? [])
      setCargando(false)
    }

    cargarLugares()
  }, [])

  if (cargando) return <p style={{ textAlign: 'center', marginTop: 80 }}>Cargando...</p>

  return (
    <div style={{ maxWidth: 600, margin: '60px auto' }}>
      <h1>Lugares para descubrir</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
        {lugares.map((lugar) => (
          <div key={lugar.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>{lugar.nombre}</h3>
              <span style={{ fontSize: 12, color: '#666' }}>
                {lugar.categorias?.nombre}
              </span>
            </div>
            <p style={{ color: '#444', marginBottom: 4 }}>{lugar.descripcion}</p>
            {lugar.fuente === 'openstreetmap' && (
              <span style={{ fontSize: 11, color: '#2a7a2a' }}>✓ Verificado en OpenStreetMap</span>
            )}
          </div>
        ))}
      </div>
      <a href="/perfil" style={{ display: 'inline-block', marginTop: 24 }}>
        ← Volver al perfil
      </a>
    </div>
  )
}

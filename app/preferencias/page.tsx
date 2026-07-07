'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearClienteSupabase } from '@/lib/supabase'
import type { Categoria } from '@/types/database'

export default function PaginaPreferencias() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set())
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState<string | null>(null)
  const router = useRouter()
  const supabase = crearClienteSupabase()

  useEffect(() => {
    async function cargarDatos() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      setUsuarioId(session.user.id)

      // Trae todas las categorías disponibles (el catálogo fijo)
      const { data: listaCategorias } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre')

      // Trae cuáles ya había elegido este usuario antes
      const { data: preferenciasActuales } = await supabase
        .from('preferencias')
        .select('categoria_id')
        .eq('usuario_id', session.user.id)

      setCategorias(listaCategorias ?? [])
      setSeleccionadas(new Set((preferenciasActuales ?? []).map((p) => p.categoria_id)))
      setCargando(false)
    }

    cargarDatos()
  }, [])

  async function alternarCategoria(categoriaId: string) {
    if (!usuarioId) return
    setGuardando(categoriaId)

    const yaEstaSeleccionada = seleccionadas.has(categoriaId)
    const copia = new Set(seleccionadas)

    if (yaEstaSeleccionada) {
      // Quitarla: tanto de la pantalla como de la base de datos
      copia.delete(categoriaId)
      await supabase
        .from('preferencias')
        .delete()
        .eq('usuario_id', usuarioId)
        .eq('categoria_id', categoriaId)
    } else {
      // Agregarla: tanto en la pantalla como en la base de datos
      copia.add(categoriaId)
      await supabase
        .from('preferencias')
        .insert({ usuario_id: usuarioId, categoria_id: categoriaId })
    }

    setSeleccionadas(copia)
    setGuardando(null)
  }

  if (cargando) return <p style={{ textAlign: 'center', marginTop: 80 }}>Cargando...</p>

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
      <h1>¿Qué te gusta hacer?</h1>
      <p>Elige todas las que apliquen. Puedes cambiarlas cuando quieras.</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 24 }}>
        {categorias.map((categoria) => {
          const activa = seleccionadas.has(categoria.id)
          return (
            <button
              key={categoria.id}
              onClick={() => alternarCategoria(categoria.id)}
              disabled={guardando === categoria.id}
              style={{
                padding: '10px 16px',
                borderRadius: 999,
                border: activa ? '2px solid black' : '1px solid #ccc',
                background: activa ? 'black' : 'white',
                color: activa ? 'white' : 'black',
                cursor: 'pointer',
              }}
            >
              {categoria.nombre}
            </button>
          )
        })}
      </div>

      <button
        onClick={() => router.push('/perfil')}
        style={{ marginTop: 32 }}
      >
        Listo, ir a mi perfil
      </button>
    </div>
  )
}

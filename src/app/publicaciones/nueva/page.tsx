'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearClienteSupabase } from '@/lib/supabase'
import type { Categoria, Lugar } from '@/types/database'

export default function PaginaNuevaPublicacion() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [lugares, setLugares] = useState<Lugar[]>([])
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  const [texto, setTexto] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [lugarId, setLugarId] = useState('')
  const [latitud, setLatitud] = useState<number | null>(null)
  const [longitud, setLongitud] = useState<number | null>(null)
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

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

      const { data: listaCategorias } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre')

      const { data: listaLugares } = await supabase
        .from('lugares')
        .select('*')
        .order('nombre')

      setCategorias(listaCategorias ?? [])
      setLugares(listaLugares ?? [])
      setCargando(false)
    }

    cargarDatos()
  }, [])

  // Si el usuario elige un lugar de la lista, usamos automáticamente
  // las coordenadas de ese lugar como ubicación de la publicación.
  function elegirLugar(id: string) {
    setLugarId(id)
    const lugar = lugares.find((l) => l.id === id)
    if (lugar) {
      setLatitud(lugar.latitud)
      setLongitud(lugar.longitud)
      setError('')
    }
  }

  // Alternativa: usar la ubicación real del navegador (GPS/wifi).
  function usarUbicacionActual() {
    if (!navigator.geolocation) {
      setError('Tu navegador no permite compartir ubicación.')
      return
    }
    setBuscandoUbicacion(true)
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setLatitud(posicion.coords.latitude)
        setLongitud(posicion.coords.longitude)
        setBuscandoUbicacion(false)
        setError('')
      },
      () => {
        setError('No pudimos obtener tu ubicación. Intenta de nuevo o elige un lugar de la lista.')
        setBuscandoUbicacion(false)
      }
    )
  }

  async function publicar() {
    if (!usuarioId) return

    if (!texto.trim()) {
      setError('Escribe algo antes de publicar.')
      return
    }
    if (!categoriaId) {
      setError('Elige un tipo para tu publicación.')
      return
    }
    if (latitud === null || longitud === null) {
      setError('Registra una ubicación: elige un lugar o usa tu ubicación actual.')
      return
    }

    setGuardando(true)
    setError('')

    const { error: errorInsertar } = await supabase.from('publicaciones').insert({
      usuario_id: usuarioId,
      texto: texto.trim(),
      categoria_id: categoriaId,
      lugar_id: lugarId || null,
      latitud,
      longitud,
    })

    setGuardando(false)

    if (errorInsertar) {
      setError('No se pudo publicar. Intenta de nuevo.')
      return
    }

    router.push('/mapa')
  }

  if (cargando) return <p style={{ textAlign: 'center', marginTop: 80 }}>Cargando...</p>

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 16px' }}>
      <h1>Nueva publicación</h1>

      <label style={{ display: 'block', marginTop: 16 }}>
        ¿Qué quieres compartir?
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          style={{ width: '100%', marginTop: 6, padding: 8, boxSizing: 'border-box' }}
          placeholder="Cuéntanos qué está pasando..."
        />
      </label>

      <label style={{ display: 'block', marginTop: 16 }}>
        Tipo
        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          style={{ width: '100%', marginTop: 6, padding: 8, boxSizing: 'border-box' }}
        >
          <option value="">Elige un tipo...</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.emoji} {categoria.nombre}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'block', marginTop: 16 }}>
        Lugar (opcional)
        <select
          value={lugarId}
          onChange={(e) => elegirLugar(e.target.value)}
          style={{ width: '100%', marginTop: 6, padding: 8, boxSizing: 'border-box' }}
        >
          <option value="">Ninguno en particular</option>
          {lugares.map((lugar) => (
            <option key={lugar.id} value={lugar.id}>
              {lugar.nombre}
            </option>
          ))}
        </select>
      </label>

      <div style={{ marginTop: 16 }}>
        <button onClick={usarUbicacionActual} disabled={buscandoUbicacion}>
          {buscandoUbicacion ? 'Buscando ubicación...' : '📍 Usar mi ubicación actual'}
        </button>
        {latitud !== null && longitud !== null && (
          <p style={{ fontSize: 13, color: '#2a7a2a', marginTop: 6 }}>
            ✓ Ubicación lista ({latitud.toFixed(4)}, {longitud.toFixed(4)})
          </p>
        )}
      </div>

      {error && <p style={{ color: '#b00020', marginTop: 16 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button onClick={publicar} disabled={guardando}>
          {guardando ? 'Publicando...' : 'Publicar'}
        </button>
        <a href="/mapa" style={{ alignSelf: 'center' }}>
          Cancelar
        </a>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearClienteSupabase } from '@/lib/supabase'
import type { Lugar, Categoria, Evento, Publicacion } from '@/types/database'

type LugarConCategoria = Lugar & { categorias: Categoria | null }
type EventoConLugar = Evento & { lugares: LugarConCategoria | null }
type PublicacionConDatos = Publicacion & {
  lugares: Pick<Lugar, 'nombre'> | null
  autor: string
}

export default function PaginaFeed() {
  const [lugares, setLugares] = useState<LugarConCategoria[]>([])
  const [eventos, setEventos] = useState<EventoConLugar[]>([])
  const [publicaciones, setPublicaciones] = useState<PublicacionConDatos[]>([])
  const [tienePreferencias, setTienePreferencias] = useState(true)
  const [cargando, setCargando] = useState(true)
  const router = useRouter()
  const supabase = crearClienteSupabase()

  useEffect(() => {
    async function cargarFeed() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      // 1) Traemos las categorías que el usuario eligió en Preferencias
      const { data: preferencias } = await supabase
        .from('preferencias')
        .select('categoria_id')
        .eq('usuario_id', session.user.id)

      const categoriaIds = (preferencias ?? []).map((p) => p.categoria_id)
      const hayPreferencias = categoriaIds.length > 0
      setTienePreferencias(hayPreferencias)

      // 2) Lugares: si tiene preferencias, filtramos por esas categorías.
      //    Si no, mostramos algunos lugares generales para que no vea la app vacía.
      const consultaLugares = supabase.from('lugares').select('*, categorias(*)')
      const { data: lugaresData } = hayPreferencias
        ? await consultaLugares.in('categoria_id', categoriaIds).order('nombre')
        : await consultaLugares.order('nombre').limit(6)

      setLugares((lugaresData as LugarConCategoria[]) ?? [])

      // 3) Eventos próximos: traemos todos los que no han terminado,
      //    junto con su lugar y categoría, y filtramos en el navegador
      //    para quedarnos solo con los de las categorías preferidas.
      const { data: eventosData } = await supabase
        .from('eventos')
        .select('*, lugares(*, categorias(*))')
        .gte('fecha_fin', new Date().toISOString())
        .order('fecha_inicio')

      const eventosFiltrados = hayPreferencias
        ? ((eventosData as EventoConLugar[]) ?? []).filter((evento) =>
            categoriaIds.includes(evento.lugares?.categoria_id ?? '')
          )
        : ((eventosData as EventoConLugar[]) ?? [])

      setEventos(eventosFiltrados)

      // 4) Publicaciones recientes de otros usuarios.
      //    publicaciones no tiene relación directa con perfiles en la base de datos,
      //    así que primero traemos las publicaciones y luego, aparte, los nombres
      //    de quienes las escribieron, y los juntamos aquí.
      const { data: publicacionesData } = await supabase
        .from('publicaciones')
        .select('*, lugares(nombre)')
        .order('creado_en', { ascending: false })
        .limit(20)

      const idsAutores = [...new Set((publicacionesData ?? []).map((p) => p.usuario_id))]

      let nombresPorId: Record<string, string> = {}
      if (idsAutores.length > 0) {
        const { data: perfilesData } = await supabase
          .from('perfiles')
          .select('usuario_id, nombre')
          .in('usuario_id', idsAutores)

        nombresPorId = Object.fromEntries(
          (perfilesData ?? []).map((p) => [p.usuario_id, p.nombre])
        )
      }

      const publicacionesConAutor = (publicacionesData ?? []).map((p) => ({
        ...p,
        autor: nombresPorId[p.usuario_id] ?? 'Alguien',
      })) as PublicacionConDatos[]

      setPublicaciones(publicacionesConAutor)

      setCargando(false)
    }

    cargarFeed()
  }, [])

  if (cargando) return <p style={{ textAlign: 'center', marginTop: 80 }}>Cargando...</p>

  return (
    <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 16px' }}>
      <h1>Tu feed</h1>

      {!tienePreferencias && (
        <p style={{ background: '#fff3cd', padding: 12, borderRadius: 8 }}>
          Aún no elegiste tus categorías favoritas. Te mostramos algunos lugares generales
          mientras tanto. <a href="/preferencias">Elegir mis preferencias →</a>
        </p>
      )}

      <section style={{ marginTop: 32 }}>
        <h2>Lugares para ti</h2>
        {lugares.length === 0 && <p style={{ color: '#666' }}>No hay lugares para mostrar todavía.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {lugares.map((lugar) => (
            <div key={lugar.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0 }}>{lugar.nombre}</h3>
                <span style={{ fontSize: 12, color: '#666' }}>{lugar.categorias?.nombre}</span>
              </div>
              <p style={{ color: '#444', marginBottom: 0 }}>{lugar.descripcion}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Próximos eventos</h2>
        {eventos.length === 0 && (
          <p style={{ color: '#666' }}>No hay eventos próximos en tus categorías por ahora.</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {eventos.map((evento) => (
            <div key={evento.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <h3 style={{ margin: 0 }}>{evento.lugares?.nombre}</h3>
              <p style={{ margin: '4px 0', color: '#666', fontSize: 13 }}>
                {new Date(evento.fecha_inicio).toLocaleString('es-MX', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
              <p style={{ color: '#444', marginBottom: 0 }}>{evento.lugares?.descripcion}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Actividad reciente</h2>
        {publicaciones.length === 0 && (
          <p style={{ color: '#666' }}>
            Todavía no hay publicaciones. ¡Sé de los primeros en compartir algo! (Próximamente en el Módulo 6)
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {publicaciones.map((pub) => (
            <div key={pub.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{pub.autor}</strong>
                {pub.lugares?.nombre && (
                  <span style={{ fontSize: 12, color: '#666' }}>en {pub.lugares.nombre}</span>
                )}
              </div>
              <p style={{ color: '#444', marginBottom: 0 }}>{pub.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <a href="/perfil" style={{ display: 'inline-block', marginTop: 32 }}>
        ← Volver al perfil
      </a>
    </div>
  )
}

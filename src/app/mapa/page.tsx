'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import 'leaflet/dist/leaflet.css'
import { crearClienteSupabase } from '@/lib/supabase'
import type { Lugar, Publicacion, Categoria, PerfilPublico } from '@/types/database'

type PublicacionParaMapa = Publicacion & {
  categorias: Pick<Categoria, 'emoji' | 'nombre'> | null
  lugares: Pick<Lugar, 'nombre'> | null
}

export default function PaginaMapa() {
  const contenedorMapa = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<any>(null)
  const [cargando, setCargando] = useState(true)
  const router = useRouter()
  const supabase = crearClienteSupabase()

  useEffect(() => {
    async function iniciar() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const { data: lugares } = await supabase.from('lugares').select('*')

      // Publicaciones, cada una con su categoría (para el emoji) y su lugar (si tiene)
      const { data: publicacionesData } = await supabase
        .from('publicaciones')
        .select('*, categorias(emoji, nombre), lugares(nombre)')
        .not('latitud', 'is', null)
        .not('longitud', 'is', null)
        .order('creado_en', { ascending: false })

      const publicaciones = (publicacionesData as PublicacionParaMapa[]) ?? []

      // Traemos el nombre de quien publicó cada una, usando la vista pública
      // (solo expone nombre, nunca edad ni ciudad de otros usuarios).
      const idsAutores = [...new Set(publicaciones.map((p) => p.usuario_id))]
      let nombresPorId: Record<string, string> = {}
      if (idsAutores.length > 0) {
        const { data: perfilesData } = await supabase
          .from('perfiles_publicos')
          .select('usuario_id, nombre')
          .in('usuario_id', idsAutores)

        nombresPorId = Object.fromEntries(
          ((perfilesData as PerfilPublico[]) ?? []).map((p) => [p.usuario_id, p.nombre])
        )
      }

      if (!contenedorMapa.current || mapaRef.current) return

      // Leaflet usa "window", así que solo se puede cargar dentro del navegador,
      // nunca durante el renderizado en el servidor. Por eso se importa aquí adentro.
      const L = (await import('leaflet')).default

      // Arregla un problema común de Leaflet con los íconos de marcador en Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Centro por defecto: Ciudad de México
      mapaRef.current = L.map(contenedorMapa.current).setView([19.4326, -99.1332], 11)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapaRef.current)

      // Pines azules: los lugares del catálogo
      ;((lugares as Lugar[]) ?? []).forEach((lugar) => {
        L.marker([lugar.latitud, lugar.longitud])
          .addTo(mapaRef.current)
          .bindPopup(`<strong>${lugar.nombre}</strong><p style="margin:4px 0 0;">${lugar.descripcion ?? ''}</p>`)
      })

      // Pines con emoji: las publicaciones de los usuarios
      publicaciones.forEach((pub) => {
        if (pub.latitud === null || pub.longitud === null) return

        const emoji = pub.categorias?.emoji ?? '📍'
        const icono = L.divIcon({
          html: `<div style="font-size:28px; line-height:1; transform: translate(-50%, -50%);">${emoji}</div>`,
          className: '',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        })

        const autor = nombresPorId[pub.usuario_id] ?? 'Alguien'
        const dondeTexto = pub.lugares?.nombre ? ` en <strong>${pub.lugares.nombre}</strong>` : ''

        L.marker([pub.latitud, pub.longitud], { icon: icono })
          .addTo(mapaRef.current)
          .bindPopup(
            `<strong>${autor}</strong>${dondeTexto}<p style="margin:4px 0 0;">${pub.texto}</p>`
          )
      })

      setCargando(false)
    }

    iniciar()

    return () => {
      mapaRef.current?.remove()
      mapaRef.current = null
    }
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      {cargando && (
        <p style={{ textAlign: 'center', marginTop: 16, position: 'absolute', width: '100%', zIndex: 1000 }}>
          Cargando mapa...
        </p>
      )}
      
        href="/perfil"
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 1000,
          background: 'white',
          padding: '6px 12px',
          borderRadius: 6,
          textDecoration: 'none',
          color: 'black',
        }}
      >
        ← Perfil
      </a>
      
        href="/publicaciones/nueva"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 1000,
          background: 'black',
          color: 'white',
          padding: '6px 12px',
          borderRadius: 6,
          textDecoration: 'none',
        }}
      >
        + Publicar
      </a>
      <div ref={contenedorMapa} style={{ width: '100%', height: '100vh' }} />
    </div>
  )
}

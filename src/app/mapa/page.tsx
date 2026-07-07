'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import 'leaflet/dist/leaflet.css'
import { crearClienteSupabase } from '@/lib/supabase'
import type { Lugar } from '@/types/database'

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

      ;((lugares as Lugar[]) ?? []).forEach((lugar) => {
        L.marker([lugar.latitud, lugar.longitud])
          .addTo(mapaRef.current)
          .bindPopup(`<strong>${lugar.nombre}</strong><p style="margin:4px 0 0;">${lugar.descripcion ?? ''}</p>`)
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
      <a
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
      <div ref={contenedorMapa} style={{ width: '100%', height: '100vh' }} />
    </div>
  )
}

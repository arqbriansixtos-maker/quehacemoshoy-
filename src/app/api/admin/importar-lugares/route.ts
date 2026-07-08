import { NextRequest, NextResponse } from 'next/server'
import { crearClienteAdmin } from '@/lib/supabaseAdmin'

// Relaciona cada categoría de la app con el tipo de lugar equivalente en OpenStreetMap
const MAPEO_CATEGORIAS: Record<string, string> = {
  'Aire libre': 'leisure=park',
  Gastronomía: 'amenity=restaurant',
  'Arte y cultura': 'tourism=museum',
  'Vida nocturna': 'amenity=bar',
  Deporte: 'leisure=fitness_centre',
  'Música en vivo': 'amenity=nightclub',
  'Planes en familia': 'tourism=zoo',
  'Bienestar y relax': 'leisure=spa',
  Compras: 'shop=mall',
  'Cine y series': 'amenity=cinema',
}

// Caja delimitadora aproximada de Ciudad de México (sur, oeste, norte, este)
const BBOX_CDMX = '19.25,-99.30,19.52,-99.02'

export async function GET(request: NextRequest) {
  const secreto = request.nextUrl.searchParams.get('secreto')
  if (secreto !== process.env.ADMIN_IMPORT_SECRETO) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = crearClienteAdmin()
  const resumen: Record<string, number | string> = {}

  const { data: categorias } = await supabase.from('categorias').select('id, nombre')
  const { data: lugaresExistentes } = await supabase.from('lugares').select('nombre')
  const nombresExistentes = new Set((lugaresExistentes ?? []).map((l) => l.nombre.toLowerCase()))

  for (const categoria of categorias ?? []) {
    const filtroOsm = MAPEO_CATEGORIAS[categoria.nombre]
    if (!filtroOsm) continue

    const [clave, valor] = filtroOsm.split('=')
    const consultaOverpass = `
      [out:json][timeout:25];
      node["${clave}"="${valor}"](${BBOX_CDMX});
      out center 8;
    `

    try {
      const respuesta = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'User-Agent': 'QueHaremosHoyApp/1.0 (contacto: app-quehaceshoy@ejemplo.com)',
        },
        body: consultaOverpass,
      })

      if (!respuesta.ok) {
        const textoError = await respuesta.text()
        resumen[categoria.nombre] = `Error HTTP ${respuesta.status}: ${textoError.slice(0, 150)}`
        continue
      }

      const datos = await respuesta.json()
      let agregados = 0

      for (const elemento of datos.elements ?? []) {
        const nombre = elemento.tags?.name
        if (!nombre) continue // Ignora lugares sin nombre real en OpenStreetMap
        if (nombresExistentes.has(nombre.toLowerCase())) continue // Evita duplicados

        await supabase.from('lugares').insert({
          nombre,
          latitud: elemento.lat,
          longitud: elemento.lon,
          categoria_id: categoria.id,
          descripcion: `${categoria.nombre} verificado en OpenStreetMap.`,
          fuente: 'openstreetmap',
        })

        nombresExistentes.add(nombre.toLowerCase())
        agregados++
      }

      resumen[categoria.nombre] = agregados

      // Pausa breve entre categorías para no saturar el servicio gratuito
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error: any) {
      resumen[categoria.nombre] = `Excepción: ${error?.message ?? 'desconocida'}`
    }
  }

  return NextResponse.json({ mensaje: 'Importación completada', resumen })
}

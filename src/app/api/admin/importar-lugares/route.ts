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

// Intenta la consulta hasta 3 veces si el servidor está saturado (429/504),
// esperando cada vez un poco más antes de reintentar.
async function consultarOverpassConReintentos(consulta: string, intentos = 3): Promise<any> {
  for (let intento = 1; intento <= intentos; intento++) {
    const respuesta = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'QueHaremosHoyApp/1.0 (contacto: app-quehaceshoy@ejemplo.com)',
      },
      body: consulta,
    })

    if (respuesta.ok) return { ok: true, datos: await respuesta.json() }

    const saturado = respuesta.status === 429 || respuesta.status === 504
    if (saturado && intento < intentos) {
      await new Promise((resolve) => setTimeout(resolve, intento * 4000))
      continue
    }

    const textoError = await respuesta.text()
    return { ok: false, error: `Error HTTP ${respuesta.status}: ${textoError.slice(0, 150)}` }
  }
  return { ok: false, error: 'Sin respuesta tras varios intentos' }
}

export async function GET(request: NextRequest) {
  const secreto = request.nextUrl.searchParams.get('secreto')
  if (secreto !== process.env.ADMIN_IMPORT_SECRETO) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Si se indica ?categoria=Nombre, solo reprocesa esa categoría
  // (útil para reintentar solo lo que falló, sin repetir todo).
  const soloCategoria = request.nextUrl.searchParams.get('categoria')

  const supabase = crearClienteAdmin()
  const resumen: Record<string, number | string> = {}

  const { data: todasCategorias } = await supabase.from('categorias').select('id, nombre')
  const categorias = soloCategoria
    ? (todasCategorias ?? []).filter((c) => c.nombre === soloCategoria)
    : (todasCategorias ?? [])

  const { data: lugaresExistentes } = await supabase.from('lugares').select('nombre')
  const nombresExistentes = new Set((lugaresExistentes ?? []).map((l) => l.nombre.toLowerCase()))

  for (const categoria of categorias) {
    const filtroOsm = MAPEO_CATEGORIAS[categoria.nombre]
    if (!filtroOsm) continue

    const [clave, valor] = filtroOsm.split('=')
    const consultaOverpass = `
      [out:json][timeout:25];
      node["${clave}"="${valor}"](${BBOX_CDMX});
      out center 8;
    `

    const resultado = await consultarOverpassConReintentos(consultaOverpass)

    if (!resultado.ok) {
      resumen[categoria.nombre] = resultado.error
    } else {
      let agregados = 0
      for (const elemento of resultado.datos.elements ?? []) {
        const nombre = elemento.tags?.name
        if (!nombre) continue
        if (nombresExistentes.has(nombre.toLowerCase())) continue

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
    }

    // Pausa entre categorías para respetar el uso justo del servicio gratuito
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }

  return NextResponse.json({ mensaje: 'Importación completada', resumen })
}

import { NextRequest, NextResponse } from 'next/server'

// Esta ruta corre en el SERVIDOR, nunca en el navegador del usuario.
// Por eso es el único lugar donde es seguro usar la clave de la API de Claude.
export async function POST(request: NextRequest) {
  try {
    const { nombrePreferencias, lugares } = await request.json()

    if (!lugares || lugares.length === 0) {
      return NextResponse.json({ recomendaciones: [] })
    }

    const listaLugares = lugares
      .map((l: any) => `- id: ${l.id} | nombre: ${l.nombre} | categoría: ${l.categoria} | descripción: ${l.descripcion ?? ''}`)
      .join('\n')

    const prompt = `Eres un asistente que recomienda planes dentro de una app llamada "¿Qué Haremos Hoy?".

Preferencias del usuario: ${nombrePreferencias.length > 0 ? nombrePreferencias.join(', ') : 'ninguna indicada todavía'}

Lugares disponibles:
${listaLugares}

Elige los 3 mejores lugares para esta persona y explica en una frase corta y natural
por qué cada uno le puede gustar, conectándolo con sus preferencias cuando sea posible.

Responde ÚNICAMENTE con un JSON válido, sin texto adicional, con este formato exacto:
[{"id": "id-del-lugar", "razon": "frase corta explicando por qué"}]`

    const respuesta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!respuesta.ok) {
      console.error('Error de la API de Claude:', await respuesta.text())
      return NextResponse.json({ recomendaciones: [] })
    }

    const datos = await respuesta.json()
    const textoRespuesta = datos.content?.[0]?.text ?? '[]'

    // Limpia posibles ```json ... ``` que a veces el modelo agrega
    const textoLimpio = textoRespuesta.replace(/```json|```/g, '').trim()
    const recomendaciones = JSON.parse(textoLimpio)

    return NextResponse.json({ recomendaciones })
  } catch (error) {
    console.error('Error generando recomendaciones:', error)
    return NextResponse.json({ recomendaciones: [] })
  }
}

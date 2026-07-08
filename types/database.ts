// Estos tipos reflejan exactamente las tablas de la base de datos.
// Sirven para que, al escribir código, el editor avise si usamos
// un dato que no existe o con el tipo equivocado.

export interface Perfil {
  usuario_id: string
  nombre: string
  edad: number | null
  ciudad: string | null
}

// Versión pública y segura de un perfil: solo lo que cualquiera puede ver.
export interface PerfilPublico {
  usuario_id: string
  nombre: string
}

export interface Categoria {
  id: string
  nombre: string
  emoji: string | null
}

export interface Lugar {
  id: string
  nombre: string
  latitud: number
  longitud: number
  categoria_id: string
  descripcion: string | null
}

export interface Evento {
  id: string
  lugar_id: string
  fecha_inicio: string
  fecha_fin: string
}

export interface Publicacion {
  id: string
  usuario_id: string
  lugar_id: string | null
  categoria_id: string | null
  latitud: number | null
  longitud: number | null
  texto: string
  creado_en: string
}

export interface Favorito {
  usuario_id: string
  lugar_id: string
}

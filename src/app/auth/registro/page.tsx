'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearClienteSupabase } from '@/lib/supabase'

export default function PaginaRegistro() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const router = useRouter()
  const supabase = crearClienteSupabase()

  async function manejarRegistro(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCargando(true)

    // "options.data" guarda el nombre temporalmente para que
    // el robot automático (trigger) lo use al crear el perfil.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    })

    setCargando(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/perfil')
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto' }}>
      <h1>Crear cuenta</h1>
      <form onSubmit={manejarRegistro} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña (mínimo 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <button type="submit" disabled={cargando}>
          {cargando ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        ¿Ya tienes cuenta? <a href="/auth/login">Inicia sesión</a>
      </p>
    </div>
  )
}

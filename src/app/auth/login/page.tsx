'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { crearClienteSupabase } from '@/lib/supabase'

export default function PaginaLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const router = useRouter()
  const supabase = crearClienteSupabase()

  async function manejarLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCargando(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setCargando(false)

    if (error) {
      setError('Correo o contraseña incorrectos.')
      return
    }

    router.push('/perfil')
  }

  return (
    <div style={{ maxWidth: 360, margin: '80px auto' }}>
      <h1>Iniciar sesión</h1>
      <form onSubmit={manejarLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <button type="submit" disabled={cargando}>
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        ¿No tienes cuenta? <a href="/auth/registro">Regístrate</a>
      </p>
    </div>
  )
}

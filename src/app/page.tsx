export default function PaginaInicio() {
  return (
    <div style={{ maxWidth: 360, margin: '80px auto', textAlign: 'center' }}>
      <h1>¿Qué Haremos Hoy?</h1>
      <p>Descubre actividades según tus gustos y ubicación.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
        <a href="/auth/registro">Crear cuenta</a>
        <a href="/auth/login">Iniciar sesión</a>
      </div>
    </div>
  )
}

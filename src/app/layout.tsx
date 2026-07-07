export const metadata = {
  title: '¿Qué Haremos Hoy?',
  description: 'Descubre actividades según tus gustos y ubicación',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: 'sans-serif', margin: 0 }}>{children}</body>
    </html>
  )
}

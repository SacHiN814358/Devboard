import './globals.css'

export const metadata = {
  title: 'DevBoard — Developer Task Manager',
  description: 'Manage your projects and tasks like a pro',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  )
}

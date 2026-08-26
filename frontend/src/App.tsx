import { AuthProvider } from './auth/AuthProvider'
import { AppRouter } from './routes'

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}

export default App

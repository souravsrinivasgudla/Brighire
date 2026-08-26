import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  getCurrentUser,
  loginRequest,
  registerRequest,
} from '../api/auth'
import type { LoginPayload, RegisterPayload, User } from '../types/auth'
import { getErrorMessage } from '../utils/errors'
import { AuthContext, type AuthContextValue } from './auth-context'
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from './token'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => getAccessToken())
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    clearAccessToken()
    setToken(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const currentToken = getAccessToken()

    if (!currentToken) {
      setUser(null)
      setToken(null)
      return
    }

    const currentUser = await getCurrentUser()
    setToken(currentToken)
    setUser(currentUser)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const existingToken = getAccessToken()

      if (!existingToken) {
        if (!cancelled) {
          setIsLoading(false)
        }
        return
      }

      try {
        const currentUser = await getCurrentUser()
        if (!cancelled) {
          setToken(existingToken)
          setUser(currentUser)
        }
      } catch {
        clearAccessToken()
        if (!cancelled) {
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginRequest(payload)
    setAccessToken(response.access_token)
    setToken(response.access_token)

    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      clearAccessToken()
      setToken(null)
      setUser(null)
      throw new Error(getErrorMessage(error), { cause: error })
    }
  }, [])

  const register = useCallback(
    async (payload: RegisterPayload) => {
      await registerRequest(payload)
      await login({
        email: payload.email,
        password: payload.password,
      })
    },
    [login],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

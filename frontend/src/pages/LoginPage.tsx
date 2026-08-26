import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { AuthCard } from '../components/AuthCard'
import { PasswordField, TextField } from '../components/TextField'
import { Button, ErrorBanner } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/errors'

const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login(values)
      const redirectTo =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
        '/dashboard'
      void navigate(redirectTo, { replace: true })
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  })

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to access your career intelligence terminal."
      footer={
        <>
          Need an account?{' '}
          <Link to="/register" className="font-semibold text-cyber-accent hover:text-cyber-accent-tertiary">
            Register
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {formError ? <ErrorBanner message={formError} /> : null}
        <Button type="submit" variant="glitch" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
        <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-cyber-accent hover:text-cyber-accent-tertiary"
          >
            Forgot password?
          </Link>
        </div>
      </form>
    </AuthCard>
  )
}

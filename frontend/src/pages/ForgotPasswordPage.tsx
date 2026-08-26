import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { forgotPasswordRequest } from '../api/auth'
import { AuthCard } from '../components/AuthCard'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'
import { ErrorBanner, SuccessBanner } from '../components/ui'
import { getErrorMessage } from '../utils/errors'

const forgotSchema = z.object({
  email: z.email('Enter a valid email address.'),
})

type ForgotFormValues = z.infer<typeof forgotSchema>

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    setMessage(null)

    try {
      const response = await forgotPasswordRequest(values)

      if (response.reset_token) {
        void navigate(
          `/reset-password?token=${encodeURIComponent(response.reset_token)}`,
          { replace: true },
        )
        return
      }

      setMessage(response.message)
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  })

  return (
    <AuthCard
      title="Forgot password"
      description="Enter your account email and we will help you reset your password."
      footer={
        <>
          Remembered it?{' '}
          <Link
            to="/login"
            className="font-semibold text-blue-400 hover:text-blue-300"
          >
            Back to login
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
        {formError ? <ErrorBanner message={formError} /> : null}
        {message ? <SuccessBanner message={message} /> : null}
        <Button type="submit" variant="glitch" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Continue'}
        </Button>
      </form>
    </AuthCard>
  )
}

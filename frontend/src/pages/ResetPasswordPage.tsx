import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'

import { resetPasswordRequest } from '../api/auth'
import { AuthCard } from '../components/AuthCard'
import { Button } from '../components/Button'
import { PasswordField, TextField } from '../components/TextField'
import { ErrorBanner, SuccessBanner } from '../components/ui'
import { getErrorMessage } from '../utils/errors'

const resetSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required.'),
    new_password: z.string().min(8, 'Password must be at least 8 characters.'),
    confirm_password: z.string().min(8, 'Confirm your password.'),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: 'Passwords do not match.',
    path: ['confirm_password'],
  })

type ResetFormValues = z.infer<typeof resetSchema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialToken = useMemo(
    () => searchParams.get('token') ?? '',
    [searchParams],
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: initialToken,
      new_password: '',
      confirm_password: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    setNotice(null)

    try {
      await resetPasswordRequest({
        token: values.token,
        new_password: values.new_password,
      })
      setNotice('Password updated. You can log in now.')
      window.setTimeout(() => {
        void navigate('/login', { replace: true })
      }, 1200)
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  })

  return (
    <AuthCard
      title="Reset password"
      description="Choose a new password for your account."
      footer={
        <Link
          to="/login"
          className="font-semibold text-blue-400 hover:text-blue-300"
        >
          Back to login
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        {!initialToken ? (
          <TextField
            label="Reset token"
            error={errors.token?.message}
            {...register('token')}
          />
        ) : (
          <input type="hidden" {...register('token')} />
        )}
        <PasswordField
          label="New password"
          autoComplete="new-password"
          error={errors.new_password?.message}
          {...register('new_password')}
        />
        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          {...register('confirm_password')}
        />
        {formError ? <ErrorBanner message={formError} /> : null}
        {notice ? <SuccessBanner message={notice} /> : null}
        <Button type="submit" variant="glitch" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </AuthCard>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { updateCurrentUser } from '../api/auth'
import { TextField } from '../components/TextField'
import { Button } from '../components/ui/Button'
import {
  Avatar,
  ErrorBanner,
  InfoField,
  Panel,
  SectionTitle,
  StatusPill,
  SuccessBanner,
} from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/errors'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Enter your full name.'),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function ProfilePage() {
  const { user, refreshUser, logout } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name ?? '',
    },
  })

  useEffect(() => {
    reset({ full_name: user?.full_name ?? '' })
  }, [user?.full_name, reset])

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    setNotice(null)
    try {
      await updateCurrentUser({ full_name: values.full_name })
      await refreshUser()
      setNotice('Profile updated.')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  })

  const displayName = user?.full_name ?? 'User'

  return (
    <section className="space-y-6 text-cyber-fg">
      <div className="max-w-2xl space-y-2">
        <p className="cyber-label text-cyber-accent">Account</p>
        <h1 className="cyber-h3 text-2xl sm:text-3xl">Profile</h1>
        <p className="cyber-body-muted">
          Manage how your name appears across Brighire.
        </p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {notice ? <SuccessBanner message={notice} /> : null}

      <Panel className="overflow-hidden p-0 sm:p-0">
        <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:p-6">
          <Avatar name={displayName} size="lg" showStatus={!!user?.is_active} />
          <div className="min-w-0 space-y-3">
            <div className="space-y-1">
              <h2 className="truncate cyber-h3">{displayName}</h2>
              <p className="truncate cyber-body-muted">{user?.email}</p>
            </div>
            <StatusPill active={!!user?.is_active} />
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <SectionTitle>Account details</SectionTitle>
          <dl className="mt-5 space-y-5">
            <InfoField label="Full name" value={displayName} />
            <InfoField label="Email" value={user?.email ?? '—'} />
            <InfoField
              label="Status"
              value={user?.is_active ? 'Active' : 'Inactive'}
            />
          </dl>
        </Panel>

        <Panel>
          <SectionTitle>Edit profile</SectionTitle>
          <form className="mt-5 space-y-4" onSubmit={onSubmit}>
            <TextField
              label="Full name"
              error={errors.full_name?.message}
              {...register('full_name')}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="submit"
                variant="glitch"
                disabled={isSubmitting || !isDirty}
                loading={isSubmitting}
              >
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!isDirty || isSubmitting}
                onClick={() => reset({ full_name: user?.full_name ?? '' })}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Panel>
      </div>

      <Panel>
        <SectionTitle>Session</SectionTitle>
        <p className="mt-2 cyber-body-muted">
          Sign out of Brighire on this device.
        </p>
        <Button
          type="button"
          variant="danger"
          className="mt-5"
          onClick={logout}
        >
          Log out
        </Button>
      </Panel>
    </section>
  )
}

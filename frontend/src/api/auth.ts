import { apiClient } from './client'
import type {
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  TokenResponse,
  User,
  UserUpdatePayload,
} from '../types/api'

export async function loginRequest(
  payload: LoginPayload,
): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>('/auth/login', payload)
  return data
}

export async function registerRequest(
  payload: RegisterPayload,
): Promise<User> {
  const { data } = await apiClient.post<User>('/users', payload)
  return data
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>('/users/me')
  return data
}

export async function updateCurrentUser(
  payload: UserUpdatePayload,
): Promise<User> {
  const { data } = await apiClient.patch<User>('/users/me', payload)
  return data
}

export async function forgotPasswordRequest(
  payload: ForgotPasswordPayload,
): Promise<ForgotPasswordResponse> {
  const { data } = await apiClient.post<ForgotPasswordResponse>(
    '/auth/forgot-password',
    payload,
  )
  return data
}

export async function resetPasswordRequest(
  payload: ResetPasswordPayload,
): Promise<void> {
  await apiClient.post('/auth/reset-password', payload)
}

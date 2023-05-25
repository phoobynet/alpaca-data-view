export interface Env {
  key: string
  secret: string
}

export const getEnv = (): Env => {
  return {
    secret: import.meta.env.VITE_APP_APCA_API_SECRET_KEY,
    key: import.meta.env.VITE_APP_APCA_API_KEY_ID,
  }
}

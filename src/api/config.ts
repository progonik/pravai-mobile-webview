/** API configuration. The backend is live -- no mock mode. */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || 'https://pravai-api.ai-bek.com'

// Where the full-stack suite finds the running stack. Nothing here starts it.
const apiPort = process.env.API_PORT ?? '8000'

/** Origin of the API (nginx in docker compose). `E2E_API_URL` wins over `API_PORT`. */
export const API_URL = (process.env.E2E_API_URL ?? `http://localhost:${apiPort}`).replace(/\/$/, '')

/** Origin of the SPA (the Vite container). */
export const WEB_URL = (process.env.E2E_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '')

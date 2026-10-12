import { API_URL, WEB_URL } from './env'

async function reachable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
    return response.ok
  } catch {
    return false
  }
}

// Fail fast, with the fix in the message, instead of timing out in the first test.
export default async function globalSetup(): Promise<void> {
  const missing: string[] = []
  if (!(await reachable(`${API_URL}/health`))) missing.push(`API   ${API_URL}/health`)
  if (!(await reachable(WEB_URL))) missing.push(`SPA   ${WEB_URL}`)
  if (missing.length === 0) return
  throw new Error(
    [
      'The full-stack suite needs the running stack and does not start it.',
      'Unreachable:',
      ...missing.map((line) => `  - ${line}`),
      'Start it from the superproject root with `./start.sh` or `docker compose up -d --wait`,',
      'run the migrations (`docker compose exec -T -u www-data php php artisan migrate --force`),',
      'and set E2E_API_URL / E2E_BASE_URL (or API_PORT) when the ports differ from 8000 and 5173.',
    ].join('\n'),
  )
}

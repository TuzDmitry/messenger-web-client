import { z } from 'zod'
import { t } from '@/i18n'

export const DEFAULT_API_URL = 'https://api.green-api.com'

export const credentialsSchema = z.object({
  idInstance: z
    .string()
    .trim()
    .min(1, t.auth.errors.required)
    .regex(/^\d+$/, t.auth.errors.idInstance),
  apiTokenInstance: z.string().trim().min(1, t.auth.errors.required),
  // Optional: an empty field means the default host
  apiUrl: z
    .string()
    .trim()
    .transform((url) => url || DEFAULT_API_URL)
    .pipe(z.url({ protocol: /^https?$/, error: t.auth.errors.apiUrl }))
    .transform((url) => url.replace(/\/+$/, '')),
})

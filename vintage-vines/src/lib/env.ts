import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  // Server-only. Never prefix with NEXT_PUBLIC_ — it bypasses RLS.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  // Optional: the matchmaker and Help My Plant run in deterministic-only
  // mode (a required, working fallback, not a broken state) whenever
  // this is unset.
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-haiku-4-5-20251001"),
  // Cents. Section 6 requires a hard monthly AI spend cap but never
  // states the number — this default is a conservative starting point,
  // not a business decision; adjust freely via env var.
  AI_MONTHLY_SPEND_CAP_CENTS: z.coerce.number().int().positive().default(2000),
  // Protects the cron-triggered hold-expiry sweep from being called by
  // anyone who finds the URL. Vercel sends this as a Bearer token
  // automatically for scheduled invocations when this var is set.
  CRON_SECRET: z.string().min(1).optional(),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
  AI_MONTHLY_SPEND_CAP_CENTS: process.env.AI_MONTHLY_SPEND_CAP_CENTS,
  CRON_SECRET: process.env.CRON_SECRET,
});

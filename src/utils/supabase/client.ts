import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ||
  "https://wgktclizjfkdlzgnmlra.supabase.co";

const supabaseKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_YuTUlqqrSE1R3Hb1sXmtwQ_2T56c1Q5";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );

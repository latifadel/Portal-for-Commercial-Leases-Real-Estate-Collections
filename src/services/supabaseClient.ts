import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Tenant, Office, Contract, PaymentInstallment, SystemSettings, SystemNotification, ActivityLog } from '../types';

const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ||
  'https://wgktclizjfkdlzgnmlra.supabase.co';

const supabaseKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_YuTUlqqrSE1R3Hb1sXmtwQ_2T56c1Q5';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});

export interface SupabasePropertyData {
  tenants: Tenant[];
  offices: Office[];
  contracts: Contract[];
  payments: PaymentInstallment[];
  settings?: SystemSettings;
  activityLogs?: ActivityLog[];
  notifications?: SystemNotification[];
  updatedAt: string;
  updatedBy?: string;
}

export const getRecordKey = (userId?: string) => (userId ? `user_property_${userId}` : 'commercial_building_main');

/**
 * Load property data from Supabase cloud database for a specific user
 * If user does not have private records yet, automatically load and seed from commercial_building_main
 */
export const loadPropertyDataFromSupabase = async (userId?: string): Promise<SupabasePropertyData | null> => {
  try {
    const recordKey = getRecordKey(userId);
    
    // 1. Try to fetch user's specific record
    const { data, error } = await supabase
      .from('property_records')
      .select('payload, updated_at')
      .eq('record_key', recordKey)
      .maybeSingle();

    if (error) {
      console.warn('[Supabase] Fetch error:', error.message);
    }

    // If user already has existing populated data in their private record, return it
    if (data && data.payload) {
      const p = data.payload as SupabasePropertyData;
      if ((Array.isArray(p.offices) && p.offices.length > 0) || (Array.isArray(p.tenants) && p.tenants.length > 0)) {
        return p;
      }
    }

    // 2. If private record is empty or new, load the master building data (Alabdullatif Tower)
    const { data: mainData } = await supabase
      .from('property_records')
      .select('payload, updated_at')
      .eq('record_key', 'commercial_building_main')
      .maybeSingle();

    if (mainData && mainData.payload) {
      const masterPayload = mainData.payload as SupabasePropertyData;
      // Seed this user's private store so they start with all the offices, showrooms, and contracts
      if (userId) {
        await savePropertyDataToSupabase(masterPayload, userId);
      }
      return masterPayload;
    }

    if (data && data.payload) {
      return data.payload as SupabasePropertyData;
    }

    return null;
  } catch (err) {
    console.error('[Supabase] Exception loading property data:', err);
    return null;
  }
};

/**
 * Save property data to Supabase cloud database with upsert for a specific user
 */
export const savePropertyDataToSupabase = async (
  payload: SupabasePropertyData,
  userId?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const recordKey = getRecordKey(userId);
    const { error } = await supabase.from('property_records').upsert(
      {
        record_key: recordKey,
        payload: payload,
        user_id: userId || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'record_key' }
    );

    if (error) {
      console.error('[Supabase] Save error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Supabase] Exception saving property data:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
};

/**
 * Subscribe to realtime changes for a specific user so iPhone & PC stay in sync automatically
 */
export const subscribeToRealtimePropertyData = (
  userId: string | undefined,
  onUpdate: (data: SupabasePropertyData) => void
) => {
  const recordKey = getRecordKey(userId);
  const channel = supabase
    .channel(`property_records_${recordKey}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'property_records',
        filter: `record_key=eq.${recordKey}`,
      },
      payload => {
        if (payload.new && (payload.new as any).payload) {
          onUpdate((payload.new as any).payload as SupabasePropertyData);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const SUPABASE_SETUP_SQL = `-- Run this in your Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.property_records (
  record_key TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.property_records ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view property records
CREATE POLICY "Allow authenticated read" ON public.property_records
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update property records
CREATE POLICY "Allow authenticated write" ON public.property_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
`;

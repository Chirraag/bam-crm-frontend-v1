import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://duxtqqxdctaoleelhrob.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHRxcXhkY3Rhb2xlZWxocm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzI2NTcsImV4cCI6MjA2NDM0ODY1N30.ufDSFHXorU71TZf_RLOiXWVBwgdgt_AAUoAWm_9IKbE";

// Create Supabase client with realtime enabled
export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// At the bottom of the file, add:
if (typeof window !== "undefined") {
  (window as any).supabase = supabase;
}

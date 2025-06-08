import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://duxtqqxdctaoleelhrob.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHRxcXhkY3Rhb2xlZWxocm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzI2NTcsImV4cCI6MjA2NDM0ODY1N30.ufDSFHXorU71TZf_RLOiXWVBwgdgt_AAUoAWm_9IKbE';

// Create Supabase client for direct database queries only
export const supabase = createClient(supabaseUrl, supabaseKey);
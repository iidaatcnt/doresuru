import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ledhszomptewlvrtsfrt.supabase.co';
const supabaseAnonKey = 'sb_publishable_ixBcXxg3BOkz9urE04FEuQ_vcaEi2kY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

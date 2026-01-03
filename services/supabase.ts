
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nwonsgkxntgcrsimwzjz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xiWuhytW1hjvPd-zFvxXgw_ewClvCHK';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabase = createClient(
  "https://YOUR_PROJECT.supabase.co",
  "YOUR_PUBLIC_ANON_KEY"
);

export default supabase;

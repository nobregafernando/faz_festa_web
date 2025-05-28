/*  UM ÚNICO CLIENT PARA O SITE TODO  */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://zrfgitzipulplvxihpik.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyZmdpdHppcHVscGx2eGlocGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTcwMjQsImV4cCI6MjA2MjU3MzAyNH0.wOvc9NwaXJqfT_8OpId2NZey42Rb3a4129-FeKE9COA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;

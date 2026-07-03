// Chave "anon" é pública por design (protegida por Row Level Security no Supabase).
// Nunca coloque a senha do banco (connection string) em código client-side.
const SUPABASE_URL = "https://byipcmwyamwblxupbzcd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_FVOVDRL2gNHuSKBtd2ONkA_3Bv4QdO9";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

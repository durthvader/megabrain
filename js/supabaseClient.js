// Chave "anon" é pública por design (protegida por Row Level Security no Supabase).
// Nunca coloque a senha do banco (connection string) em código client-side.
const SUPABASE_URL = "https://byipcmwyamwblxupbzcd.supabase.co";
const SUPABASE_ANON_KEY = ""; // TODO: cole aqui a anon/public key (Project Settings > API)

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// MEGABRAIN — supabaseClient.js
// Ponto único de conexão com o Supabase. Todos os services
// importam `supabase` daqui.
// ============================================================

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export function configuracaoPreenchida() {
  return (
    typeof SUPABASE_URL === "string" &&
    SUPABASE_URL.startsWith("https://") &&
    typeof SUPABASE_ANON_KEY === "string" &&
    !SUPABASE_ANON_KEY.includes("COLE_AQUI")
  );
}

if (!configuracaoPreenchida()) {
  throw new Error(
    "Supabase não configurado. Preencha assets/js/config.js com a URL e a anon key do seu projeto (veja config.example.js)."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

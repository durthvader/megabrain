// ============================================================
// MEGABRAIN — main.js
// Inicialização compartilhada. Importado por todas as páginas.
// ============================================================

import { exigirAmbienteLocal } from "./localOnly.js";
import { initNavigation } from "./navigation.js";

exigirAmbienteLocal();
initNavigation();

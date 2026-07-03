// ============================================================
// MEGABRAIN — utils/mensagens.js
// Toasts simples de feedback (sucesso, erro, aviso).
// ============================================================

function obterContainer() {
  let container = document.getElementById("toasts");
  if (!container) {
    container = document.createElement("div");
    container.id = "toasts";
    container.className = "toasts";
    document.body.appendChild(container);
  }
  return container;
}

function mostrar(texto, tipo, duracaoMs = 4500) {
  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  toast.textContent = texto;
  obterContainer().appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("visivel"));
  setTimeout(() => {
    toast.classList.remove("visivel");
    setTimeout(() => toast.remove(), 300);
  }, duracaoMs);
}

export function mostrarSucesso(texto) {
  mostrar(texto, "sucesso");
}

export function mostrarErro(texto) {
  console.error("[Megabrain]", texto);
  mostrar(texto, "erro", 7000);
}

export function mostrarAviso(texto) {
  mostrar(texto, "aviso");
}

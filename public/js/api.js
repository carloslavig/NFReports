// ============================================================
// Helper central de chamadas à API
// ============================================================
const API_BASE = '/api';

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw await res.json().catch(() => ({ erro: 'Erro na requisição' }));
  return res.json();
}

async function apiSend(path, method, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json().catch(() => ({ erro: 'Erro na requisição' }));
  return res.json();
}

const api = {
  get: apiGet,
  post: (path, body) => apiSend(path, 'POST', body),
  put: (path, body) => apiSend(path, 'PUT', body),
  delete: (path) => apiSend(path, 'DELETE'),
};

const ROTULOS_TIPO = {
  instalacao: 'Instalação',
  manutencao: 'Manutenção',
  retencao: 'Retenção',
  retirada: 'Retirada de Equip.',
  posvenda: 'Pós-venda',
};

function formatarDataBr(dataIso) {
  if (!dataIso) return '-';
  const d = new Date(dataIso);
  return d.toLocaleDateString('pt-BR');
}

function mostrarToast(mensagem, tipo = 'ok') {
  let toastEl = document.getElementById('toast');
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'toast';
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = mensagem;
  toastEl.className = `toast show ${tipo === 'erro' ? 'error' : ''}`;
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => toastEl.classList.remove('show'), 3200);
}

function atualizarRelogio() {
  const el = document.getElementById('clock');
  if (!el) return;
  const agora = new Date();
  el.textContent = agora.toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
}
setInterval(atualizarRelogio, 30000);
document.addEventListener('DOMContentLoaded', atualizarRelogio);

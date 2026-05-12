// InovaMold ERP - Dashboard Logic v3.0
const SUPABASE_URL = 'https://aueswagvyexetfxduuxh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_83pMDh35idUGKvI289pyhg_M7V-JPpm';

// ── THEME SWITCHER ──────────────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') !== 'light';
  const next = isDark ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('inovamold-theme', next);
  document.getElementById('theme-icon').textContent = next === 'dark' ? '☀' : '🌙';
  document.getElementById('theme-label').textContent = next === 'dark' ? 'DESIGN 1' : 'DESIGN 2';
}

// Apply saved theme immediately
(function() {
  const saved = localStorage.getItem('inovamold-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  // Labels update after DOM loads
  document.addEventListener('DOMContentLoaded', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    document.getElementById('theme-icon').textContent = theme === 'dark' ? '☀' : '🌙';
    document.getElementById('theme-label').textContent = theme === 'dark' ? 'DESIGN 1' : 'DESIGN 2';
  });
})();

const ETAPAS = [
  { label: 'Comercial',      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>` },
  { label: 'PCP',            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>` },
  { label: 'Início Produção',icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>` },
  { label: 'Fim Produção',   icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` },
  { label: 'Estoque',        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>` },
  { label: 'Separação',      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>` },
  { label: 'Faturado',       icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5z"/><polyline points="6 9 6.01 9"/></svg>` },
  { label: 'Enviado',        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.9 12.62a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.8 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>` },
];

const STATUS_DOT = { green: '#22c55e', yellow: '#f59e0b', red: '#ef4444' };

let db = null;
let allOrders = [];
let currentOrder = null;
let activeTab = 'details';

// --- Utils ---
function fmt(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0); }
function fmtDate(d) { if (!d) return '—'; return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR'); }
function daysIn(dateStr) { if (!dateStr) return 0; return Math.max(0, Math.floor((Date.now() - new Date(dateStr)) / 86400000)); }

function showToast(msg, ok = true) {
  Toastify({
    text: msg,
    duration: 3000,
    gravity: 'top',
    position: 'right',
    backgroundColor: ok ? '#d4af37' : '#ef4444',
    style: { color: ok ? '#0a0a0a' : '#fff', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }
  }).showToast();
}

// --- Supabase Init ---
async function init() {
  try {
    db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    await load();
    document.getElementById('connection-badge').textContent = '● ONLINE';
    document.getElementById('connection-badge').className = 'badge badge-ok';
  } catch (err) {
    console.error(err);
    document.getElementById('connection-badge').textContent = '● OFFLINE';
  }
}

// --- Load & Render Orders ---
async function load() {
  try {
    const { data, error } = await db.from('pedidos').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    allOrders = data || [];
    renderSidebar(allOrders);
    updateStats();
    if (allOrders.length > 0 && !currentOrder) selectOrder(allOrders[0]);
    else if (currentOrder) {
      const refreshed = allOrders.find(o => o.id === currentOrder.id);
      if (refreshed) selectOrder(refreshed);
    }
  } catch (err) {
    console.error('Load error:', err);
    document.getElementById('empty-state').textContent = 'Erro ao carregar dados.';
  }
}

function renderSidebar(orders) {
  const list = document.getElementById('order-list');
  if (orders.length === 0) {
    list.innerHTML = '<div style="padding:32px 16px; color:#444; font-size:12px; text-align:center;">Nenhum pedido encontrado</div>';
    return;
  }
  list.innerHTML = orders.map(o => {
    const isSelected = currentOrder && currentOrder.id === o.id;
    const isDelayed = o.prazo && new Date(o.prazo) < new Date();
    return `
      <div class="order-row ${isSelected ? 'selected' : ''}" onclick="selectOrder(${JSON.stringify(o).replace(/"/g, '&quot;')})"
           style="padding:12px 16px; border-bottom:1px solid #161616;">
        <div style="font-size:12px; color:#d4af37; margin-bottom:3px; font-weight:500;">${o.numero_pedido}</div>
        <div style="font-size:11px; color:#888; margin-bottom:6px; font-family:'IBM Plex Sans',sans-serif;">${o.cliente}</div>
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <span class="badge badge-gold">Etapa ${o.etapa_atual_index}/8</span>
          <span style="font-size:10px; color:${isDelayed ? '#ef4444' : '#444'};">${fmtDate(o.prazo)}</span>
        </div>
      </div>`;
  }).join('');
}

function updateStats() {
  document.getElementById('stat-total').textContent = allOrders.length;
  document.getElementById('stat-faturado').textContent = allOrders.filter(o => o.etapa_atual_index === 7).length;
  document.getElementById('stat-atrasado').textContent = allOrders.filter(o => o.prazo && new Date(o.prazo) < new Date()).length;
}

function filterOrders(term) {
  const filtered = term.length < 2 ? allOrders : allOrders.filter(o =>
    (o.numero_pedido || '').toLowerCase().includes(term.toLowerCase()) ||
    (o.cliente || '').toLowerCase().includes(term.toLowerCase()) ||
    (o.lote || '').toLowerCase().includes(term.toLowerCase())
  );
  renderSidebar(filtered);
}

// --- Select & Display Order ---
function selectOrder(o) {
  window._currentSelectedOrder = o; // cache for cycleInsumoStatus
  if (typeof o === 'string') o = JSON.parse(o);
  currentOrder = o;

  // Re-render sidebar to highlight selection
  const searchTerm = document.getElementById('search-input').value;
  renderSidebar(allOrders.filter(ord => {
    return !searchTerm || searchTerm.length < 2 ||
      (ord.numero_pedido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ord.lote || '').toLowerCase().includes(searchTerm.toLowerCase());
  }));

  const activeStep = parseInt(o.etapa_atual_index) || 1;
  const dias = daysIn(o.data_entrada_etapa);
  const isDelayed = o.prazo && new Date(o.prazo) < new Date();

  document.getElementById('empty-content').style.display = 'none';
  document.getElementById('order-detail').style.display = 'block';

  // Header
  document.getElementById('detail-numero').textContent = o.numero_pedido;
  document.getElementById('detail-sub').textContent = `${o.cliente} · Lote: ${o.lote || '—'}`;

  // KPIs
  document.getElementById('kpi-valor').textContent = fmt(o.valor);
  const prazoEl = document.getElementById('kpi-prazo');
  prazoEl.textContent = fmtDate(o.prazo);
  prazoEl.style.color = isDelayed ? '#ef4444' : '#e8e4dc';
  document.getElementById('kpi-etapa').textContent = ETAPAS[activeStep - 1]?.label || '—';
  const diasEl = document.getElementById('kpi-dias');
  diasEl.textContent = `${dias}d`;
  diasEl.style.color = dias > 3 ? '#f59e0b' : '#e8e4dc';

  // Timeline
  const progress = ((activeStep - 1) / 7) * 100;
  document.getElementById('timeline-progress').style.width = `${progress}%`;
  const stepsEl = document.getElementById('steps-container');
  stepsEl.innerHTML = ETAPAS.map((et, i) => {
    const idx = i + 1;
    const isDone = idx < activeStep;
    const isActive = idx === activeStep;
    const cls = isDone ? 'done' : (isActive ? 'active' : '');
    const doneCheckSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    return `
      <div style="display:flex; flex-direction:column; align-items:center; gap:8px; flex:1; position:relative;">
        <div class="step-dot ${cls}">${isDone ? doneCheckSvg : et.icon}</div>
        <div style="font-size:9px; color:${isActive ? 'var(--accent)' : isDone ? 'var(--text-muted)' : 'var(--step-inactive)'}; text-align:center; letter-spacing:0.5px; line-height:1.4; font-weight:${isActive ? '600' : '400'};">
          ${et.label.toUpperCase()}
        </div>
      </div>`;
  }).join('');

  // Delay alert
  document.getElementById('delay-alert').style.display = dias > 2 ? 'block' : 'none';
  document.getElementById('delay-days').textContent = dias;

  // Detail tab fields
  document.getElementById('d-numero').textContent = o.numero_pedido;
  document.getElementById('d-lote').textContent = o.lote || '—';
  document.getElementById('d-cliente').textContent = o.cliente;
  document.getElementById('d-valor').textContent = fmt(o.valor);
  document.getElementById('d-prazo').textContent = fmtDate(o.prazo);
  const statusEl = document.getElementById('d-status');
  statusEl.textContent = isDelayed ? 'ATRASADO' : 'NO PRAZO';
  statusEl.style.color = isDelayed ? '#ef4444' : '#4ade80';
  document.getElementById('d-etapa').textContent = `${activeStep} — ${ETAPAS[activeStep - 1]?.label}`;
  document.getElementById('d-created').textContent = fmtDate(o.created_at);

  // Logistics tab
  document.getElementById('l-transp').textContent = o.transportadora || '—';
  document.getElementById('l-rastreio').textContent = o.codigo_rastreio || '—';
  renderReadyList();

  // Load insumos (tab + bottom grid)
  loadInsumos(o.id);

  // ERP table
  renderErpTable();

  // Bottom grid: chart + logistics + risk
  updateBottomChart(dias, ETAPAS[activeStep - 1]?.label || '—');
  updateBottomLogistics(o);
  updateBottomRisk();

  // Switch to current tab
  switchTab(activeTab);
}

async function loadInsumos(pedidoId) {
  const listEl = document.getElementById('insumos-list');
  listEl.innerHTML = '<div style="padding:24px; color:#444; font-size:12px; text-align:center;">Carregando...</div>';

  try {
    const { data } = await db.from('insumos').select('*').eq('pedido_id', pedidoId);
    const items = (data && data.length > 0) ? data : [
      { nome_insumo: 'Polímero PVC-S', status: 'green', detalhes: 'Lote Verificado' },
      { nome_insumo: 'Aditivo Estabilizante', status: 'yellow', detalhes: 'Reposição em 1 dia' },
      { nome_insumo: 'Pigmento Preto', status: 'green', detalhes: 'Estoque OK' },
    ];

    const hasCritical = items.some(i => i.status === 'red');
    document.getElementById('insumos-alert').style.display = hasCritical ? 'block' : 'none';

    const rowHtml = items.map(ins => {
      const badgeClass = ins.status === 'green' ? 'badge-ok' : ins.status === 'yellow' ? 'badge-warn' : 'badge-err';
      const label = { green: 'OK', yellow: 'ATENÇÃO', red: 'CRÍTICO' }[ins.status] || ins.status;
      const dot = `<div style="width:10px;height:10px;border-radius:50%;background:${STATUS_DOT[ins.status]||'#888'};flex-shrink:0;"></div>`;
      return `<div class="insumo-row">${dot}
        <div style="flex:1;"><div style="font-size:13px;color:var(--text);font-family:'IBM Plex Sans',sans-serif;">${ins.nome_insumo}</div>
        ${ins.detalhes ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${ins.detalhes}</div>` : ''}</div>
        <span class="badge ${badgeClass}">${label}</span></div>`;
    }).join('');

    listEl.innerHTML = rowHtml;

    // Also update bottom grid semáforo (clickable status cycling)
    const d2list = document.getElementById('insumos-list-d2');
    const d2alert = document.getElementById('insumos-alert-d2');
    if (d2list) {
      window._d2Insumos = items; // cache for cycling
      d2list.innerHTML = items.map((ins, idx) => {
        const col = { green: '#4ade80', yellow: '#f59e0b', red: '#ef4444' }[ins.status] || '#888';
        const lbl = { green: 'OK', yellow: 'ATENÇÃO', red: 'CRÍTICO' }[ins.status] || ins.status;
        return `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="cycleInsumoStatus(${idx})" title="Clique para alterar status">
          <div style="width:10px;height:10px;border-radius:50%;background:${col};flex-shrink:0;transition:transform 0.15s;" onmouseover="this.style.transform='scale(1.5)'" onmouseout="this.style.transform='scale(1)'"></div>
          <div style="flex:1;">
            <div style="font-size:12px;color:var(--text);font-family:'IBM Plex Sans',sans-serif;">${ins.nome_insumo}</div>
            <div style="font-size:10px;color:var(--text-muted);">${ins.detalhes || ''}</div>
          </div>
          <span style="font-size:10px;padding:2px 8px;border-radius:99px;background:${col}22;color:${col};border:1px solid ${col}44;font-weight:600;">${lbl}</span>
        </div>`;
      }).join('');
    }
    if (d2alert) d2alert.style.display = hasCritical ? 'block' : 'none';
  } catch {
    listEl.innerHTML = '<div style="padding:24px; color:#444; font-size:12px; text-align:center;">Erro ao carregar insumos</div>';
  }
}

async function cycleInsumoStatus(idx) {
  const items = window._d2Insumos;
  if (!items || !items[idx]) return;
  const cycle = { green: 'yellow', yellow: 'red', red: 'green' };
  const label = { green: 'OK', yellow: 'ATENÇÃO', red: 'CRÍTICO' };
  const item = items[idx];
  const next = cycle[item.status] || 'green';
  items[idx] = { ...item, status: next };
  window._d2Insumos = items;
  // Re-call loadInsumos render path
  const currentOrder = window._currentSelectedOrder;
  if (currentOrder) loadInsumos(currentOrder.id);
  // Persist to DB if real item
  if (item.id) {
    await db.from('insumos').update({ status: next }).eq('id', item.id);
  }
  showToast(`${item.nome_insumo}: ${label[next]}`, 'ok');
}

// ── BOTTOM GRID FUNCTIONS ────────────────────────────────────
function updateBottomChart(dias, etapaLabel) {
  const labelEl = document.getElementById('d2-etapa-label');
  const timeEl = document.getElementById('d2-etapa-time');
  const alertEl = document.getElementById('d2-chart-alert');
  const daysEl = document.getElementById('d2-delay-days');
  if (labelEl) labelEl.textContent = etapaLabel;
  if (timeEl) timeEl.textContent = `${dias} dias`;
  if (alertEl) alertEl.style.display = dias > 2 ? 'block' : 'none';
  if (daysEl) daysEl.textContent = dias;

  const ctx = document.getElementById('d2-stageChart')?.getContext('2d');
  if (!ctx) return;
  if (window._d2Chart) window._d2Chart.destroy();
  window._d2Chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Média InovaMold', 'Este Pedido'],
      datasets: [{
        data: [1.5, dias],
        backgroundColor: ['#2a2a2a', dias > 2 ? '#ef4444' : '#d4af37'],
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y', responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false, min: 0, grid: { color: '#1e1e1e' } },
        y: { grid: { display: false }, ticks: { color: '#555', font: { size: 10 } } }
      }
    }
  });
}

function updateBottomLogistics(o) {
  const trackInfo = document.getElementById('d2-tracking-info');
  const company = document.getElementById('d2-tracking-company');
  const code = document.getElementById('d2-tracking-code');
  const readyCount = document.getElementById('d2-ready-count');
  const readyList = document.getElementById('d2-ready-orders-list');

  if (trackInfo && o.transportadora) {
    trackInfo.style.display = 'block';
    if (company) company.textContent = o.transportadora;
    if (code) code.textContent = o.codigo_rastreio || 'Pendente';
  } else if (trackInfo) {
    trackInfo.style.display = 'none';
  }

  const ready = allOrders.filter(x => x.etapa_atual_index === 7);
  if (readyCount) readyCount.textContent = ready.length;
  if (readyList) {
    readyList.innerHTML = ready.length === 0
      ? `<div style="font-size:12px;color:var(--text-muted);padding:8px 0;">Nenhum pedido aguardando</div>`
      : ready.map(x => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--bg-base);border-radius:6px;margin-bottom:6px;cursor:pointer;" onclick="selectOrderById('${x.numero_pedido}')">
          <div>
            <div style="font-size:12px;color:var(--accent);font-weight:500;">${x.numero_pedido}</div>
            <div style="font-size:11px;color:var(--text-muted);">${x.cliente}</div>
          </div>
          <span class="badge badge-warn">FATURADO</span>
        </div>`).join('');
  }
}

function updateBottomRisk() {
  const summary = document.getElementById('d2-risk-summary');
  const tbody = document.getElementById('d2-risk-table-body');
  if (!summary || !tbody) return;

  const delayed = allOrders.filter(o => {
    const days = o.data_entrada_etapa ? Math.floor((Date.now() - new Date(o.data_entrada_etapa)) / 86400000) : 0;
    return days > 2 && o.etapa_atual_index < 8;
  });

  if (delayed.length === 0) {
    summary.textContent = 'Cadeia de suprimentos estável. Nenhum gargalo crítico.';
    summary.style.background = 'var(--accent-bg)';
    summary.style.color = 'var(--accent)';
    tbody.innerHTML = '';
  } else {
    summary.textContent = `${delayed.length} pedido(s) retido(s) por mais de 2 dias na mesma etapa.`;
    summary.style.background = '#1a1000';
    summary.style.color = '#f59e0b';
    tbody.innerHTML = delayed.slice(0, 5).map(o => `
      <tr style="border-bottom:1px solid var(--border);">
        <td style="padding:8px;color:var(--accent);font-size:11px;">${o.numero_pedido}</td>
        <td style="padding:8px;color:var(--text-dim);font-size:11px;">${ETAPAS[o.etapa_atual_index - 1]?.label || '—'}</td>
        <td style="padding:8px;font-size:11px;"><span style="color:#ef4444;">Alto</span></td>
      </tr>`).join('');
  }
}

function renderReadyList() {
  const ready = allOrders.filter(o => o.etapa_atual_index === 7);
  const el = document.getElementById('ready-list');
  if (ready.length === 0) {
    el.innerHTML = '<div style="padding:16px; color:#444; font-size:12px; text-align:center; background:#111; border-radius:8px; border:1px solid #1e1e1e;">Nenhum pedido aguardando expedição</div>';
    return;
  }
  el.innerHTML = ready.map(o => `
    <div class="card" style="padding:12px 16px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="selectOrder(${JSON.stringify(o).replace(/"/g, '&quot;')})">
      <div>
        <div style="font-size:12px; color:#d4af37; font-weight:500;">${o.numero_pedido}</div>
        <div style="font-size:11px; color:#666; margin-top:2px; font-family:'IBM Plex Sans',sans-serif;">${o.cliente}</div>
      </div>
      <span class="badge badge-warn">FATURADO</span>
    </div>`).join('');
}

function renderErpTable() {
  const tbody = document.getElementById('erp-table-body');
  tbody.innerHTML = allOrders.map(o => `
    <tr style="border-bottom:1px solid #1a1a1a; transition:background 0.15s;" onmouseover="this.style.background='#161616'" onmouseout="this.style.background='transparent'">
      <td style="padding:12px 16px; color:#d4af37; font-size:12px;">${o.numero_pedido}</td>
      <td style="padding:12px 16px; color:#888; font-size:12px; font-family:'IBM Plex Sans',sans-serif;">${o.cliente}</td>
      <td style="padding:12px 16px;"><span class="badge badge-gold">${ETAPAS[o.etapa_atual_index - 1]?.label || '—'}</span></td>
      <td style="padding:12px 16px; text-align:center; display:flex; gap:6px; justify-content:center;">
        <button style="background:#1a1a1a; border:1px solid #2a2a2a; color:#888; padding:5px 10px; border-radius:4px; font-size:11px; cursor:pointer; transition:all 0.15s;"
          onmouseover="this.style.borderColor='#d4af37';this.style.color='#d4af37'" 
          onmouseout="this.style.borderColor='#2a2a2a';this.style.color='#888'"
          onclick="openEditById('${o.numero_pedido}')">editar</button>
        <button style="background:#1a1a1a; border:1px solid #2a0f0f; color:#ef4444; padding:5px 10px; border-radius:4px; font-size:11px; cursor:pointer; transition:all 0.15s;"
          onmouseover="this.style.background='#1a0a0a'" 
          onmouseout="this.style.background='#1a1a1a'"
          onclick="deleteById('${o.numero_pedido}')">excluir</button>
      </td>
    </tr>`).join('');
}

// --- Tab Switching ---
function switchTab(tab) {
  activeTab = tab;
  ['details', 'insumos', 'logistica', 'erp'].forEach(t => {
    const view = document.getElementById(`view-${t}`);
    const btn = document.getElementById(`tab-${t}`);
    if (view) view.style.display = t === tab ? 'block' : 'none';
    if (btn) btn.className = t === tab ? 'tab-btn active' : 'tab-btn';
  });
}

// --- CRUD ---
function openModal() {
  document.getElementById('f-id').value = '';
  document.getElementById('f-numero').value = '';
  document.getElementById('f-lote').value = '';
  document.getElementById('f-cliente').value = '';
  document.getElementById('f-valor').value = '';
  document.getElementById('f-prazo').value = '';
  document.getElementById('f-etapa').value = '1';
  document.getElementById('f-transp').value = '';
  document.getElementById('f-rastreio').value = '';
  document.getElementById('modal-title').textContent = 'Novo Pedido';
  document.getElementById('btn-modal-del').style.display = 'none';
  document.getElementById('modal').style.display = 'flex';
}

function openEdit() {
  if (!currentOrder) return;
  openEditById(currentOrder.numero_pedido);
}

function openEditById(numeroPedido) {
  const o = allOrders.find(x => x.numero_pedido === numeroPedido);
  if (!o) return;
  document.getElementById('f-id').value = o.id;
  document.getElementById('f-numero').value = o.numero_pedido;
  document.getElementById('f-lote').value = o.lote || '';
  document.getElementById('f-cliente').value = o.cliente;
  document.getElementById('f-valor').value = o.valor;
  document.getElementById('f-prazo').value = o.prazo;
  document.getElementById('f-etapa').value = o.etapa_atual_index;
  document.getElementById('f-transp').value = o.transportadora || '';
  document.getElementById('f-rastreio').value = o.codigo_rastreio || '';
  document.getElementById('modal-title').textContent = 'Editar Pedido';
  document.getElementById('btn-modal-del').style.display = 'block';
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() { document.getElementById('modal').style.display = 'none'; }

async function saveOrder(e) {
  e.preventDefault();
  const id = document.getElementById('f-id').value;
  const obj = {
    numero_pedido: document.getElementById('f-numero').value,
    lote: document.getElementById('f-lote').value,
    cliente: document.getElementById('f-cliente').value,
    valor: parseFloat(document.getElementById('f-valor').value),
    prazo: document.getElementById('f-prazo').value,
    etapa_atual_index: parseInt(document.getElementById('f-etapa').value),
    transportadora: document.getElementById('f-transp').value || null,
    codigo_rastreio: document.getElementById('f-rastreio').value || null,
    data_entrada_etapa: new Date().toISOString(),
  };

  try {
    if (id) {
      const { error } = await db.from('pedidos').update(obj).eq('id', id);
      if (error) throw error;
    } else {
      const { data, error } = await db.from('pedidos').insert(obj).select();
      if (error) throw error;
      if (data && data[0]) {
        await db.from('insumos').insert([
          { pedido_id: data[0].id, nome_insumo: 'Matéria Prima (Polímero)', status: 'green', detalhes: 'Lote Verificado' },
          { pedido_id: data[0].id, nome_insumo: 'Pigmentação', status: 'green', detalhes: 'Estoque OK' },
          { pedido_id: data[0].id, nome_insumo: 'Embalagem', status: 'yellow', detalhes: 'Aguardando lote' },
        ]);
      }
    }
    showToast('Pedido salvo com sucesso!');
    closeModal();
    await load();
  } catch (err) {
    console.error(err);
    showToast('Erro ao salvar pedido.', false);
  }
}

async function deleteById(numeroPedido) {
  if (!confirm(`Excluir o pedido ${numeroPedido}?`)) return;
  try {
    const { error } = await db.from('pedidos').delete().eq('numero_pedido', numeroPedido);
    if (error) throw error;
    if (currentOrder && currentOrder.numero_pedido === numeroPedido) currentOrder = null;
    showToast('Pedido excluído.');
    await load();
  } catch (err) {
    showToast('Erro ao excluir.', false);
  }
}

function deleteCurrentOrder() {
  if (!currentOrder) return;
  deleteById(currentOrder.numero_pedido);
}

function deleteFromModal() {
  const num = document.getElementById('f-numero').value;
  if (!num) return;
  closeModal();
  deleteById(num);
}

// --- Start ---
document.addEventListener('DOMContentLoaded', init);

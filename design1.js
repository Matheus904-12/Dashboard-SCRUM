// InovaMold - Polimeros | Core Logic
const SUPABASE_URL = 'https://aueswagvyexetfxduuxh.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_83pMDh35idUGKvI289pyhg_M7V-JPpm';

// ── CUSTOM CONFIRM DIALOG ────────────────────────────────────
function customConfirm(message, title = 'Confirmar ação') {
    return new Promise(resolve => {
        const dialog = document.getElementById('confirm-dialog-d1');
        const msgEl  = document.getElementById('confirm-msg-d1');
        const titleEl = document.getElementById('confirm-title-d1');
        const okBtn  = document.getElementById('confirm-ok-d1');
        const cancelBtn = document.getElementById('confirm-cancel-d1');
        if (!dialog) { resolve(window.confirm(message)); return; }

        titleEl.textContent = title;
        msgEl.textContent = message;
        dialog.style.display = 'flex';

        const cleanup = (result) => {
            dialog.style.display = 'none';
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            resolve(result);
        };
        const onOk = () => cleanup(true);
        const onCancel = () => cleanup(false);
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
    });
}

// ── DESIGN SWITCH WITH FADE TRANSITION ────────────────────────
function switchDesign(url) {
    document.body.style.transition = 'opacity 0.4s ease';
    document.body.style.opacity = '0';
    setTimeout(() => { window.location.href = url; }, 400);
}

let supabaseClient = null;
let currentOrder = null;
let allOrders = [];

// Initialize Supabase and update status UI
function initSupabase() {
    console.log("Initializing Supabase...");
    const statusEl = document.getElementById('connection-status');
    
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        if (!window.supabase) {
            console.error("Supabase library NOT found on window object!");
            statusEl.innerHTML = '<i data-lucide="database-zap"></i> Erro: Lib não carregada';
            return;
        }

        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("Supabase Client Created Successfully");
            statusEl.innerHTML = '<i data-lucide="database"></i> Conectado ao PostgreSQL';
            statusEl.classList.remove('status-pending');
            statusEl.classList.add('status-success');
            refreshData();
        } catch (e) {
            statusEl.innerHTML = '<i data-lucide="database-zap"></i> Erro na Configuração';
            console.error("Supabase Init Error:", e);
        }
    } else {
        console.warn("Supabase credentials missing. Running in Demo Mode.");
        statusEl.innerHTML = '<i data-lucide="database"></i> Modo Demo (Sem Banco)';
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Fetch all orders for the dashboard
async function refreshData() {
    if (supabaseClient) {
        const { data, error } = await supabaseClient.from('pedidos').select('*').order('created_at', { ascending: false });
        if (data) {
            allOrders = data;
            renderAdminTable();
            updateRiskTable();
            updateLogisticsSummary();
            if (allOrders.length > 0 && !currentOrder) {
                loadOrder(allOrders[0]);
            }
        }
    } else {
        // Fallback to mock data if no supabase
        allOrders = mockOrders;
        renderAdminTable();
    }
}

// UI Update Logic for Main Dashboard
async function loadOrder(orderData) {
    currentOrder = orderData;
    
    document.getElementById('display-pedido-id').innerText = orderData.numero_pedido;
    document.getElementById('display-lote-id').innerText = orderData.lote;
    document.getElementById('card-cliente').innerText = orderData.cliente;
    document.getElementById('card-valor').innerText = `R$ ${orderData.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('card-prazo').innerText = new Date(orderData.prazo).toLocaleDateString('pt-BR');
    document.getElementById('card-status').innerText = orderData.status || (isDelayed(orderData.data_entrada_etapa) ? 'Em Atraso' : 'No Prazo');

    // Timeline
    const steps = document.querySelectorAll('.step');
    const progressLine = document.getElementById('timeline-progress');
    const activeIdx = orderData.etapa_atual_index;

    steps.forEach((step, idx) => {
        const stepIdx = idx + 1;
        step.classList.remove('active');
        const circle = step.querySelector('.step-circle');
        circle.style.backgroundColor = '';
        circle.style.borderColor = '';
        
        if (stepIdx <= activeIdx) {
            step.classList.add('active');
            if (stepIdx === activeIdx && isDelayed(orderData.data_entrada_etapa)) {
                circle.style.backgroundColor = '#dc3545';
                circle.style.borderColor = '#dc3545';
            }
        }
    });

    const progressPercent = ((activeIdx - 1) / (steps.length - 1)) * 100;
    progressLine.style.width = `${progressPercent}%`;

    // Time in stage
    const daysInStage = calculateDays(orderData.data_entrada_etapa);
    document.getElementById('etapa-label').innerText = getEtapaName(activeIdx);
    document.getElementById('etapa-time').innerText = `${daysInStage} dias`;
    
    document.getElementById('chart-alert').style.display = daysInStage > 2 ? 'flex' : 'none';
    if (daysInStage > 2) document.getElementById('delay-days').innerText = (daysInStage - 1).toFixed(1);

    // Logistics
    if (activeIdx >= 7 && orderData.transportadora) {
        document.getElementById('tracking-info').style.display = 'block';
        document.getElementById('tracking-company').innerText = orderData.transportadora;
        document.getElementById('tracking-code').innerText = orderData.codigo_rastreio || 'Pendente';
    } else {
        document.getElementById('tracking-info').style.display = 'none';
    }

    updateChart(daysInStage);
    loadInsumos(orderData.id);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Semáforo de Polímeros & Insumos
const STATUS_COLORS = { green: '#28a745', yellow: '#ffc107', red: '#dc3545' };
const STATUS_CYCLE = { green: 'yellow', yellow: 'red', red: 'green' };
const STATUS_LABEL = { green: 'OK', yellow: 'Atenção', red: 'Crítico' };
let _insumoItems = []; // cached for cycling
let _currentPedidoId = null;

async function loadInsumos(pedidoId) {
    _currentPedidoId = pedidoId;
    const list = document.getElementById('insumos-list');
    const alertEl = document.getElementById('insumo-alert');
    if (!list) return;
    list.innerHTML = '<li style="color:#aaa;font-size:0.85rem;padding:1rem 0;">Carregando insumos...</li>';

    let items = [];
    if (supabaseClient && pedidoId) {
        const { data } = await supabaseClient.from('insumos').select('*').eq('pedido_id', pedidoId);
        if (data && data.length > 0) items = data;
    }
    if (items.length === 0) {
        items = [
            { id: null, nome_insumo: 'Polímero PVC-S', status: 'green', detalhes: 'Lote Verificado' },
            { id: null, nome_insumo: 'Aditivo Estabilizante', status: 'yellow', detalhes: 'Reposição em 1 dia' },
            { id: null, nome_insumo: 'Pigmento Preto', status: 'green', detalhes: 'Estoque OK' },
        ];
    }
    _insumoItems = items;
    renderInsumos();
}

function renderInsumos() {
    const list = document.getElementById('insumos-list');
    const alertEl = document.getElementById('insumo-alert');
    if (!list) return;

    const hasCritical = _insumoItems.some(i => i.status === 'red');
    if (alertEl) alertEl.style.display = hasCritical ? 'flex' : 'none';

    list.innerHTML = _insumoItems.map((ins, idx) => `
        <li class="semaforo-item" style="cursor:pointer;" onclick="cycleStatus(${idx})" title="Clique para alterar status">
            <div class="semaforo-left">
                <div class="dot ${ins.status}" style="cursor:pointer; transition:transform 0.15s;" onmouseover="this.style.transform='scale(1.4)'" onmouseout="this.style.transform='scale(1)'"></div>
                <div>
                    <div class="item-name">${ins.nome_insumo}</div>
                    <div class="item-details" style="font-size:0.7rem; margin-top:1px;">${ins.detalhes || ''}</div>
                </div>
            </div>
            <span style="font-size:0.7rem; font-weight:600; padding:2px 8px; border-radius:99px; background:${STATUS_COLORS[ins.status]}22; color:${STATUS_COLORS[ins.status]}; border:1px solid ${STATUS_COLORS[ins.status]}44;">
                ${STATUS_LABEL[ins.status]}
            </span>
        </li>
    `).join('');
}

async function cycleStatus(idx) {
    const item = _insumoItems[idx];
    if (!item) return;
    const next = STATUS_CYCLE[item.status] || 'green';
    _insumoItems[idx] = { ...item, status: next };
    renderInsumos();
    // Persist if real DB item
    if (supabaseClient && item.id) {
        await supabaseClient.from('insumos').update({ status: next }).eq('id', item.id);
    }
    showToast(`${item.nome_insumo}: ${STATUS_LABEL[next]}`, 'success');
}

// Admin Logic (CRUD)
function renderAdminTable() {
    const container = document.getElementById('admin-table-body');
    if (!container) return;
    container.innerHTML = '';

    if (allOrders.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:32px 0; color:#aaa; font-size:0.9rem;">Nenhum pedido encontrado</div>';
        return;
    }

    allOrders.forEach(o => {
        const etapaName = getEtapaName(o.etapa_atual_index);
        const card = document.createElement('div');
        card.style.cssText = 'display:flex; align-items:center; gap:12px; padding:14px 16px; background:#f8f9fa; border:1px solid #e9ecef; border-radius:12px; cursor:pointer; transition:all 0.18s;';
        card.onmouseover = () => { card.style.background = '#f1f5f9'; card.style.borderColor = '#000'; };
        card.onmouseout = () => { card.style.background = '#f8f9fa'; card.style.borderColor = '#e9ecef'; };
        card.onclick = (e) => {
            if (e.target.closest('.icon-action')) return; // don't trigger on icon clicks
            loadOrder(o);
            closeModal();
        };
        card.innerHTML = `
            <div style="width:40px; height:40px; background:#000; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div style="flex:1; min-width:0;">
                <div style="font-weight:700; font-size:0.9rem;">${o.numero_pedido}</div>
                <div style="font-size:0.78rem; color:#64748b; margin-top:2px;">${o.cliente} · ${etapaName}</div>
            </div>
            <div style="display:flex; gap:6px; flex-shrink:0;">
                <button class="icon-action" title="Editar" onclick="openEditMode('${o.numero_pedido}')" style="width:34px;height:34px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#475569;transition:all 0.15s;" onmouseover="this.style.borderColor='#000';this.style.color='#000'" onmouseout="this.style.borderColor='#e2e8f0';this.style.color='#475569'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="icon-action" title="Excluir" onclick="deleteOrder('${o.numero_pedido}')" style="width:34px;height:34px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#e11d48;transition:all 0.15s;" onmouseover="this.style.background='#fff1f2';this.style.borderColor='#fecdd3'" onmouseout="this.style.background='#fff';this.style.borderColor='#e2e8f0'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                </button>
            </div>`;
        container.appendChild(card);
    });
}

window.openEditMode = (numeroPedido) => {
    const order = allOrders.find(o => o.numero_pedido === numeroPedido);
    if (!order) return;

    document.getElementById('order-id').value = order.id || '';
    document.getElementById('in-numero').value = order.numero_pedido;
    document.getElementById('in-lote').value = order.lote;
    document.getElementById('in-cliente').value = order.cliente;
    document.getElementById('in-valor').value = order.valor;
    document.getElementById('in-prazo').value = order.prazo;
    document.getElementById('in-etapa').value = order.etapa_atual_index;
    document.getElementById('in-transp').value = order.transportadora || '';
    document.getElementById('in-rastreio').value = order.codigo_rastreio || '';
    
    document.getElementById('btn-delete').style.display = 'block';
    switchTab('form');
};

async function deleteOrder(numeroPedido) {
    const ok = await customConfirm(
        `Deseja excluir permanentemente o pedido ${numeroPedido}? Esta ação não pode ser desfeita.`,
        'Excluir Pedido'
    );
    if (!ok) return;
    if (supabaseClient) {
        const { error } = await supabaseClient.from('pedidos').delete().eq('numero_pedido', numeroPedido);
        if (!error) {
            showToast("Pedido excluído com sucesso!", "success");
            refreshData();
        } else {
            showToast("Erro ao excluir pedido.", "error");
        }
    } else {
        allOrders = allOrders.filter(o => o.numero_pedido !== numeroPedido);
        renderAdminTable();
        showToast("Modo Demo: Pedido removido da lista local.", "info");
    }
}

document.getElementById('order-form').onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('order-id').value;
    const orderObj = {
        numero_pedido: document.getElementById('in-numero').value,
        lote: document.getElementById('in-lote').value,
        cliente: document.getElementById('in-cliente').value,
        valor: parseFloat(document.getElementById('in-valor').value),
        prazo: document.getElementById('in-prazo').value,
        etapa_atual_index: parseInt(document.getElementById('in-etapa').value),
        transportadora: document.getElementById('in-transp').value,
        codigo_rastreio: document.getElementById('in-rastreio').value,
        data_entrada_etapa: new Date().toISOString()
    };

    if (supabaseClient) {
        const { error } = await supabaseClient.from('pedidos').upsert(orderObj, { onConflict: 'numero_pedido' });
        if (!error) {
            showToast("Pedido salvo com sucesso!", "success");
            refreshData();
            closeModal();
        } else {
            showToast("Erro ao salvar no banco.", "error");
            console.error(error);
        }
    } else {
        showToast("Modo Demo: Pedido salvo localmente.", "info");
        closeModal();
    }
};

// Tabs
const tabList = document.getElementById('tab-list');
const tabForm = document.getElementById('tab-form');
const viewList = document.getElementById('view-list');
const viewForm = document.getElementById('view-form');

function switchTab(tab) {
    if (tab === 'list') {
        tabList.classList.add('active');
        tabForm.classList.remove('active');
        viewList.style.display = 'block';
        viewForm.style.display = 'none';
        document.getElementById('btn-delete').style.display = 'none';
    } else {
        tabList.classList.remove('active');
        tabForm.classList.add('active');
        viewList.style.display = 'none';
        viewForm.style.display = 'block';
    }
}

tabList.onclick = () => switchTab('list');
tabForm.onclick = () => {
    document.getElementById('order-form').reset();
    document.getElementById('order-id').value = '';
    switchTab('form');
};

// Search
document.getElementById('search-order').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    if (term.length < 2) return;
    const found = allOrders.find(o => 
        o.numero_pedido.toLowerCase().includes(term) || 
        o.cliente.toLowerCase().includes(term) || 
        o.lote.toLowerCase().includes(term)
    );
    if (found) loadOrder(found);
});

// Chart & Logic Helpers
function updateChart(currentDays) {
    const ctx = document.getElementById('stageChart').getContext('2d');
    if (window.myChart) window.myChart.destroy();
    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Média InovaMold', 'Este Pedido'],
            datasets: [{
                data: [1.5, currentDays],
                backgroundColor: ['#1a1a1a', currentDays > 2 ? '#dc3545' : '#000'],
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { x: { display: false, min: 0 }, y: { grid: { display: false } } }
        }
    });
}

function updateRiskTable() {
    const tbody = document.getElementById('risk-table-body');
    const summary = document.getElementById('risk-summary');
    tbody.innerHTML = '';
    
    const delayed = allOrders.filter(o => isDelayed(o.data_entrada_etapa) && o.etapa_atual_index < 8);
    
    if (delayed.length === 0) {
        summary.innerText = "Cadeia de suprimentos estável. Nenhum gargalo crítico detectado.";
        summary.style.background = "#e8f5e9";
        summary.style.color = "#2e7d32";
    } else {
        summary.innerText = `${delayed.length} pedido(s) retido(s) por mais de 2 dias na mesma etapa.`;
        summary.style.background = "#fff9f0";
        summary.style.color = "#856404";
        
        delayed.slice(0, 5).forEach(o => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${o.numero_pedido}</td>
                <td>${getEtapaName(o.etapa_atual_index)}</td>
                <td>Polímero PVC</td>
                <td><span style="color: #dc3545;">Alto</span></td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function updateLogisticsSummary() {
    const ready = allOrders.filter(o => o.etapa_atual_index === 7);
    const list = document.getElementById('ready-orders-list');
    const countEl = document.getElementById('ready-count');
    list.innerHTML = '';

    // If no orders at etapa 7, show last 3 recent orders as reference
    const displayList = ready.length > 0 ? ready : allOrders.slice(0, 3);
    const isReady = ready.length > 0;

    // Counter: show what's actually displayed
    if (countEl) countEl.innerText = displayList.length;

    displayList.forEach(o => {
        const div = document.createElement('div');
        div.className = 'pedido-mini-card';
        div.style.cursor = 'pointer';
        div.onclick = () => loadOrder(o);
        div.innerHTML = `
            <div>
                <div class="id">${o.numero_pedido}</div>
                <div class="client">${o.cliente} · ${getEtapaName(o.etapa_atual_index)}</div>
            </div>
            <span style="font-size:0.7rem;padding:2px 8px;border-radius:99px;background:${isReady?'#e8f5e9':'#f1f5f9'};color:${isReady?'#2e7d32':'#64748b'};font-weight:600;">${isReady?'PRONTO':'ATIVO'}</span>`;
        list.appendChild(div);
    });

    if (displayList.length === 0) {
        list.innerHTML = '<p style="font-size:0.8rem;color:#aaa;">Nenhum pedido cadastrado</p>';
    }
}

function calculateDays(dateStr) {
    const start = new Date(dateStr);
    const now = new Date();
    const diff = Math.max(0, now - start);
    return parseFloat((diff / (1000 * 60 * 60 * 24)).toFixed(1));
}

function isDelayed(dateStr) {
    return calculateDays(dateStr) > 2;
}

function getEtapaName(idx) {
    const names = ['', 'Comercial', 'PCP', 'Produção', 'Fim Produção', 'Estoque', 'Separação', 'Faturado', 'Enviado'];
    return names[idx] || 'Desconhecida';
}

function showToast(msg, type) {
    Toastify({
        text: msg,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: type === 'success' ? "#2e7d32" : type === 'error' ? "#dc3545" : "#1a1a1a" }
    }).showToast();
}

// Modal Toggle
const adminModal = document.getElementById('admin-modal');
document.getElementById('btn-open-admin').onclick = () => {
    adminModal.style.display = 'flex';
    switchTab('list');
    refreshData();
};
document.getElementById('close-admin').onclick = closeModal;
function closeModal() { adminModal.style.display = 'none'; }

// Mock Data Fallback
const mockOrders = [
    {
        numero_pedido: 'IM-2026-001',
        lote: 'POL-PVC-442',
        cliente: 'Indústria Plástica Sul',
        valor: 125400.00,
        prazo: '2026-05-20',
        etapa_atual_index: 3,
        data_entrada_etapa: new Date(Date.now() - 3 * 86400000).toISOString(),
        transportadora: null,
        codigo_rastreio: null
    }
];

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initSupabase();
        // Safe JS fade-in
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.35s ease';
        requestAnimationFrame(() => requestAnimationFrame(() => {
            document.body.style.opacity = '1';
        }));
    });
} else {
    initSupabase();
}

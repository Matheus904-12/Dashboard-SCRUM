// InovaMold - Polimeros | Core Logic
const SUPABASE_URL = 'https://aueswagvyexetfxduuxh.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_83pMDh35idUGKvI289pyhg_M7V-JPpm';

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
            renderQuickOrderList();
            updateRiskTable();
            updateLogisticsSummary();
            if (allOrders.length > 0 && !currentOrder) {
                loadOrder(allOrders[0]);
            }
        }
        if (error) {
            console.error("Error fetching data:", error);
            showToast("Erro ao carregar dados do banco.", "error");
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

async function loadInsumos(pedidoId) {
    const list = document.querySelector('.semaforo-list');
    list.innerHTML = '<li>Carregando insumos...</li>';
    
    if (supabaseClient && pedidoId) {
        const { data, error } = await supabaseClient.from('insumos').select('*').eq('pedido_id', pedidoId);
        if (data && data.length > 0) {
            list.innerHTML = '';
            data.forEach(item => {
                const li = document.createElement('li');
                li.className = 'semaforo-item';
                li.innerHTML = `
                    <div class="semaforo-left">
                        <div class="dot ${item.status}"></div>
                        <div class="item-name">${item.nome_insumo}</div>
                    </div>
                    <div class="item-details">${item.detalhes || ''}</div>
                `;
                list.appendChild(li);
            });
        } else {
            // Fallback: Mostrar insumos padrão se não houver no banco (Fidelidade ao Design)
            list.innerHTML = '';
            const defaults = [
                { name: 'Polímero PVC-S', status: 'green', details: 'Lote Verificado' },
                { name: 'Aditivo Estabilizante', status: 'yellow', details: 'Reposição em 1 dia' },
                { name: 'Pigmento Preto', status: 'green', details: 'Estoque OK' }
            ];
            defaults.forEach(item => {
                const li = document.createElement('li');
                li.className = 'semaforo-item';
                li.innerHTML = `
                    <div class="semaforo-left">
                        <div class="dot ${item.status}"></div>
                        <div class="item-name">${item.name}</div>
                    </div>
                    <div class="item-details">${item.details}</div>
                `;
                list.appendChild(li);
            });
        }
    } else {
        list.innerHTML = '<li>Modo Demo: Sem insumos vinculados.</li>';
    }
}

// Admin Logic (CRUD)
function renderQuickOrderList() {
    const list = document.getElementById('quick-order-list');
    list.innerHTML = '';
    
    // Show last 5 orders
    allOrders.slice(0, 5).forEach(o => {
        const span = document.createElement('span');
        span.className = `order-tag ${currentOrder && currentOrder.id === o.id ? 'active' : ''}`;
        span.innerText = o.numero_pedido;
        span.onclick = () => loadOrder(o);
        list.appendChild(span);
    });
}

function renderAdminTable() {
    const tbody = document.getElementById('dashboard-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    allOrders.forEach(o => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${o.numero_pedido}</b></td>
            <td>${o.cliente}</td>
            <td style="text-align: center; display: flex; gap: 0.5rem; justify-content: center;">
                <button class="action-btn-icon edit" onclick="openEditMode('${o.numero_pedido}')" title="Editar">
                    <i data-lucide="edit-3" style="width: 16px; height: 16px;"></i>
                </button>
                <button class="action-btn-icon delete" onclick="deleteOrder('${o.numero_pedido}')" title="Excluir">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    if (typeof lucide !== 'undefined') lucide.createIcons();
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
    if (!confirm(`Tem certeza que deseja excluir o pedido ${numeroPedido}?`)) return;

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
        const { data, error } = await supabaseClient.from('pedidos').upsert(orderObj, { onConflict: 'numero_pedido' }).select();
        if (!error) {
            showToast("Pedido salvo com sucesso!", "success");
            await refreshData();
            const newOrder = data[0];
            if (newOrder) {
                // Add sample insumos for new orders so dashboard isn't empty
                await supabaseClient.from('insumos').insert([
                    { pedido_id: newOrder.id, nome_insumo: 'Matéria Prima (Polímero)', status: 'green' },
                    { pedido_id: newOrder.id, nome_insumo: 'Pigmentação', status: 'green' },
                    { pedido_id: newOrder.id, nome_insumo: 'Embalagem', status: 'yellow', detalhes: 'Aguardando lote' }
                ]);
                loadOrder(newOrder);
            }
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
    document.getElementById('ready-count').innerText = ready.length;
    const list = document.getElementById('ready-orders-list');
    list.innerHTML = '';
    ready.forEach(o => {
        const div = document.createElement('div');
        div.className = 'pedido-mini-card';
        div.style.cursor = 'pointer';
        div.onclick = () => loadOrder(o);
        div.innerHTML = `<div><div class="id">${o.numero_pedido}</div><div class="client">${o.cliente}</div></div> <i data-lucide="arrow-right"></i>`;
        list.appendChild(div);
    });
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
        // Force large icon size
        setTimeout(() => {
            const icon = document.querySelector('#btn-open-admin svg');
            if (icon) {
                icon.setAttribute('width', '32');
                icon.setAttribute('height', '32');
                icon.setAttribute('stroke-width', '3');
            }
        }, 500);
    });
} else {
    initSupabase();
}

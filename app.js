// InovaMold Logistics Dashboard - Core Logic
let supabaseClient = null;
let allOrders = [];
let currentOrder = null;

// Mock data for demo mode
const mockOrders = [
    { id: 1, numero_pedido: 'IM-2026-001', lote: 'POL-PVC-442', cliente: 'Indústria Plástica Sul', valor: 125400.00, prazo: '2026-05-20', etapa_atual_index: 3, data_entrada_etapa: new Date().toISOString() }
];

async function initSupabase() {
    const statusEl = document.getElementById('connection-status');
    const url = 'https://aueswagvyexetfxduuxh.supabase.co';
    const key = 'sb_publishable_83pMDh35idUGKvI289pyhg_M7V-JPpm';

    if (url && key) {
        try {
            supabaseClient = supabase.createClient(url, key);
            statusEl.innerHTML = '<i data-lucide="database"></i> Conectado ao PostgreSQL';
            statusEl.className = 'status-badge status-active';
            await refreshData();
        } catch (e) {
            console.error("Supabase Init Error:", e);
        }
    } else {
        statusEl.innerHTML = '<i data-lucide="database"></i> Modo Demo (Sem Banco)';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function refreshData() {
    if (supabaseClient) {
        const { data, error } = await supabaseClient.from('pedidos').select('*').order('created_at', { ascending: false });
        if (data) {
            allOrders = data;
            renderAdminTable();
            renderQuickOrderList();
            updateLogisticsSummary();
            if (allOrders.length > 0 && !currentOrder) {
                loadOrder(allOrders[0]);
            }
        }
        if (error) console.error("Error fetching data:", error);
    } else {
        allOrders = mockOrders;
        renderAdminTable();
    }
}

function loadOrder(orderData) {
    currentOrder = orderData;
    document.getElementById('display-pedido-id').innerText = orderData.numero_pedido;
    document.getElementById('display-lote-id').innerText = orderData.lote;
    document.getElementById('card-cliente').innerText = orderData.cliente;
    document.getElementById('card-valor').innerText = formatCurrency(orderData.valor);
    document.getElementById('card-prazo').innerText = formatDate(orderData.prazo);
    
    const activeIdx = parseInt(orderData.etapa_atual_index);
    updateTimeline(activeIdx);
    
    const daysInStage = calculateDays(orderData.data_entrada_etapa);
    document.getElementById('etapa-label').innerText = getEtapaName(activeIdx);
    document.getElementById('etapa-time').innerText = `${daysInStage} dias`;
    
    document.getElementById('chart-alert').style.display = daysInStage > 2 ? 'flex' : 'none';
    if (daysInStage > 2) document.getElementById('delay-days').innerText = (daysInStage - 1).toFixed(1);

    updateChart(daysInStage);
    loadInsumos(orderData.id);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function loadInsumos(pedidoId) {
    const list = document.getElementById('insumos-list');
    if (!list) return;
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
            // Fallback UI
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
                    <div class="semaforo-left"><div class="dot ${item.status}"></div><div class="item-name">${item.name}</div></div>
                    <div class="item-details">${item.details}</div>
                `;
                list.appendChild(li);
            });
        }
    }
}

function renderQuickOrderList() {
    const list = document.getElementById('quick-order-list');
    if (!list) return;
    list.innerHTML = '';
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
                <button class="action-btn-icon edit" onclick="openEditMode('${o.numero_pedido}')">
                    <i data-lucide="edit-3" style="width: 16px; height: 16px;"></i>
                </button>
                <button class="action-btn-icon delete" onclick="deleteOrder('${o.numero_pedido}')">
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
    openModal();
};

async function deleteOrder(numeroPedido) {
    if (!confirm(`Excluir o pedido ${numeroPedido}?`)) return;
    if (supabaseClient) {
        const { error } = await supabaseClient.from('pedidos').delete().eq('numero_pedido', numeroPedido);
        if (!error) {
            showToast("Excluído com sucesso", "success");
            refreshData();
        }
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
            showToast("Salvo com sucesso!", "success");
            await refreshData();
            const newOrder = data[0];
            if (newOrder && !id) {
                await supabaseClient.from('insumos').insert([
                    { pedido_id: newOrder.id, nome_insumo: 'Matéria Prima (Polímero)', status: 'green' },
                    { pedido_id: newOrder.id, nome_insumo: 'Pigmentação', status: 'green' },
                    { pedido_id: newOrder.id, nome_insumo: 'Embalagem', status: 'yellow', detalhes: 'Aguardando lote' }
                ]);
            }
            if (newOrder) loadOrder(newOrder);
            closeModal();
        } else {
            showToast("Erro ao salvar.", "error");
        }
    }
};

function openModal() { document.getElementById('admin-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('admin-modal').style.display = 'none'; }
document.getElementById('btn-delete').onclick = () => {
    const num = document.getElementById('in-numero').value;
    deleteOrder(num);
    closeModal();
};

document.getElementById('search-order').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    if (term.length < 2) return;
    const found = allOrders.find(o => o.numero_pedido.toLowerCase().includes(term) || o.cliente.toLowerCase().includes(term));
    if (found) loadOrder(found);
});

function updateChart(currentDays) {
    const canvas = document.getElementById('stageChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
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
        options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { display: false, min: 0 }, y: { grid: { display: false } } } }
    });
}

function updateLogisticsSummary() {
    const readyCount = document.getElementById('ready-count');
    if (!readyCount) return;
    const ready = allOrders.filter(o => o.etapa_atual_index === 7);
    readyCount.innerText = ready.length;
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
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function updateTimeline(activeIdx) {
    const progress = document.getElementById('timeline-progress');
    const steps = document.querySelectorAll('.step');
    const percentage = ((activeIdx - 1) / (steps.length - 1)) * 100;
    progress.style.width = `${percentage}%`;
    steps.forEach(step => {
        const stepNum = parseInt(step.getAttribute('data-step'));
        step.classList.remove('active', 'completed');
        if (stepNum < activeIdx) step.classList.add('completed');
        if (stepNum === activeIdx) step.classList.add('active');
    });
}

// Helpers
function formatCurrency(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
function formatDate(d) { return new Date(d).toLocaleDateString('pt-BR'); }
function calculateDays(dateStr) {
    if (!dateStr) return 0;
    const diff = new Date() - new Date(dateStr);
    return Math.max(0, (diff / (1000 * 60 * 60 * 24)).toFixed(1));
}
function getEtapaName(idx) {
    const names = ["", "Comercial", "PCP", "Início Produção", "Fim Produção", "Estoque", "Separação", "Faturado", "Enviado"];
    return names[idx] || "-";
}
function showToast(msg, type) {
    Toastify({ text: msg, duration: 3000, gravity: "top", position: "right", backgroundColor: type === "success" ? "#2ecc71" : "#e74c3c" }).showToast();
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
    setTimeout(() => {
        const icon = document.querySelector('#btn-open-admin svg');
        if (icon) {
            icon.setAttribute('width', '32');
            icon.setAttribute('height', '32');
            icon.setAttribute('stroke-width', '3');
        }
    }, 1000);
});

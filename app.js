// InovaMold - Polimeros | Core Logic
const SUPABASE_URL = 'https://aueswagvyexetfxduuxh.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_83pMDh35idUGKvI289pyhg_M7V-JPpm';

let supabase = null;

// Initialize Supabase and update status UI
function initSupabase() {
    const statusEl = document.getElementById('connection-status');
    
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            statusEl.innerHTML = '<i data-lucide="database"></i> Conectado ao PostgreSQL';
            statusEl.classList.remove('status-pending');
            statusEl.classList.add('status-success');
        } catch (e) {
            statusEl.innerHTML = '<i data-lucide="database-zap"></i> Erro na Conexão';
            console.error("Supabase Init Error:", e);
        }
    } else {
        statusEl.innerHTML = '<i data-lucide="database"></i> Modo Demo (Sem Banco)';
    }
    
    // Safety check for Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        console.warn("Lucide library not loaded yet.");
    }
}

// Global State
let currentOrder = null;

// Mock Data for Demo (InovaMold Specific)
const mockOrders = [
    {
        id: 1,
        numero_pedido: 'IM-2026-001',
        lote: 'POL-PVC-442',
        cliente: 'Indústria Plástica Sul',
        valor: 125400.00,
        prazo: '2026-05-20',
        status: 'No Prazo',
        etapa_atual_index: 3, // Início Produção
        data_entrada_etapa: '2026-05-08',
        transportadora: null,
        codigo_rastreio: null,
        insumos: [
            { nome: 'Polímero PVC-S', status: 'green' },
            { nome: 'Aditivo Estabilizante', status: 'yellow', extra: 'Reposição em 1 dia' },
            { nome: 'Pigmento Preto', status: 'green' }
        ]
    }
];

// UI Update Logic
async function loadOrder(orderData) {
    currentOrder = orderData;
    
    // Header
    document.getElementById('display-pedido-id').innerText = orderData.numero_pedido;
    document.getElementById('display-lote-id').innerText = orderData.lote;
    
    // Cards
    document.getElementById('card-cliente').innerText = orderData.cliente;
    document.getElementById('card-valor').innerText = `R$ ${orderData.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('card-prazo').innerText = new Date(orderData.prazo).toLocaleDateString('pt-BR');
    document.getElementById('card-status').innerText = orderData.status;

    // Timeline
    const steps = document.querySelectorAll('.step');
    const progressLine = document.getElementById('timeline-progress');
    const activeIdx = orderData.etapa_atual_index;

    steps.forEach((step, idx) => {
        const stepIdx = idx + 1;
        step.classList.remove('active');
        step.style.color = 'var(--text-secondary)';
        
        if (stepIdx <= activeIdx) {
            step.classList.add('active');
            if (stepIdx === activeIdx && isDelayed(orderData.data_entrada_etapa)) {
                step.querySelector('.step-circle').style.backgroundColor = '#dc3545';
                step.querySelector('.step-circle').style.borderColor = '#dc3545';
            } else {
                step.querySelector('.step-circle').style.backgroundColor = '';
                step.querySelector('.step-circle').style.borderColor = '';
            }
        }
    });

    const progressPercent = ((activeIdx - 1) / (steps.length - 1)) * 100;
    progressLine.style.width = `${progressPercent}%`;

    // Time in stage
    const daysInStage = calculateDays(orderData.data_entrada_etapa);
    document.getElementById('etapa-label').innerText = getEtapaName(activeIdx);
    document.getElementById('etapa-time').innerText = `${daysInStage} dias`;
    
    if (daysInStage > 2) {
        document.getElementById('chart-alert').style.display = 'flex';
        document.getElementById('delay-days').innerText = (daysInStage - 1).toFixed(1);
    } else {
        document.getElementById('chart-alert').style.display = 'none';
    }

    // Insumos
    renderInsumos(orderData.insumos || []);

    // Logistics
    if (activeIdx >= 7 && orderData.transportadora) {
        document.getElementById('tracking-info').style.display = 'block';
        document.getElementById('tracking-company').innerText = orderData.transportadora;
        document.getElementById('tracking-code').innerText = orderData.codigo_rastreio || 'Pendente';
    } else {
        document.getElementById('tracking-info').style.display = 'none';
    }

    updateChart(daysInStage);
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons(); 
    }
}

function renderInsumos(insumos) {
    const list = document.getElementById('insumos-list');
    list.innerHTML = '';
    let hasCritical = false;
    
    insumos.forEach(item => {
        if (item.status === 'red') hasCritical = true;
        const li = document.createElement('li');
        li.className = 'semaforo-item';
        li.innerHTML = `
            <div class="semaforo-left">
                <div class="dot ${item.status}"></div>
                <span class="item-name">${item.nome}</span>
            </div>
            ${item.extra ? `<span class="item-details">${item.extra}</span>` : ''}
        `;
        list.appendChild(li);
    });
    
    document.getElementById('insumo-alert').style.display = hasCritical ? 'flex' : 'none';
}

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
            scales: { x: { display: false }, y: { grid: { display: false } } }
        }
    });
}

// Helpers
function calculateDays(dateStr) {
    const start = new Date(dateStr);
    const now = new Date();
    const diff = now - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function isDelayed(dateStr) {
    return calculateDays(dateStr) > 2;
}

function getEtapaName(idx) {
    const names = ['', 'Comercial', 'PCP', 'Produção', 'Fim Produção', 'Estoque', 'Separação', 'Faturado', 'Enviado'];
    return names[idx] || 'Desconhecida';
}

// CRUD & Search
document.getElementById('search-order').addEventListener('input', async (e) => {
    const term = e.target.value.toLowerCase();
    if (term.length < 3) return;

    if (supabase) {
        const { data, error } = await supabase
            .from('pedidos')
            .select('*')
            .or(`numero_pedido.ilike.%${term}%,cliente.ilike.%${term}%,lote.ilike.%${term}%`)
            .single();
        if (data) loadOrder(data);
    } else {
        const found = mockOrders.find(o => o.numero_pedido.toLowerCase().includes(term) || o.cliente.toLowerCase().includes(term));
        if (found) loadOrder(found);
    }
});

// Modal Logic
const adminModal = document.getElementById('admin-modal');
document.getElementById('btn-open-admin').onclick = () => adminModal.style.display = 'flex';
document.getElementById('close-admin').onclick = () => adminModal.style.display = 'none';

document.getElementById('order-form').onsubmit = async (e) => {
    e.preventDefault();
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

    if (supabase) {
        const { error } = await supabase.from('pedidos').upsert(orderObj);
        if (!error) alert('Pedido salvo na InovaMold!');
    } else {
        mockOrders.push(orderObj);
        alert('Modo Demo: Pedido salvo temporariamente.');
    }
    adminModal.style.display = 'none';
    loadOrder(orderObj);
};

// Init
window.onload = () => {
    initSupabase();
    loadOrder(mockOrders[0]);
};

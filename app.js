// Supabase Configuration
// ATENÇÃO: Substitua pelas suas credenciais do Supabase
const SUPABASE_URL = ''; 
const SUPABASE_ANON_KEY = '';

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Mock Data (Based on the images provided)
const mockData = {
    pedido: {
        id: 'PED-2024-001',
        lote: 'LOTE-A-2024-045',
        cliente: 'Confecções Silva Ltda',
        valor: 45800.00,
        prazo: '2026-05-15',
        status: 'No Prazo',
        etapa_atual_index: 6 // Separação Expedição
    },
    etapas: [
        { nome: 'Criado no Comercial', data: '2026-04-10' },
        { nome: 'OP Gerada no PCP', data: '2026-04-11' },
        { nome: 'Início Produção', data: '2026-04-15' },
        { nome: 'Fim Produção', data: '2026-04-28' },
        { nome: 'Entrada no Estoque', data: '2026-04-29' },
        { nome: 'Separação Expedição', data: '2026-05-04' },
        { nome: 'Faturado', data: null },
        { nome: 'Enviado', data: null }
    ],
    insumos: [
        { nome: 'Tecido 100% Algodão', status: 'green' },
        { nome: 'Aviamento Botões', status: 'green' },
        { nome: 'Linha de Costura', status: 'yellow', extra: 'Reposição em 2 dias' },
        { nome: 'Etiquetas', status: 'green' }
    ],
    riscos: [
        { id: 'PED-2024-004', cliente: 'Fashion Store Rio', etapa: 'Fim Produção', insumos: ['Tecido Poliéster', 'Linha de Costura'], prazo: '2026-05-08' }
    ]
};

// State Management
let currentPedido = mockData.pedido;
let currentEtapas = mockData.etapas;

// Update UI Functions
function updateDashboard(data = mockData) {
    const { pedido, etapas, insumos, riscos } = data;

    // Header & Info Cards
    document.getElementById('display-pedido-id').innerText = pedido.id;
    document.getElementById('display-lote-id').innerText = pedido.lote;
    document.getElementById('card-cliente').innerText = pedido.cliente;
    document.getElementById('card-valor').innerText = `R$ ${pedido.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('card-prazo').innerText = pedido.prazo;
    document.getElementById('card-status').innerText = pedido.status;

    // Timeline
    const steps = document.querySelectorAll('.step');
    const progressLine = document.getElementById('timeline-progress');
    let activeIndex = pedido.etapa_atual_index;
    
    steps.forEach((step, idx) => {
        const stepIdx = idx + 1;
        if (stepIdx <= activeIndex) {
            step.classList.add('active');
            step.querySelector('.step-date').innerText = etapas[idx].data || '';
        } else {
            step.classList.remove('active');
            step.querySelector('.step-date').innerText = '-';
        }
    });

    const progressPercent = ((activeIndex - 1) / (steps.length - 1)) * 100;
    progressLine.style.width = `${progressPercent}%`;

    // Insumos
    const insumosList = document.getElementById('insumos-list');
    insumosList.innerHTML = '';
    insumos.forEach(item => {
        const li = document.createElement('li');
        li.className = 'semaforo-item';
        li.innerHTML = `
            <div class="semaforo-left">
                <div class="dot ${item.status}"></div>
                <span class="item-name">${item.nome}</span>
            </div>
            ${item.extra ? `<span class="item-details">${item.extra}</span>` : ''}
        `;
        insumosList.appendChild(li);
    });

    // Chart & Etapa Info
    const currentEtapa = etapas[activeIndex - 1];
    document.getElementById('etapa-label').innerText = currentEtapa.nome;
    document.getElementById('etapa-data').innerText = currentEtapa.data || '-';
    updateChart();

    // Risks Table
    const riskTable = document.getElementById('risk-table-body');
    riskTable.innerHTML = '';
    riscos.forEach(risk => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span style="color: var(--accent-danger)">●</span> ${risk.id}</td>
            <td>${risk.cliente}</td>
            <td>${risk.etapa}</td>
            <td>
                ${risk.insumos.map(i => `<div style="font-size: 0.7rem;"><span style="color: var(--accent-warning)">●</span> ${i}</div>`).join('')}
            </td>
            <td style="color: var(--accent-danger)">${risk.prazo}</td>
        `;
        riskTable.appendChild(tr);
    });
}

function updateChart() {
    const ctx = document.getElementById('stageChart').getContext('2d');
    
    // Clear previous chart if exists
    if (window.myChart) window.myChart.destroy();

    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Média da Fábrica', 'Este Pedido'],
            datasets: [{
                data: [1.2, 3], // Mocked days
                backgroundColor: ['#1a1a1a', '#dc3545'],
                borderRadius: 5,
                barThickness: 30
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#6c757d' } },
                y: { grid: { display: false }, ticks: { color: '#1a1a1a', font: { weight: 'bold' } } }
            }
        }
    });

    document.getElementById('chart-alert').style.display = 'flex';
    document.getElementById('delay-days').innerText = '1.8';
}

// Supabase Logic (To be implemented when keys are provided)
async function fetchFromSupabase() {
    if (!supabase) return;

    try {
        const { data: orders, error } = await supabase
            .from('pedidos')
            .select('*')
            .limit(1)
            .single();

        if (error) throw error;
        
        // This is where real data mapping would happen
        console.log("Data from Supabase:", orders);
    } catch (err) {
        console.error("Supabase Error:", err.message);
    }
}

// Event Listeners
document.getElementById('btn-admin').onclick = () => {
    alert("Para vincular o Supabase:\n1. Adicione as chaves no topo do app.js\n2. Execute o init.sql no seu painel do Supabase.");
};

// Init
window.onload = () => {
    updateDashboard();
    fetchFromSupabase();
};

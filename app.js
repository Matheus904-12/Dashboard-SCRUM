// State Management
const state = {
    team: JSON.parse(localStorage.getItem('scrum_team')) || [
        { id: 1, name: 'Você (PO)', role: 'PO' },
        { id: 2, name: 'Gerente Operacional', role: 'Manager' },
        { id: 3, name: 'Dev Alpha', role: 'Dev' },
        { id: 4, name: 'Dev Beta', role: 'Dev' },
        { id: 5, name: 'Dev Gamma', role: 'Dev' }
    ],
    demands: JSON.parse(localStorage.getItem('scrum_demands')) || [],
    metrics: JSON.parse(localStorage.getItem('scrum_metrics')) || {
        sales: 45250.75,
        inventory: 88,
        logistics: 142,
        simulation: true
    }
};

// Initialize Charts
let salesChart, inventoryChart;

function initCharts() {
    const ctxSales = document.getElementById('salesChart').getContext('2d');
    salesChart = new Chart(ctxSales, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
            datasets: [{
                label: 'Vendas (R$)',
                data: [12000, 19000, 15000, 25000, 22000, 30000],
                borderColor: '#00f2ff',
                backgroundColor: 'rgba(0, 242, 255, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'Logística (Envios)',
                data: [50, 80, 70, 120, 110, 150],
                borderColor: '#7000ff',
                backgroundColor: 'rgba(112, 0, 255, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#b0b0b0' } },
                x: { grid: { display: false }, ticks: { color: '#b0b0b0' } }
            }
        }
    });

    const ctxInv = document.getElementById('inventoryChart').getContext('2d');
    inventoryChart = new Chart(ctxInv, {
        type: 'doughnut',
        data: {
            labels: ['Em Estoque', 'Em Trânsito', 'Crítico'],
            datasets: [{
                data: [70, 20, 10],
                backgroundColor: ['#00ff88', '#00f2ff', '#ff4d4d'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { color: '#fff' } } }
        }
    });
}

// Update UI
function updateUI() {
    // Update KPIs
    document.getElementById('kpi-sales').innerText = `R$ ${state.metrics.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('kpi-inventory').innerText = `${state.metrics.inventory}%`;
    document.getElementById('kpi-logistics').innerText = state.metrics.logistics;

    // Update Team List
    const teamList = document.getElementById('team-list');
    teamList.innerHTML = '';
    state.team.forEach(member => {
        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
            <div class="item-info">
                <h4>${member.name}</h4>
                <p>Membro do Time Scrum</p>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span class="badge badge-${member.role.toLowerCase()}">${member.role}</span>
                <button class="btn-icon btn-delete" onclick="deleteMember(${member.id})">🗑️</button>
            </div>
        `;
        teamList.appendChild(div);
    });

    // Update Demand List
    const demandList = document.getElementById('demand-list');
    demandList.innerHTML = '';
    [...state.demands].reverse().forEach(demand => {
        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
            <div class="item-info">
                <h4>${demand.title} ${demand.completed ? '✅' : ''}</h4>
                <p>Prioridade: <span class="status-${demand.priority.toLowerCase()}">${demand.priority}</span></p>
            </div>
            <div class="item-actions">
                <button class="btn-icon btn-complete" onclick="toggleDemand(${demand.id})">${demand.completed ? '↩️' : '✔️'}</button>
                <button class="btn-icon btn-delete" onclick="deleteDemand(${demand.id})">🗑️</button>
            </div>
        `;
        demandList.appendChild(div);
    });
}

// Actions
window.deleteMember = (id) => {
    state.team = state.team.filter(m => m.id !== id);
    localStorage.setItem('scrum_team', JSON.stringify(state.team));
    updateUI();
};

window.deleteDemand = (id) => {
    state.demands = state.demands.filter(d => d.id !== id);
    localStorage.setItem('scrum_demands', JSON.stringify(state.demands));
    updateUI();
};

window.toggleDemand = (id) => {
    const demand = state.demands.find(d => d.id === id);
    if (demand) demand.completed = !demand.completed;
    localStorage.setItem('scrum_demands', JSON.stringify(state.demands));
    updateUI();
};

// Real-time Simulation
function simulateRealTime() {
    setInterval(() => {
        if (!state.metrics.simulation) return;

        // Randomly fluctuate sales
        state.metrics.sales += (Math.random() * 100);
        state.metrics.logistics += Math.random() > 0.7 ? 1 : 0;
        
        // Update KPIs on UI
        document.getElementById('kpi-sales').innerText = `R$ ${state.metrics.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        document.getElementById('kpi-logistics').innerText = state.metrics.logistics;

        // Update Charts (last point)
        if (salesChart) {
            const lastIndex = salesChart.data.datasets[0].data.length - 1;
            salesChart.data.datasets[0].data[lastIndex] += Math.random() * 50;
            salesChart.update('none');
        }
    }, 3000);

    setInterval(() => {
        const now = new Date();
        document.getElementById('current-time').innerText = now.toLocaleTimeString('pt-BR');
    }, 1000);
}

// Event Listeners
document.getElementById('team-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('member-name').value;
    const role = document.getElementById('member-role').value;
    
    state.team.push({ id: Date.now(), name, role });
    localStorage.setItem('scrum_team', JSON.stringify(state.team));
    updateUI();
    e.target.reset();
});

document.getElementById('demand-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('demand-title').value;
    const priority = document.getElementById('demand-priority').value;
    
    state.demands.push({ id: Date.now(), title, priority, completed: false });
    localStorage.setItem('scrum_demands', JSON.stringify(state.demands));
    updateUI();
    e.target.reset();
});

// Modal Logic
const modal = document.getElementById('config-modal');
const btnConfig = document.getElementById('btn-config');
const btnClose = document.getElementById('close-modal');

btnConfig.onclick = () => {
    document.getElementById('input-sales').value = state.metrics.sales.toFixed(2);
    document.getElementById('input-inventory').value = state.metrics.inventory;
    document.getElementById('input-logistics').value = state.metrics.logistics;
    document.getElementById('toggle-sim').checked = state.metrics.simulation;
    modal.style.display = 'flex';
};

btnClose.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

document.getElementById('config-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.metrics.sales = parseFloat(document.getElementById('input-sales').value);
    state.metrics.inventory = parseInt(document.getElementById('input-inventory').value);
    state.metrics.logistics = parseInt(document.getElementById('input-logistics').value);
    state.metrics.simulation = document.getElementById('toggle-sim').checked;
    
    localStorage.setItem('scrum_metrics', JSON.stringify(state.metrics));
    updateUI();
    modal.style.display = 'none';
});

// Init
window.onload = () => {
    initCharts();
    updateUI();
    simulateRealTime();
};

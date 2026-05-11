-- Tabela de Pedidos (Estrutura InovaMold)
DROP TABLE IF EXISTS insumos;
DROP TABLE IF EXISTS etapas_pedido;
DROP TABLE IF EXISTS pedidos;

CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    lote VARCHAR(50),
    cliente VARCHAR(255) NOT NULL,
    valor DECIMAL(12, 2) NOT NULL,
    prazo DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'No Prazo',
    etapa_atual_index INTEGER DEFAULT 1, -- 1 a 8
    data_entrada_etapa TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    transportadora VARCHAR(100),
    codigo_rastreio VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Insumos (Semáforo)
CREATE TABLE insumos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    nome_insumo VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'green', -- green, yellow, red
    detalhes VARCHAR(255)
);

-- Dados de Exemplo
INSERT INTO pedidos (numero_pedido, lote, cliente, valor, prazo, etapa_atual_index)
VALUES ('IM-2026-001', 'POL-PVC-442', 'Indústria Plástica Sul', 125400.00, '2026-05-20', 3);

INSERT INTO insumos (pedido_id, nome_insumo, status, detalhes) VALUES
(1, 'Polímero PVC-S', 'green', NULL),
(1, 'Aditivo Estabilizante', 'yellow', 'Reposição em 1 dia'),
(1, 'Pigmento Preto', 'green', NULL);

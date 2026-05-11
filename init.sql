-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    lote VARCHAR(50),
    cliente VARCHAR(255) NOT NULL,
    valor DECIMAL(12, 2) NOT NULL,
    prazo DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'No Prazo',
    etapa_atual VARCHAR(100) DEFAULT 'Criado no Comercial',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Etapas do Pedido (Rastreabilidade)
CREATE TABLE IF NOT EXISTS etapas_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    nome_etapa VARCHAR(100) NOT NULL,
    data_conclusao DATE,
    ordem INTEGER NOT NULL,
    UNIQUE(pedido_id, nome_etapa)
);

-- Tabela de Insumos (Semáforo)
CREATE TABLE IF NOT EXISTS insumos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    nome_insumo VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'green', -- green, yellow, red
    detalhes VARCHAR(255)
);

-- Inserção de dados iniciais para demonstração (Exemplo fiel à imagem)
INSERT INTO pedidos (numero_pedido, lote, cliente, valor, prazo, status, etapa_atual)
VALUES ('PED-2024-001', 'LOTE-A-2024-045', 'Confecções Silva Ltda', 45800.00, '2026-05-15', 'No Prazo', 'Separação Expedição');

-- Etapas para o pedido acima
INSERT INTO etapas_pedido (pedido_id, nome_etapa, data_conclusao, ordem) VALUES
(1, 'Criado no Comercial', '2026-04-10', 1),
(1, 'OP Gerada no PCP', '2026-04-11', 2),
(1, 'Início Produção', '2026-04-15', 3),
(1, 'Fim Produção', '2026-04-28', 4),
(1, 'Entrada no Estoque', '2026-04-29', 5),
(1, 'Separação Expedição', '2026-05-04', 6),
(1, 'Faturado', NULL, 7),
(1, 'Enviado', NULL, 8);

-- Insumos para o pedido acima
INSERT INTO insumos (pedido_id, nome_insumo, status, detalhes) VALUES
(1, 'Tecido 100% Algodão', 'green', NULL),
(1, 'Aviamento Botões', 'green', NULL),
(1, 'Linha de Costura', 'yellow', 'Reposição em 2 dias'),
(1, 'Etiquetas', 'green', NULL);

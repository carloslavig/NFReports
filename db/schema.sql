-- ============================================================
-- Sistema de Controle de Serviços e Relatórios
-- Schema do banco de dados (PostgreSQL)
-- ============================================================

CREATE TABLE IF NOT EXISTS colaboradores (
    id              SERIAL PRIMARY KEY,
    nome            VARCHAR(150) NOT NULL,
    cargo           VARCHAR(100),
    data_cadastro   DATE NOT NULL DEFAULT CURRENT_DATE,
    status          VARCHAR(10) NOT NULL DEFAULT 'Ativo'
                    CHECK (status IN ('Ativo', 'Inativo'))
);

CREATE TABLE IF NOT EXISTS servicos (
    id              SERIAL PRIMARY KEY,
    tipo            VARCHAR(20) NOT NULL
                    CHECK (tipo IN ('instalacao', 'manutencao', 'retencao', 'retirada', 'posvenda')),
    cliente_id       VARCHAR(50) NOT NULL,
    cliente_nome     VARCHAR(150) NOT NULL,
    motivo           TEXT,            -- usado em manutenção / retenção / retirada
    observacoes      TEXT,            -- usado em pós-venda
    data_servico     DATE NOT NULL,
    colaborador_id   INTEGER NOT NULL REFERENCES colaboradores(id) ON DELETE RESTRICT,
    criado_em        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_servicos_tipo ON servicos(tipo);
CREATE INDEX IF NOT EXISTS idx_servicos_data ON servicos(data_servico);
CREATE INDEX IF NOT EXISTS idx_servicos_colaborador ON servicos(colaborador_id);

-- ============================================================
-- Dados de exemplo (opcional - remova em produção)
-- ============================================================
INSERT INTO colaboradores (nome, cargo, status) VALUES
    ('Getúlio', 'Técnico de Manutenção', 'Ativo'),
    ('Wender', 'Técnico de Manutenção', 'Ativo'),
    ('Marcos', 'Técnico de Campo', 'Ativo'),
    ('Hércules', 'Técnico de Campo', 'Ativo'),
    ('Carlos', 'Pós-Venda / Retenção', 'Ativo')
ON CONFLICT DO NOTHING;


-- SCRIPT DE PREPARAÇÃO DO BANCO SGR-VIAS ATUALIZADO

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    zonal TEXT NOT NULL,
    registration_number TEXT,
    email TEXT,
    password TEXT DEFAULT '123456',
    position TEXT, -- Cargo (ex: Engenheiro, Técnico)
    function TEXT, -- Função (ex: Fiscal, Gestor)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. DESABILITAR RLS (Para este ambiente de prototipagem)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. INSERIR USUÁRIOS MESTRE
INSERT INTO users (id, name, role, zonal, registration_number, email, password, position, function)
VALUES 
('root_master_id', 'claudioasousa', 'Admin', 'Zonal Norte', 'ROOT-001', 'claudio@sgrvias.gov.br', 'cas661010', 'Engenheiro Civil', 'Administrador Root')
ON CONFLICT (id) DO UPDATE SET password = 'cas661010', role = 'Admin';

INSERT INTO users (id, name, role, zonal, registration_number, email, password, position, function)
VALUES 
('admin_manual_id', 'admin', 'Admin', 'Zonal Norte', 'ADMIN-001', 'admin@sgrvias.gov.br', 'admin', 'Gestor de TI', 'Administrador de Sistema')
ON CONFLICT (id) DO UPDATE SET password = 'admin';

-- 4. TABELA DE ZONAIS
CREATE TABLE IF NOT EXISTS zonals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    assistant_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA DE VISTORIAS
CREATE TABLE IF NOT EXISTS repair_requests (
    id TEXT PRIMARY KEY,
    protocol TEXT NOT NULL,
    sei_number TEXT NOT NULL,
    contract TEXT NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    visit_date DATE NOT NULL,
    status TEXT NOT NULL,
    technician_id TEXT REFERENCES users(id),
    zonal TEXT NOT NULL,
    photo_before TEXT,
    photo_after TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA DE AUDITORIA
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT,
    user_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

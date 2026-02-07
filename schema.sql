
-- SCRIPT DE PREPARAÇÃO DO BANCO SGR-VIAS ATUALIZADO

-- 1. CRIAÇÃO DA TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    zonal TEXT NOT NULL,
    registration_number TEXT,
    email TEXT,
    password TEXT DEFAULT '123456',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. GARANTIR COLUNAS DE CARGO E FUNÇÃO
ALTER TABLE users ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS function TEXT;

-- 3. TABELA DE ZONAIS
CREATE TABLE IF NOT EXISTS zonals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    assistant_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE VISTORIAS
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

-- 5. TABELA DE AUDITORIA (CORREÇÃO DE PERMISSÕES)
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

-- 6. DESABILITAR RLS EM TODAS AS TABELAS PARA PROTOTIPAGEM
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE zonals DISABLE ROW LEVEL SECURITY;
ALTER TABLE repair_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- 7. INSERIR USUÁRIOS MESTRE
INSERT INTO users (id, name, role, zonal, registration_number, email, password, position, function)
VALUES 
('root_master_id', 'claudioasousa', 'Admin', 'Zonal Norte', 'ROOT-001', 'claudio@sgrvias.gov.br', 'cas661010', 'Engenheiro Civil', 'Administrador Root')
ON CONFLICT (id) DO UPDATE SET 
    password = EXCLUDED.password, 
    role = EXCLUDED.role,
    position = EXCLUDED.position,
    function = EXCLUDED.function;

INSERT INTO users (id, name, role, zonal, registration_number, email, password, position, function)
VALUES 
('admin_manual_id', 'admin', 'Admin', 'Zonal Norte', 'ADMIN-001', 'admin@sgrvias.gov.br', 'admin', 'Gestor de TI', 'Administrador de Sistema')
ON CONFLICT (id) DO UPDATE SET 
    password = EXCLUDED.password,
    position = EXCLUDED.position,
    function = EXCLUDED.function;

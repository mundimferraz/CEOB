
-- ==========================================
-- SGR-VIAS: SCRIPT DE ESTRUTURA COMPLETO
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- 1. LIMPEZA (OPCIONAL - CUIDADO: APAGA DADOS EXISTENTES)
-- DROP TABLE IF EXISTS repair_requests;
-- DROP TABLE IF EXISTS zonals;
-- DROP TABLE IF EXISTS users;

-- 2. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- Admin, Editor, Operator, Viewer, Restricted
    zonal TEXT NOT NULL,
    registration_number TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE ZONAIS (UNIDADES REGIONAIS)
CREATE TABLE IF NOT EXISTS zonals (
    id TEXT PRIMARY KEY, -- Zonal Norte, Zonal Sul, etc
    name TEXT NOT NULL,
    manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    assistant_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE VISTORIAS (REPAROS)
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
    status TEXT NOT NULL, -- Aberta, Em andamento, Concluída, Cancelada
    technician_id TEXT REFERENCES users(id),
    zonal TEXT NOT NULL,
    photo_before TEXT, -- Armazena Base64 ou URL
    photo_after TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. POLÍTICAS DE ACESSO (RLS - OPCIONAL)
-- Para simplificar em ambiente de desenvolvimento, desabilite o RLS ou crie uma política de acesso total:
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonals ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso Total" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total" ON zonals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total" ON repair_requests FOR ALL USING (true) WITH CHECK (true);

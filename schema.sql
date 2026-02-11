
-- SCRIPT DE ATUALIZAÇÃO SGR-VIAS

-- 1. GARANTIR QUE A TABELA DE ROTEIROS EXISTA
CREATE TABLE IF NOT EXISTS visit_routes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    technician_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    request_ids TEXT[] NOT NULL,
    status TEXT DEFAULT 'Pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. COMANDO CRÍTICO: ADICIONAR COLUNA DE GEOLOCALIZAÇÃO SE NÃO EXISTIR
-- Execute este bloco no SQL Editor do Supabase para corrigir o erro PGRST204
ALTER TABLE visit_routes ADD COLUMN IF NOT EXISTS start_location JSONB;

-- 3. OUTRAS TABELAS (GARANTIA DE INTEGRIDADE)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    zonal TEXT NOT NULL,
    registration_number TEXT,
    email TEXT,
    password TEXT DEFAULT '123456',
    position TEXT,
    function TEXT,
    last_active_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS zonals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    assistant_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- DESABILITAR RLS PARA FACILITAR OPERAÇÃO EM CAMPO
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE zonals DISABLE ROW LEVEL SECURITY;
ALTER TABLE repair_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE visit_routes DISABLE ROW LEVEL SECURITY;

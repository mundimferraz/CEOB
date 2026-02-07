
-- 1. ADICIONAR COLUNA DE SENHA SE NÃO EXISTIR
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- 2. LIMPAR USUÁRIOS ANTIGOS PARA EVITAR CONFLITOS (OPCIONAL EM PROD)
DELETE FROM users WHERE id IN ('admin_root', 'user_standard', 'guest_viewer');

-- 3. INSERIR USUÁRIOS PADRÃO
INSERT INTO users (id, name, role, zonal, registration_number, email, password)
VALUES 
('admin_root', 'Administrador Root', 'Admin', 'Zonal Norte', 'ROOT-001', 'admin@sgrvias.gov.br', 'admin'),
('user_standard', 'Operador de Campo', 'Operator', 'Zonal Sul', 'TECH-002', 'user@sgrvias.gov.br', 'user'),
('guest_viewer', 'Visitante Auditor', 'Viewer', 'Zonal Leste', 'GUEST-003', 'guest@sgrvias.gov.br', 'guest');

-- ... (mantenha o restante das tabelas de auditoria e vistorias conforme arquivos anteriores)

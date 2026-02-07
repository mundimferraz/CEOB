
-- ... (mantenha o conteúdo anterior)

-- 6. TABELA DE AUDITORIA (LOGS)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL, -- CREATE, UPDATE, DELETE
    entity_type TEXT NOT NULL, -- REQUEST, USER, ZONAL
    entity_id TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso Total Auditoria" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

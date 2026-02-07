
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../App';
import { AuditLog, AuditAction, AuditEntity } from '../types';
import { dbApi } from '../services/api';
import { History, Search, Filter, Calendar, ShieldCheck, User as UserIcon, AlertCircle, FileText, ChevronRight, Loader2, RotateCw, Database } from 'lucide-react';

const AuditLogPage: React.FC = () => {
  const { canDo, notify } = useApp();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await dbApi.getAuditLogs();
      setLogs(data);
    } catch (error) {
      notify("Erro ao carregar trilha de auditoria", "error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (canDo('view_audit')) {
      fetchLogs();
    }
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [logs, searchTerm, actionFilter]);

  if (!canDo('view_audit')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center bg-white m-4 md:m-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 border border-rose-100">
           <AlertCircle size={48} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Acesso Negado</h1>
        <p className="text-slate-500 max-w-sm font-medium">Você não possui nível de acesso <strong>Administrador Central</strong> para visualizar os logs de auditoria.</p>
      </div>
    );
  }

  const getActionColor = (action: AuditAction) => {
    switch (action) {
      case AuditAction.CREATE: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case AuditAction.UPDATE: return 'bg-blue-50 text-blue-700 border-blue-100';
      case AuditAction.DELETE: return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck size={18} className="text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Módulo de Segurança e Auditoria</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Trilha de Rastreabilidade</h1>
          <p className="text-slate-500 font-medium">Registro imutável de todas as modificações no sistema.</p>
        </div>
        
        <button 
          onClick={() => { setIsRefreshing(true); fetchLogs(); }}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 h-12 px-6 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RotateCw size={18} className={isRefreshing ? "animate-spin" : ""} />
          Sincronizar Logs
        </button>
      </header>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por operador, ID ou detalhes..." 
            className="w-full h-12 pl-12 pr-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-medium text-sm transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="h-12 px-4 bg-slate-50 border-none rounded-xl outline-none font-bold text-slate-700 text-xs uppercase tracking-widest"
          >
            <option value="all">Todas as Ações</option>
            {Object.values(AuditAction).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
           <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recuperando registros históricos...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div key={log.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-blue-200 transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner border ${getActionColor(log.action)}`}>
                       <Database size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-widest ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          ID: {log.id.slice(0, 8)}...
                        </span>
                      </div>
                      <h3 className="font-black text-slate-900 leading-tight">
                        {log.entity_type} {log.action === AuditAction.DELETE ? 'Removido' : log.action === AuditAction.CREATE ? 'Cadastrado' : 'Editado'}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                         <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                           <UserIcon size={12} className="text-blue-500" />
                           {log.user_name}
                         </div>
                         <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                           <Calendar size={12} />
                           {new Date(log.created_at).toLocaleString('pt-BR')}
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 md:max-w-xs bg-slate-50 p-4 rounded-2xl border border-slate-100 overflow-hidden">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                       <FileText size={10} />
                       Metadados da Ação
                     </p>
                     <div className="text-[10px] font-mono text-slate-600 truncate bg-white p-2 rounded-lg border border-slate-100 shadow-inner">
                        {JSON.stringify(log.details)}
                     </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
               <History size={48} className="mx-auto text-slate-200 mb-4" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum log encontrado para os filtros atuais</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;

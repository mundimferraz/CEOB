
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../App';
import { AuditLog, AuditAction, AuditEntity } from '../types';
import { dbApi } from '../services/api';
import { 
  History, Search, Filter, Calendar, ShieldCheck, User as UserIcon, 
  AlertCircle, FileText, ChevronRight, Loader2, RotateCw, Database, 
  X, Eye, Terminal, Fingerprint, Clock, ExternalLink, UserCheck, SearchCode,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AuditLogPage: React.FC = () => {
  const { canDo, notify, isAdmin } = useApp();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estado para o modal de detalhes
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

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
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const name = log.user_name || '';
      const entityId = log.entity_id || '';
      const detailsStr = JSON.stringify(log.details || {}).toLowerCase();

      const matchesSearch = 
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detailsStr.includes(searchTerm.toLowerCase());
      
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [logs, searchTerm, actionFilter]);

  const navigateToEntity = (e: React.MouseEvent, log: AuditLog) => {
    e.preventDefault();
    e.stopPropagation();

    if (!log.entity_id && log.entity_type !== AuditEntity.ROUTE) {
      notify("ID da entidade não disponível para navegação.", "error");
      return;
    }

    // Redirecionamento baseado no tipo de entidade
    switch (log.entity_type) {
      case AuditEntity.REQUEST:
        navigate(`/requests/${log.entity_id}`);
        break;
      case AuditEntity.USER:
        navigate(`/org?tab=personnel`);
        break;
      case AuditEntity.ZONAL:
        navigate(`/org?tab=zonals`);
        break;
      case AuditEntity.ROUTE:
        navigate(`/routes`);
        break;
      default:
        notify("Destino de navegação não mapeado para este tipo de log.", "info");
    }
    setSelectedLog(null);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center bg-white m-4 md:m-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 border border-rose-100">
           <ShieldAlert size={48} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Acesso Negado</h1>
        <p className="text-slate-500 max-w-sm mb-8 font-medium">Você não possui privilégios administrativos para visualizar a trilha de auditoria do sistema.</p>
        <button onClick={() => navigate('/')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Voltar ao Painel</button>
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
    <div className="p-4 md:p-8 space-y-8 pb-24 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck size={18} className="text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Módulo de Segurança e Auditoria</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Trilha de Rastreabilidade</h1>
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
              <div 
                key={log.id} 
                onClick={() => setSelectedLog(log)}
                className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-xl transition-all group cursor-pointer active:scale-[0.99] relative overflow-hidden"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner border ${getActionColor(log.action as AuditAction)}`}>
                       <Database size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-widest ${getActionColor(log.action as AuditAction)}`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          ID: {String(log.id).slice(0, 8)}...
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

                  <div className="flex items-center gap-2">
                    <div className="hidden md:block flex-1 max-w-[180px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 overflow-hidden">
                      <div className="text-[9px] font-mono text-slate-500 truncate">
                          {JSON.stringify(log.details)}
                      </div>
                    </div>
                    
                    {/* Botões de Ação na Lista */}
                    <div className="flex gap-2">
                      {log.action !== AuditAction.DELETE && (
                        <button 
                          onClick={(e) => navigateToEntity(e, log)}
                          className="p-3 bg-blue-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-blue-700 flex items-center gap-2"
                          title="Acessar Registro"
                        >
                          <ExternalLink size={16} />
                          <span className="text-[10px] font-black uppercase hidden lg:block">Ficha</span>
                        </button>
                      )}
                      <div className="p-3 bg-slate-900 text-white rounded-xl group-hover:bg-slate-800 transition-all shadow-lg">
                        <Eye size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
               <History size={48} className="mx-auto text-slate-200 mb-4" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum log encontrado para os filtros atuais</p>
               <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase">Realize uma ação para gerar logs de conformidade.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE INSPEÇÃO */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className={`p-8 border-b flex justify-between items-center ${getActionColor(selectedLog.action as AuditAction)} bg-opacity-10`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl border ${getActionColor(selectedLog.action as AuditAction)}`}>
                   <Fingerprint size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Inspeção de Auditoria</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">REGISTRO #{selectedLog.id}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)} 
                className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <UserCheck size={14} className="text-blue-600" />
                       Executor
                    </p>
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg">
                          {selectedLog.user_name?.charAt(0)}
                       </div>
                       <div>
                          <p className="font-black text-slate-900 uppercase tracking-tight">{selectedLog.user_name}</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Clock size={14} className="text-emerald-600" />
                       Cronologia
                    </p>
                    <div className="space-y-1">
                       <p className="text-2xl font-black text-emerald-600 tracking-tighter">
                         {new Date(selectedLog.created_at).toLocaleTimeString('pt-BR')}
                       </p>
                       <p className="font-black text-slate-900 uppercase tracking-tight text-[10px]">
                         {new Date(selectedLog.created_at).toLocaleDateString('pt-BR')}
                       </p>
                    </div>
                 </div>
              </div>

              <div className="space-y-3">
                 <div className="flex items-center justify-between px-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Terminal size={14} className="text-slate-900" />
                     Dados Técnicos (JSON)
                   </p>
                 </div>
                 <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl overflow-x-auto">
                    <pre className="text-[11px] font-mono text-emerald-400 leading-relaxed">
                       {JSON.stringify(selectedLog.details, null, 3)}
                    </pre>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;


import React from 'react';
import { useApp } from '../App';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Route as RouteIcon, MapPinned, User as UserIcon, Calendar, 
  ChevronRight, Plus, Trash2, MapPin, ListChecks, 
  ShieldCheck, ArrowRight, ClipboardCheck
} from 'lucide-react';

const RouteListPage: React.FC = () => {
  const { routes, users, requests, deleteRoute, notify, canDo } = useApp();
  const navigate = useNavigate();

  const getTechnicianName = (id: string) => users.find(u => u.id === id)?.name || 'Técnico Não Identificado';

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Deseja remover o roteiro "${name}"?`)) {
      await deleteRoute(id);
      notify("Roteiro removido.");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <MapPinned size={18} className="text-blue-600" />
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Logística Operacional de Campo</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Roteiro de Visitas</h1>
          <p className="text-slate-500 font-medium">Gestão de itinerários e produtividade das equipes.</p>
        </div>
        
        {canDo('manage_routes') && (
          <Link 
            to="/routes/planner"
            className="flex items-center justify-center gap-3 px-8 h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Plus size={18} />
            Novo Roteiro
          </Link>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.length > 0 ? (
          routes.map(route => {
            const techName = getTechnicianName(route.technicianId);
            const pointsCount = route.requestIds.length;
            
            return (
              <div key={route.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-400 transition-all">
                {/* Header do Card com destaque para o Técnico */}
                <div className="p-6 bg-slate-950 text-white relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <UserIcon size={20} />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-black text-sm uppercase tracking-tight truncate">{techName}</h3>
                      <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Técnico Responsável</p>
                    </div>
                    <button 
                      onClick={() => handleDelete(route.id, route.name)}
                      className="ml-auto p-2 text-slate-500 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-end justify-between">
                     <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{route.name}</p>
                        <div className="flex items-center gap-2 text-xs font-bold">
                           <Calendar size={12} className="text-slate-500" />
                           {new Date(route.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                     </div>
                     <div className="bg-blue-600/20 px-3 py-1 rounded-full border border-blue-500/30 flex items-center gap-2">
                        <ListChecks size={12} className="text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{pointsCount} Pontos</span>
                     </div>
                  </div>
                </div>

                {/* Lista de Pontos do Roteiro */}
                <div className="p-6 flex-1 space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sequência de Vistoria</p>
                   <div className="space-y-2">
                      {route.requestIds.slice(0, 3).map((reqId, idx) => {
                        const req = requests.find(r => r.id === reqId);
                        return (
                          <div key={reqId} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                             <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-[9px]">{idx + 1}</div>
                             <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-slate-800 truncate">{req?.location.address || 'Localização Pendente'}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{req?.protocol || '---'}</p>
                             </div>
                             <ChevronRight size={12} className="text-slate-300" />
                          </div>
                        );
                      })}
                      {pointsCount > 3 && (
                        <div className="text-center pt-2">
                           <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">... e mais {pointsCount - 3} pontos</span>
                        </div>
                      )}
                   </div>
                </div>

                <div className="p-4 border-t border-slate-50 bg-slate-50/50">
                   <button className="w-full h-12 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
                      Iniciar Rota de Campo
                      <ArrowRight size={14} />
                   </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                <RouteIcon size={40} />
             </div>
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Nenhum Roteiro Planejado</h3>
             <p className="text-xs font-medium text-slate-400 uppercase max-w-xs">Organize as vistorias em lotes para otimizar os deslocamentos técnicos.</p>
             {canDo('manage_routes') && (
               <Link to="/routes/planner" className="mt-6 flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg">
                  <Plus size={14} /> Criar Primeiro Roteiro
               </Link>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteListPage;

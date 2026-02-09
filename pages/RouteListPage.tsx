
import React from 'react';
import { useApp } from '../App';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Route as RouteIcon, MapPinned, User as UserIcon, Calendar, 
  ChevronRight, Plus, Trash2, MapPin, ListChecks, 
  ShieldCheck, ArrowRight, Share2, Navigation as NavIcon
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

  const handleShareRoute = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (!route) return;

    // Coleta as coordenadas de todas as vistorias do roteiro
    const points = route.requestIds
      .map(id => requests.find(r => r.id === id))
      .filter(req => !!req)
      .map(req => `${req!.location.latitude},${req!.location.longitude}`);

    if (points.length === 0) {
        notify("Roteiro sem pontos válidos para mapeamento.", "error");
        return;
    }

    // Gerar URL do Google Maps para Direções Multi-Ponto
    // Formato: https://www.google.com/maps/dir/?api=1&destination=PONTO_FINAL&waypoints=PONTO1|PONTO2|PONTO3
    const origin = points[0];
    const destination = points[points.length - 1];
    const waypoints = points.slice(1, -1).join('|');
    
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;

    // Tentar compartilhar nativamente ou abrir link
    if (navigator.share) {
        navigator.share({
            title: `SGR-Vias: ${route.name}`,
            text: `Itinerário técnico para: ${getTechnicianName(route.technicianId)}`,
            url: googleMapsUrl
        }).catch(() => window.open(googleMapsUrl, '_blank'));
    } else {
        window.open(googleMapsUrl, '_blank');
        notify("Abrindo itinerário no Google Maps...");
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
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                           <Calendar size={12} />
                           {new Date(route.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                     </div>
                     <div className="bg-blue-600/20 px-3 py-1 rounded-full border border-blue-500/30 flex items-center gap-2">
                        <ListChecks size={12} className="text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{pointsCount} Pontos</span>
                     </div>
                  </div>
                </div>

                {/* Mini Traçado Visual (Simulado com lista) */}
                <div className="p-6 flex-1 space-y-4">
                   <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itinerário de Campo</p>
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                   </div>
                   <div className="space-y-2 relative">
                      {/* Linha vertical tracejada unindo os pontos */}
                      <div className="absolute left-[11px] top-4 bottom-4 w-0.5 border-l-2 border-dashed border-slate-100"></div>

                      {route.requestIds.slice(0, 4).map((reqId, idx) => {
                        const req = requests.find(r => r.id === reqId);
                        return (
                          <div key={reqId} className="flex items-center gap-3 relative z-10">
                             <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-900 font-black text-[8px] shadow-sm">
                                {idx + 1}
                             </div>
                             <div className="flex-1 min-w-0 bg-slate-50 p-2 rounded-xl border border-slate-100/50">
                                <p className="text-[10px] font-bold text-slate-700 truncate">{req?.location.address || 'Localização Pendente'}</p>
                             </div>
                          </div>
                        );
                      })}
                      {pointsCount > 4 && (
                        <div className="text-center pt-2">
                           <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">... e mais {pointsCount - 4} paradas</span>
                        </div>
                      )}
                   </div>
                </div>

                {/* Ações de Navegação */}
                <div className="p-4 border-t border-slate-50 bg-slate-50/50 grid grid-cols-2 gap-3">
                   <button 
                    onClick={() => handleShareRoute(route.id)}
                    className="h-12 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                   >
                      <Share2 size={14} />
                      Compartilhar
                   </button>
                   <button 
                    onClick={() => handleShareRoute(route.id)}
                    className="h-12 bg-blue-600 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                   >
                      <NavIcon size={14} />
                      Abrir Mapa
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

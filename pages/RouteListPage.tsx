
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../App';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Route as RouteIcon, MapPinned, User as UserIcon, Calendar, 
  Plus, Trash2, MapPin, ListChecks, 
  Share2, Navigation as NavIcon, X, Maximize2, Map as MapIcon, ChevronRight
} from 'lucide-react';
import { STATUS_COLORS } from '../constants';

const RouteListPage: React.FC = () => {
  const { routes, users, requests, deleteRoute, notify, canDo } = useApp();
  const navigate = useNavigate();
  const [selectedRouteForMap, setSelectedRouteForMap] = useState<string | null>(null);
  const mapRef = useRef<any>(null);

  const getTechnicianName = (id: string) => users.find(u => u.id === id)?.name || 'Profissional não designado';

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Excluir o roteiro "${name}"?`)) {
      await deleteRoute(id);
      notify("Roteiro removido.");
    }
  };

  const handleShareRoute = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (!route) return;

    const routeRequests = route.requestIds
      .map(id => requests.find(r => r.id === id))
      .filter(req => !!req);

    if (routeRequests.length < 1) {
        notify("Roteiro sem pontos válidos.", "error");
        return;
    }

    const points = routeRequests.map(req => `${req!.location.latitude},${req!.location.longitude}`);
    
    // Google Maps multi-point directions
    const origin = points[0];
    const destination = points[points.length - 1];
    const waypoints = points.slice(1, -1).join('|');
    
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;

    if (navigator.share) {
        navigator.share({
            title: `SGR-Vias Itinerário: ${route.name}`,
            text: `Traçado técnico para a equipe de ${getTechnicianName(route.technicianId)}`,
            url: googleMapsUrl
        }).catch(() => window.open(googleMapsUrl, '_blank'));
    } else {
        window.open(googleMapsUrl, '_blank');
        notify("Abrindo traçado no GPS...");
    }
  };

  // Efeito para o Mapa de Visualização de Traçado
  useEffect(() => {
    if (selectedRouteForMap) {
      const L = (window as any).L;
      if (!L) return;

      const route = routes.find(r => r.id === selectedRouteForMap);
      if (!route) return;

      const routeRequests = route.requestIds
        .map(id => requests.find(r => r.id === id))
        .filter(req => !!req);

      if (routeRequests.length === 0) return;

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.remove();
        }

        mapRef.current = L.map('route-preview-map', {
          zoomControl: false,
          attributionControl: false
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);

        const latlngs = routeRequests.map(req => [req!.location.latitude, req!.location.longitude]);
        
        // Desenha o traçado (Polyline)
        const polyline = L.polyline(latlngs, {
          color: '#2563eb',
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 10'
        }).addTo(mapRef.current);

        // Adiciona marcadores numerados
        routeRequests.forEach((req, idx) => {
          const icon = L.divIcon({
            html: `<div class="w-6 h-6 bg-blue-600 border-2 border-white rounded-full flex items-center justify-center text-white font-black text-[10px] shadow-lg">${idx + 1}</div>`,
            className: 'custom-route-marker',
            iconSize: [24, 24]
          });
          L.marker([req!.location.latitude, req!.location.longitude], { icon }).addTo(mapRef.current);
        });

        mapRef.current.fitBounds(polyline.getBounds().pad(0.3));
      }, 100);
    }
  }, [selectedRouteForMap]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <MapPinned size={18} className="text-blue-600" />
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Logística e Planejamento de Visitas</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Roteiros de Campo</h1>
          <p className="text-slate-500 font-medium">Otimização de rotas e acompanhamento de equipes.</p>
        </div>
        
        {canDo('manage_routes') && (
          <Link 
            to="/routes/planner"
            className="flex items-center justify-center gap-3 px-8 h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-blue-700 transition-all"
          >
            <Plus size={18} />
            Novo Itinerário
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
                <div className="p-6 bg-slate-950 text-white relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <UserIcon size={20} />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-black text-sm uppercase tracking-tight truncate">{techName}</h3>
                      <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Encarregado</p>
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
                        <span className="text-[10px] font-black uppercase tracking-widest">{pointsCount} Destinos</span>
                     </div>
                  </div>
                </div>

                <div className="p-6 flex-1 space-y-4">
                   <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ordem de Execução</p>
                      <button 
                        onClick={() => setSelectedRouteForMap(route.id)}
                        className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-1 hover:underline"
                      >
                         <Maximize2 size={10} /> Visualizar Traçado
                      </button>
                   </div>
                   <div className="space-y-2 relative">
                      <div className="absolute left-[11px] top-4 bottom-4 w-0.5 border-l-2 border-dashed border-slate-100"></div>

                      {route.requestIds.slice(0, 3).map((reqId, idx) => {
                        const req = requests.find(r => r.id === reqId);
                        return (
                          <div key={reqId} className="flex items-center gap-3 relative z-10">
                             <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-slate-900 font-black text-[8px] shadow-sm">
                                {idx + 1}
                             </div>
                             <div className="flex-1 min-w-0 bg-slate-50 p-2 rounded-xl border border-slate-100/50 flex items-center justify-between gap-2">
                                <p className="text-[10px] font-bold text-slate-700 truncate">{req?.location.address || 'Sem Endereço'}</p>
                                <div className={`w-2 h-2 rounded-full shrink-0 ${req?.status === 'Concluída' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                             </div>
                          </div>
                        );
                      })}
                      {pointsCount > 3 && (
                        <div className="flex items-center gap-3 ml-[7px]">
                           <div className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-200"></div>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">... e mais {pointsCount - 3} vistorias</span>
                        </div>
                      )}
                   </div>
                </div>

                <div className="p-4 border-t border-slate-50 bg-slate-50/50 grid grid-cols-2 gap-3">
                   <button 
                    onClick={() => handleShareRoute(route.id)}
                    className="h-12 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                   >
                      <Share2 size={14} />
                      Compartilhar
                   </button>
                   <button 
                    onClick={() => handleShareRoute(route.id)}
                    className="h-12 bg-blue-600 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg"
                   >
                      <NavIcon size={14} />
                      Abrir no GPS
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
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Sem Roteiros Ativos</h3>
             <p className="text-xs font-medium text-slate-400 uppercase">Selecione pontos de vistoria e crie itinerários inteligentes.</p>
          </div>
        )}
      </div>

      {/* MODAL DE VISUALIZAÇÃO DE TRAÇADO */}
      {selectedRouteForMap && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
             <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <MapIcon size={20} />
                   </div>
                   <div>
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Traçado Operativo</h2>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Visualização da Sequência de Campo</p>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedRouteForMap(null)}
                  className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-rose-500 transition-all shadow-sm"
                >
                  <X size={24} />
                </button>
             </div>
             <div className="flex-1 relative bg-slate-100">
                <div id="route-preview-map" className="absolute inset-0 z-10"></div>
                
                {/* Overlay Informativo dentro do mapa */}
                <div className="absolute bottom-6 left-6 right-6 z-20 flex flex-col md:flex-row gap-4 pointer-events-none">
                   <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-white shadow-2xl pointer-events-auto max-w-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resumo do Itinerário</p>
                      <div className="space-y-3">
                         {routes.find(r => r.id === selectedRouteForMap)?.requestIds.map((reqId, idx) => {
                            const req = requests.find(r => r.id === reqId);
                            return (
                               <div key={reqId} className="flex items-center gap-3">
                                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[8px] text-white font-black">{idx + 1}</div>
                                  <span className="text-[10px] font-bold text-slate-700 truncate">{req?.location.address}</span>
                                  <ChevronRight size={10} className="text-slate-300 ml-auto" />
                               </div>
                            );
                         })}
                      </div>
                      <button 
                        onClick={() => handleShareRoute(selectedRouteForMap)}
                        className="w-full mt-4 h-12 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg"
                      >
                         <NavIcon size={14} /> Abrir Direções no GPS
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteListPage;

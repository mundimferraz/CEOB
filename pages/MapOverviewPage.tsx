
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { RequestStatus, ZonalType } from '../types';
import { ZONALS_LIST } from '../constants';
import { Loader2, Filter, Navigation, ChevronRight, MapPin, Calendar, Search, LayoutList, ListFilter, ArrowRight } from 'lucide-react';

const MapOverviewPage: React.FC = () => {
  const { requests, getZonalName, currentUser } = useApp();
  const navigate = useNavigate();
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map()); // Armazena instâncias de marcadores para acesso externo
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedZonal, setSelectedZonal] = useState<string>('all');
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  
  const getMarkerColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.OPEN: return '#3b82f6';
      case RequestStatus.IN_PROGRESS: return '#f59e0b';
      case RequestStatus.COMPLETED: return '#10b981';
      case RequestStatus.CANCELED: return '#f43f5e';
      default: return '#94a3b8';
    }
  };

  // Vistorias filtradas e ORDENADAS (mais recentes primeiro)
  const filteredRequests = useMemo(() => {
    return requests
      .filter(req => {
        if (currentUser?.role === 'Restricted' && req.zonal !== currentUser.zonal) return false;
        if (selectedZonal !== 'all' && req.zonal !== selectedZonal) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [requests, selectedZonal, currentUser]);

  useEffect(() => {
    const L = (window as any).L;
    if (!L) return;

    if (!mapRef.current) {
      mapRef.current = L.map('global-map-container', {
        zoomControl: false,
        attributionControl: false
      }).setView([-23.5505, -46.6333], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
      
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
          setIsMapReady(true);
        }
      }, 500);
    }

    // Limpeza de marcadores existentes
    markersRef.current.forEach(marker => mapRef.current.removeLayer(marker));
    markersRef.current.clear();

    const markers: any[] = [];
    filteredRequests.forEach(req => {
      const color = getMarkerColor(req.status);
      
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="
            background-color: ${color};
            width: 28px;
            height: 28px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
          ">
            <div style="
              width: 8px;
              height: 8px;
              background: white;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      const marker = L.marker([req.location.latitude, req.location.longitude], { icon: customIcon })
        .addTo(mapRef.current);

      const popupContent = `
        <div class="p-2 min-w-[200px]">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-[8px] font-black uppercase tracking-widest text-slate-400">${req.protocol}</span>
            <span style="background-color: ${color}20; color: ${color}; border: 1px solid ${color}40;" class="px-1.5 py-0.5 rounded text-[7px] font-black uppercase">${req.status}</span>
          </div>
          ${req.photoBefore ? `<img src="${req.photoBefore}" class="w-full h-24 object-cover rounded-lg mb-2 border border-slate-100 shadow-sm" />` : ''}
          <p class="text-[10px] font-bold text-slate-900 leading-tight mb-2 line-clamp-2">${req.description}</p>
          <p class="text-[8px] text-slate-500 mb-3 flex items-start gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            ${req.location.address}
          </p>
          <button 
            onclick="window.location.hash='#/requests/${req.id}'"
            style="background-color: #0f172a; color: white; width: 100%; padding: 8px; border-radius: 8px; font-size: 9px; font-weight: 900; text-transform: uppercase; cursor: pointer; border: none;"
          >
            Abrir Ficha Técnica
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'custom-leaflet-popup',
        maxWidth: 240,
        closeButton: false
      });
      
      // Salva referência do marcador para poder abrir externamente
      markersRef.current.set(req.id, marker);
      markers.push(marker);
    });

    if (markers.length > 0 && mapRef.current && !activeRequestId) {
      const group = new L.featureGroup(markers);
      mapRef.current.fitBounds(group.getBounds().pad(0.2));
    }
  }, [filteredRequests, isMapReady]);

  // Função para focar no registro a partir da lista
  const handleFocusOnRequest = (req: any) => {
    setActiveRequestId(req.id);
    if (mapRef.current && markersRef.current.has(req.id)) {
      const marker = markersRef.current.get(req.id);
      mapRef.current.setView([req.location.latitude, req.location.longitude], 17);
      marker.openPopup();
    }
  };

  const stats = useMemo(() => ({
    total: filteredRequests.length,
    open: filteredRequests.filter(r => r.status === RequestStatus.OPEN).length,
    done: filteredRequests.filter(r => r.status === RequestStatus.COMPLETED).length
  }), [filteredRequests]);

  return (
    <div className="relative flex flex-col md:flex-row w-full h-screen bg-slate-100 overflow-hidden">
      {/* Container do Mapa */}
      <div className="relative flex-1 h-full">
        <div 
          id="global-map-container" 
          className="absolute inset-0 z-0"
          style={{ height: '100%', width: '100%' }}
        ></div>
        
        {!isMapReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-[100]">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Cartografia...</p>
          </div>
        )}

        {/* Overlay: Cabeçalho do Mapa */}
        <div className="absolute top-4 left-4 right-4 md:left-8 md:top-8 md:right-auto z-10 flex flex-col gap-4 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-white shadow-2xl pointer-events-auto max-w-sm">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Navigation size={20} />
               </div>
               <div>
                 <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">Mapa de Zeladoria</h1>
                 <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Visão Territorial em Tempo Real</p>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Total</p>
                <p className="text-lg font-black text-slate-900">{stats.total}</p>
              </div>
              <div className="bg-blue-50 p-2 rounded-xl border border-blue-100 text-center">
                <p className="text-[8px] font-black text-blue-400 uppercase tracking-tighter">Abertas</p>
                <p className="text-lg font-black text-blue-600">{stats.open}</p>
              </div>
              <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100 text-center">
                <p className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter">Finais</p>
                <p className="text-lg font-black text-emerald-600">{stats.done}</p>
              </div>
            </div>

            <div className="space-y-3">
               <label className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtrar por Unidade (Zonal)</span>
                  <div className="relative">
                    <select 
                      value={selectedZonal}
                      onChange={e => setSelectedZonal(e.target.value)}
                      className="w-full h-10 pl-4 pr-10 bg-slate-100 border-none rounded-xl text-[11px] font-bold text-slate-700 outline-none appearance-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="all">Todas as Unidades</option>
                      {ZONALS_LIST.map(z => <option key={z} value={z}>{getZonalName(z)}</option>)}
                    </select>
                    <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
               </label>
            </div>
          </div>
        </div>

        {/* Legenda Flutuante */}
        <div className="absolute bottom-8 left-8 z-10 bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-white shadow-xl pointer-events-auto hidden md:block">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                 <span className="text-[10px] font-bold text-slate-700">Abertas</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                 <span className="text-[10px] font-bold text-slate-700">Em Curso</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                 <span className="text-[10px] font-bold text-slate-700">Concluídas</span>
              </div>
           </div>
        </div>
      </div>

      {/* Barra Lateral: Lista de Vistorias (Mais Recentes) */}
      <aside className="w-full md:w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col h-1/2 md:h-full z-20 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)]">
         <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
               <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <LayoutList size={16} className="text-blue-600" />
                  Últimos Registros
               </h2>
               <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[9px] font-black">{filteredRequests.length}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Ordenados por data de inserção</p>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {filteredRequests.length > 0 ? (
               filteredRequests.map((req) => (
                  <button
                     key={req.id}
                     onClick={() => handleFocusOnRequest(req)}
                     className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 group flex gap-4 ${
                        activeRequestId === req.id 
                        ? 'bg-blue-50 border-blue-200 shadow-md ring-2 ring-blue-500/10' 
                        : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                     }`}
                  >
                     <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200 shadow-inner">
                        {req.photoBefore ? (
                           <img src={req.photoBefore} className="w-full h-full object-cover" alt="Antes" />
                        ) : (
                           <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <MapPin size={20} />
                           </div>
                        )}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-[100px]">{req.protocol}</span>
                           <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase border ${
                              req.status === RequestStatus.OPEN ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              req.status === RequestStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              'bg-amber-50 text-amber-600 border-amber-100'
                           }`}>
                              {req.status}
                           </span>
                        </div>
                        <p className="text-[11px] font-black text-slate-900 leading-tight mb-2 line-clamp-1">{req.location.address}</p>
                        <div className="flex items-center gap-3">
                           <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                              <Calendar size={10} />
                              {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                           </div>
                           <div className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[9px] font-black uppercase text-blue-600 ${activeRequestId === req.id ? 'opacity-100' : ''}`}>
                              Ver Ponto
                              <ArrowRight size={10} />
                           </div>
                        </div>
                     </div>
                  </button>
               ))
            ) : (
               <div className="py-20 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <ListFilter className="text-slate-300" size={24} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum registro para exibir</p>
               </div>
            )}
         </div>

         {/* Rodapé da Sidebar */}
         <div className="p-4 bg-slate-900 text-white">
            <button 
               onClick={() => navigate('/requests')}
               className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"
            >
               Ir para Inventário Completo
               <ChevronRight size={14} />
            </button>
         </div>
      </aside>

      <style>{`
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          border-radius: 1.5rem;
          padding: 4px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        }
        .custom-leaflet-popup .leaflet-popup-content {
          margin: 8px;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          display: none;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default MapOverviewPage;

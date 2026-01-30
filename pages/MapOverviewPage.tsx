
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { RequestStatus, ZonalType } from '../types';
import { ZONALS_LIST } from '../constants';
import { Loader2, Filter, Maximize, MapPin, Search, Navigation, Info, ChevronRight, ImageIcon } from 'lucide-react';

const MapOverviewPage: React.FC = () => {
  const { requests, getZonalName, currentUser } = useApp();
  const navigate = useNavigate();
  const mapRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedZonal, setSelectedZonal] = useState<string>('all');
  
  // Cores baseadas no status para os marcadores
  const getMarkerColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.OPEN: return '#3b82f6'; // Blue
      case RequestStatus.IN_PROGRESS: return '#f59e0b'; // Amber
      case RequestStatus.COMPLETED: return '#10b981'; // Emerald
      case RequestStatus.CANCELED: return '#f43f5e'; // Rose
      default: return '#94a3b8';
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      if (currentUser?.role === 'Restricted' && req.zonal !== currentUser.zonal) return false;
      if (selectedZonal !== 'all' && req.zonal !== selectedZonal) return false;
      return true;
    });
  }, [requests, selectedZonal, currentUser]);

  useEffect(() => {
    const L = (window as any).L;
    if (!L) return;

    if (!mapRef.current) {
      // Inicializa o mapa centralizado em SP por padrão
      mapRef.current = L.map('global-map-container', {
        zoomControl: false,
        attributionControl: false
      }).setView([-23.5505, -46.6333], 12);

      L.tileLayer('https://{s}.tile.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
      L.control.attribution({ position: 'bottomleft' }).addTo(mapRef.current);
      
      setIsMapReady(true);
    }

    // Limpa marcadores existentes antes de re-adicionar
    mapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        mapRef.current.removeLayer(layer);
      }
    });

    // Adiciona os marcadores filtrados
    const markers: any[] = [];
    filteredRequests.forEach(req => {
      const color = getMarkerColor(req.status);
      
      // Ícone customizado no Leaflet usando DivIcon para maior controle estético
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

      // Popup Estilizado
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
            style="background-color: #0f172a;"
            class="w-full py-2 rounded-lg text-white text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 hover:bg-slate-800 transition-colors"
          >
            Abrir Ficha Técnica
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'custom-leaflet-popup',
        maxWidth: 240,
        closeButton: false
      });
      
      markers.push(marker);
    });

    // Ajusta o zoom para enquadrar todos os marcadores se houver algum
    if (markers.length > 0 && mapRef.current) {
      const group = new L.featureGroup(markers);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      // Cleanup se necessário
    };
  }, [filteredRequests]);

  const stats = useMemo(() => ({
    total: filteredRequests.length,
    open: filteredRequests.filter(r => r.status === RequestStatus.OPEN).length,
    done: filteredRequests.filter(r => r.status === RequestStatus.COMPLETED).length
  }), [filteredRequests]);

  return (
    <div className="relative w-full h-screen md:h-[calc(100vh)] overflow-hidden">
      <div id="global-map-container" className="w-full h-full z-0 bg-slate-50"></div>
      
      {!isMapReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-50">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Renderizando Cartografia...</p>
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

      {/* Overlay: Legenda */}
      <div className="absolute bottom-28 md:bottom-8 left-4 md:left-8 z-10 bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-white shadow-xl pointer-events-auto">
         <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Legenda Operativa</p>
         <div className="flex flex-wrap gap-4">
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

      {/* CSS para o Popup customizado */}
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
      `}</style>
    </div>
  );
};

export default MapOverviewPage;

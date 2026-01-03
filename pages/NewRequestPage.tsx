
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, Save, Loader2, Navigation as NavigationIcon } from 'lucide-react';
import { useApp } from '../App';
import { RequestStatus, ZonalType, RepairRequest } from '../types';
import { ZONALS_LIST } from '../constants';

const NewRequestPage: React.FC = () => {
  const { addRequest, users, getZonalName, notify } = useApp();
  const navigate = useNavigate();
  
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [locating, setLocating] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  
  const [formData, setFormData] = useState({
    protocol: '',
    seiNumber: '',
    contract: '',
    description: '',
    zonal: ZonalType.NORTH,
    technicianId: '',
    visitDate: new Date().toISOString().split('T')[0],
    latitude: -23.5505, // Default SP
    longitude: -46.6333,
    address: '',
    photoBefore: ''
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Inicializa o mapa
  useEffect(() => {
    if (!mapRef.current) {
      const L = (window as any).L;
      if (!L) return;

      mapRef.current = L.map('map-container').setView([formData.latitude, formData.longitude], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);

      markerRef.current = L.marker([formData.latitude, formData.longitude], {
        draggable: true,
        autoPan: true
      }).addTo(mapRef.current);

      // Evento ao arrastar o marcador
      markerRef.current.on('dragend', (event: any) => {
        const marker = event.target;
        const position = marker.getLatLng();
        updatePosition(position.lat, position.lng);
      });

      // Evento ao clicar no mapa
      mapRef.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        markerRef.current.setLatLng([lat, lng]);
        updatePosition(lat, lng);
      });

      setIsMapReady(true);
      handleCaptureLocation(); // Tenta pegar a posição real ao iniciar
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const updatePosition = async (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    
    // Geocodificação reversa usando Nominatim (Gratuito/OSM)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { 'Accept-Language': 'pt-BR' }
      });
      const data = await response.json();
      if (data && data.display_name) {
        setFormData(prev => ({ ...prev, address: data.display_name }));
      }
    } catch (error) {
      console.error("Erro na geocodificação:", error);
    }
  };

  const handleCaptureLocation = useCallback(() => {
    setLocating(true);
    if (!navigator.geolocation) {
      notify("Geolocalização não suportada", "error");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const L = (window as any).L;
        
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([latitude, longitude], 17);
          markerRef.current.setLatLng([latitude, longitude]);
        }
        
        updatePosition(latitude, longitude);
        setLocating(false);
        notify("Posição GPS capturada!");
      },
      () => {
        notify("Erro ao obter GPS. Verifique as permissões.", "error");
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  }, [notify]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({ ...prev, photoBefore: base64 }));
        setImagePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.photoBefore) {
      notify("A foto do local é obrigatória.", "error");
      return;
    }

    const newRequest: RepairRequest = {
      id: `req_${Date.now()}`,
      protocol: formData.protocol || `PR-${Date.now().toString().slice(-6)}`,
      seiNumber: formData.seiNumber,
      contract: formData.contract,
      description: formData.description,
      location: {
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address || 'Endereço não identificado',
      },
      visitDate: formData.visitDate,
      status: RequestStatus.OPEN,
      technicianId: formData.technicianId,
      zonal: formData.zonal,
      photoBefore: formData.photoBefore,
      createdAt: new Date().toISOString(),
    };

    addRequest(newRequest);
    navigate('/requests');
  };

  const filteredPersonnel = users.filter(u => u.zonal === formData.zonal);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vistoria de Campo</h1>
        <p className="text-slate-500 font-medium">Ajuste o local exato no mapa antes de salvar.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 pb-24">
        {/* Mapa e Geolocalização */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
              Localização Exata
            </h2>
            <button 
              type="button"
              onClick={handleCaptureLocation}
              disabled={locating}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-50"
            >
              {locating ? <Loader2 size={14} className="animate-spin" /> : <NavigationIcon size={14} />}
              Recalibrar GPS
            </button>
          </div>

          <div className="relative h-72 md:h-96 w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
             <div id="map-container" className="h-full w-full"></div>
             {!isMapReady && (
               <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                 <Loader2 className="animate-spin text-slate-300" size={40} />
               </div>
             )}
          </div>

          <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                <MapPin size={20} />
             </div>
             <div>
                <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">Endereço Identificado</p>
                <p className="text-sm font-bold text-blue-900 leading-snug">
                  {formData.address || (locating ? 'Buscando endereço...' : 'Aguardando posicionamento no mapa')}
                </p>
                <p className="text-[10px] text-blue-700 font-bold mt-2 uppercase">
                  Lat: {formData.latitude.toFixed(6)} | Lng: {formData.longitude.toFixed(6)}
                </p>
             </div>
          </div>
          <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest italic">
            Dica: Arraste o pino vermelho ou clique no mapa para ajustar a posição
          </p>
        </div>

        {/* Dados Administrativos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              Protocolo & SEI
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Número SEI</label>
                <input 
                  type="text" 
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900"
                  placeholder="00.000.000/0000-00"
                  value={formData.seiNumber}
                  onChange={e => setFormData({...formData, seiNumber: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Identificador Contrato</label>
                <input 
                  type="text" 
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900"
                  placeholder="Ex: CTR-05/2023"
                  value={formData.contract}
                  onChange={e => setFormData({...formData, contract: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
               <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
               Atribuição Técnica
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Unidade Responsável</label>
                <select 
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none bg-slate-50"
                  value={formData.zonal}
                  onChange={e => setFormData({...formData, zonal: e.target.value as ZonalType, technicianId: ''})}
                >
                  {ZONALS_LIST.map(z => <option key={z} value={z}>{getZonalName(z)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Vistoriador</label>
                <select 
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none bg-slate-50"
                  value={formData.technicianId}
                  onChange={e => setFormData({...formData, technicianId: e.target.value})}
                  required
                >
                  <option value="">Selecione o técnico...</option>
                  {filteredPersonnel.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role === 'Intern' ? 'Estagiário' : 'Colaborador'})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Evidência Visual */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
           <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
             <div className="w-1.5 h-6 bg-rose-600 rounded-full"></div>
             Evidência Fotográfica (Antes)
          </h2>
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-200 border-dashed rounded-[2rem] cursor-pointer bg-slate-50 hover:bg-slate-100 overflow-hidden relative group transition-all">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform">
                   <Camera className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm text-slate-900 font-black uppercase tracking-widest">Capturar Foto do Local</p>
                <p className="text-xs text-slate-400 mt-2 font-medium">Use a câmera do dispositivo para registrar o estado da via</p>
              </div>
            )}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          </label>
          
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Observações Técnicas da Ocorrência</label>
            <textarea 
              rows={4}
              className="w-full p-5 border border-slate-200 rounded-[2rem] focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium text-slate-700 leading-relaxed"
              placeholder="Descreva aqui buracos, vazamentos, falta de sinalização ou outras anomalias observadas no local..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              required
            />
          </div>
        </div>

        {/* Ações Fixas Rodapé */}
        <div className="fixed bottom-0 left-0 right-0 md:relative p-4 md:p-0 bg-white/80 backdrop-blur-md md:bg-transparent border-t md:border-t-0 flex gap-4 z-[100] safe-bottom">
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            className="flex-1 h-16 bg-white border border-slate-200 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] text-slate-500 active:scale-95 transition-all shadow-sm"
          >
            Descartar
          </button>
          <button 
            type="submit"
            className="flex-2 md:flex-1 h-16 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 px-8"
          >
            <Save size={20} />
            Finalizar Vistoria
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewRequestPage;

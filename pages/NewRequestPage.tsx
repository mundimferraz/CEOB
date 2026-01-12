
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, Save, Loader2, Navigation as NavigationIcon, Crosshair, Check } from 'lucide-react';
import { useApp } from '../App';
import { RequestStatus, ZonalType, RepairRequest } from '../types';
import { ZONALS_LIST } from '../constants';

const NewRequestPage: React.FC = () => {
  const { addRequest, users, getZonalName, getRoleLabel, notify } = useApp();
  const navigate = useNavigate();
  
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [locating, setLocating] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
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

      markerRef.current.on('dragend', (event: any) => {
        const marker = event.target;
        const position = marker.getLatLng();
        updatePosition(position.lat, position.lng);
      });

      mapRef.current.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        markerRef.current.setLatLng([lat, lng]);
        updatePosition(lat, lng);
      });

      setIsMapReady(true);
      handleCaptureLocation();
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
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([latitude, longitude], 17);
          markerRef.current.setLatLng([latitude, longitude]);
        }
        updatePosition(latitude, longitude);
        setLocating(false);
        notify("GPS capturado!");
      },
      () => {
        notify("Erro ao obter GPS.", "error");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.photoBefore) {
      notify("A foto do local é obrigatória.", "error");
      return;
    }

    setIsSaving(true);
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

    try {
      await addRequest(newRequest);
      setIsSaving(false);
      setIsSaved(true);
      
      // Atraso discreto para exibir o checkmark antes de navegar
      setTimeout(() => {
        navigate('/requests');
      }, 1000);
    } catch (error) {
      setIsSaving(false);
    }
  };

  const filteredPersonnel = users.filter(u => u.zonal === formData.zonal);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vistoria de Campo</h1>
        <p className="text-slate-500 font-medium tracking-tight">Georreferenciamento e registro de demanda técnica.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 pb-24">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
              Mapa de Georreferenciamento
            </h2>
            <button 
              type="button"
              onClick={handleCaptureLocation}
              disabled={locating || isSaving || isSaved}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 flex items-start gap-4 shadow-xl">
               <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                  <Crosshair size={20} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Coordenadas GPS</p>
                  <p className="text-sm font-bold text-white tracking-wider leading-none">
                    {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </p>
                  <p className="text-[9px] text-slate-500 font-bold mt-2 uppercase">WGS84 / Geodésico</p>
               </div>
            </div>

            <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                  <MapPin size={20} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Endereço Logradouro</p>
                  <p className="text-sm font-bold text-blue-900 leading-snug">
                    {formData.address || (locating ? 'Identificando...' : 'Arraste o pino no mapa')}
                  </p>
               </div>
            </div>
          </div>
          
          <p className="text-[9px] text-slate-400 font-bold text-center uppercase tracking-[0.2em] italic mt-2">
            Importante: O marcador deve estar posicionado sobre o ponto exato da ocorrência
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              Identificação Administrativa
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Número do Processo SEI</label>
                <input 
                  type="text" 
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900"
                  placeholder="00.000.000/0000-00"
                  value={formData.seiNumber}
                  onChange={e => setFormData({...formData, seiNumber: e.target.value})}
                  required
                  disabled={isSaving || isSaved}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Número do Contrato</label>
                <input 
                  type="text" 
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900"
                  placeholder="Ex: CTR-05/2023"
                  value={formData.contract}
                  onChange={e => setFormData({...formData, contract: e.target.value})}
                  required
                  disabled={isSaving || isSaved}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
               <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
               Atribuição da Equipe
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Unidade Executora (Zonal)</label>
                <select 
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none bg-slate-50"
                  value={formData.zonal}
                  onChange={e => setFormData({...formData, zonal: e.target.value as ZonalType, technicianId: ''})}
                  disabled={isSaving || isSaved}
                >
                  {ZONALS_LIST.map(z => <option key={z} value={z}>{getZonalName(z)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Técnico Responsável</label>
                <select 
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none bg-slate-50"
                  value={formData.technicianId}
                  onChange={e => setFormData({...formData, technicianId: e.target.value})}
                  required
                  disabled={isSaving || isSaved}
                >
                  <option value="">Selecione o profissional...</option>
                  {filteredPersonnel.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({getRoleLabel(u.role)})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
           <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
             <div className="w-1.5 h-6 bg-rose-600 rounded-full"></div>
             Registro de Evidências (Antes)
          </h2>
          <label className={`flex flex-col items-center justify-center w-full h-64 border-2 border-slate-200 border-dashed rounded-[2rem] cursor-pointer bg-slate-50 hover:bg-slate-100 overflow-hidden relative group transition-all ${isSaving || isSaved ? 'pointer-events-none opacity-80' : ''}`}>
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4">
                   <Camera className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm text-slate-900 font-black uppercase tracking-widest">Tirar Foto do Local</p>
                <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Clique aqui para abrir a câmera</p>
              </div>
            )}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} disabled={isSaving || isSaved} />
          </label>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Parecer Técnico / Observações</label>
            <textarea 
              rows={4}
              className="w-full p-5 border border-slate-200 rounded-[2rem] focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700 leading-relaxed disabled:bg-slate-50 disabled:text-slate-400"
              placeholder="Descreva as anomalias observadas..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              required
              disabled={isSaving || isSaved}
            />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 md:relative p-4 md:p-0 bg-white/80 backdrop-blur-md md:bg-transparent border-t md:border-t-0 flex gap-4 z-[100] safe-bottom">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            disabled={isSaving || isSaved}
            className="flex-1 h-16 bg-white border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 disabled:opacity-50"
          >
            Descartar
          </button>
          <button 
            type="submit" 
            disabled={isSaving || isSaved}
            className={`flex-2 md:flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center justify-center gap-3 px-8 transition-all duration-300 ${
              isSaved 
                ? 'bg-emerald-600 text-white shadow-emerald-200' 
                : 'bg-blue-600 text-white shadow-blue-200'
            }`}
          >
            {isSaving ? (
              <Loader2 size={20} className="animate-spin" />
            ) : isSaved ? (
              <Check size={20} className="animate-in zoom-in duration-300" />
            ) : (
              <Save size={20} />
            )}
            {isSaving ? 'Gravando...' : isSaved ? 'Gravado!' : 'Gravar Vistoria'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewRequestPage;


import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, Save, Loader2, Navigation as NavigationIcon, Crosshair, Check, UploadCloud, ImageIcon, Trash2, RefreshCw } from 'lucide-react';
import { useApp } from '../App';
import { RequestStatus, ZonalType, RepairRequest } from '../types';
import { addWatermarkToImage } from '../services/imageUtils';

const NewRequestPage: React.FC = () => {
  const { addRequest, users, zonals, currentUser, getZonalName, notify } = useApp();
  const navigate = useNavigate();
  
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [locating, setLocating] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Estados para processamento de imagem
  const [isProcessingBefore, setIsProcessingBefore] = useState(false);
  const [isProcessingAfter, setIsProcessingAfter] = useState(false);
  const [activePhotoSlot, setActivePhotoSlot] = useState<'before' | 'after' | null>(null);

  const [formData, setFormData] = useState({
    protocol: '',
    seiNumber: '',
    contract: '',
    description: '',
    zonal: '', // Inicialmente vazio para ser preenchido pelos dados do banco
    technicianId: '',
    visitDate: new Date().toISOString().split('T')[0],
    latitude: -23.5505,
    longitude: -46.6333,
    address: '',
    photoBefore: '',
    photoAfter: ''
  });

  const [imagePreviewBefore, setImagePreviewBefore] = useState<string | null>(null);
  const [imagePreviewAfter, setImagePreviewAfter] = useState<string | null>(null);

  // Define uma zonal padrão assim que os dados carregarem
  useEffect(() => {
    if (zonals.length > 0 && !formData.zonal) {
      // Se o usuário atual tiver uma zonal vinculada, seleciona ela, senão a primeira da lista
      const defaultZonal = currentUser?.zonal || zonals[0].id;
      setFormData(prev => ({ ...prev, zonal: defaultZonal }));
    }
  }, [zonals, currentUser]);

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

  const handleImageSource = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activePhotoSlot) {
      const isBefore = activePhotoSlot === 'before';
      if (isBefore) setIsProcessingBefore(true); else setIsProcessingAfter(true);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        try {
          const techName = users.find(u => u.id === formData.technicianId)?.name || currentUser?.name || 'Técnico';
          const watermarked = await addWatermarkToImage(rawBase64, {
            address: formData.address || 'Endereço não identificado',
            lat: formData.latitude,
            lng: formData.longitude,
            userName: techName,
            date: new Date()
          });
          
          if (isBefore) {
            setFormData(prev => ({ ...prev, photoBefore: watermarked }));
            setImagePreviewBefore(watermarked);
          } else {
            setFormData(prev => ({ ...prev, photoAfter: watermarked }));
            setImagePreviewAfter(watermarked);
          }
          notify(`Evidência ${isBefore ? 'inicial' : 'final'} processada com sucesso!`);
        } catch (err) {
          console.error(err);
          notify("Aviso: Imagem salva sem selo digital.", "info");
          if (isBefore) {
            setFormData(prev => ({ ...prev, photoBefore: rawBase64 }));
            setImagePreviewBefore(rawBase64);
          } else {
            setFormData(prev => ({ ...prev, photoAfter: rawBase64 }));
            setImagePreviewAfter(rawBase64);
          }
        } finally {
          setIsProcessingBefore(false);
          setIsProcessingAfter(false);
          setActivePhotoSlot(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerPhotoSelection = (slot: 'before' | 'after', type: 'camera' | 'gallery') => {
    setActivePhotoSlot(slot);
    if (type === 'camera') cameraInputRef.current?.click();
    else galleryInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.zonal) {
      notify("Selecione uma unidade zonal.", "error");
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
      status: formData.photoAfter ? RequestStatus.COMPLETED : RequestStatus.OPEN,
      technicianId: formData.technicianId,
      zonal: formData.zonal,
      photoBefore: formData.photoBefore || undefined,
      photoAfter: formData.photoAfter || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      await addRequest(newRequest);
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => { navigate('/requests'); }, 1000);
    } catch (error) {
      setIsSaving(false);
    }
  };

  // Filtra os profissionais (usuários) que pertencem à unidade zonal selecionada
  const filteredPersonnel = users.filter(u => u.zonal === formData.zonal);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Vistoria de Campo</h1>
        <p className="text-slate-500 font-medium tracking-tight uppercase text-[10px] tracking-widest">Georreferenciamento e Registro Governamental</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 pb-24">
        {/* Mapa de Localização */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              <div className="w-1.5 h-6 bg-emerald-600 rounded-full"></div>
              Cartografia e GPS
            </h2>
            <button 
              type="button"
              onClick={handleCaptureLocation}
              disabled={locating || isSaving || isSaved}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-50 border border-emerald-100"
            >
              {locating ? <Loader2 size={14} className="animate-spin" /> : <NavigationIcon size={14} />}
              Recalibrar Sinal
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
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Coordenadas WGS84</p>
                  <p className="text-sm font-bold text-white tracking-wider leading-none">
                    {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </p>
               </div>
            </div>

            <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
               <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                  <MapPin size={20} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Logradouro Atual</p>
                  <p className="text-sm font-bold text-blue-900 leading-snug line-clamp-2">
                    {formData.address || (locating ? 'Capturando endereço...' : 'Ajuste o pino no mapa')}
                  </p>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2 uppercase tracking-tight">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              Identificação do Processo
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Processo SEI</label>
                <input 
                  type="text" 
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900 uppercase"
                  placeholder="00.000.000/0000-00"
                  value={formData.seiNumber}
                  onChange={e => setFormData({...formData, seiNumber: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Número do Contrato</label>
                <input 
                  type="text" 
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900 uppercase"
                  placeholder="Ex: CTR-05/2023"
                  value={formData.contract}
                  onChange={e => setFormData({...formData, contract: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2 uppercase tracking-tight">
               <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
               Responsabilidade Técnica
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Unidade Executora</label>
                <select 
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none bg-slate-50 uppercase text-xs"
                  value={formData.zonal}
                  onChange={e => setFormData({...formData, zonal: e.target.value, technicianId: ''})}
                >
                  <option value="">-- Selecione a Unidade --</option>
                  {zonals.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Vistoriador Designado</label>
                <select 
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none bg-slate-50 uppercase text-xs"
                  value={formData.technicianId}
                  onChange={e => setFormData({...formData, technicianId: e.target.value})}
                >
                  <option value="">-- Selecione Profissional --</option>
                  {filteredPersonnel.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Registro Fotográfico Dual */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
           <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2 uppercase tracking-tight">
             <div className="w-1.5 h-6 bg-rose-600 rounded-full"></div>
             Evidências do Local (Dual)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Slot ANTES */}
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Vista Inicial (Antes)</label>
              <div className="relative group rounded-[2rem] overflow-hidden border-2 border-slate-200 bg-slate-50 min-h-[240px] flex flex-col items-center justify-center transition-all">
                {isProcessingBefore ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest text-center">Sincronizando Selo...</span>
                  </div>
                ) : imagePreviewBefore ? (
                  <>
                    <img src={imagePreviewBefore} alt="Preview Antes" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                       <button 
                        type="button"
                        onClick={() => { setImagePreviewBefore(null); setFormData(p => ({...p, photoBefore: ''})); }}
                        className="p-4 bg-rose-600 text-white rounded-2xl shadow-xl hover:scale-110 transition-transform"
                       >
                         <Trash2 size={24} />
                       </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-6">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md">
                       <ImageIcon className="w-8 h-8 text-slate-300" />
                    </div>
                    
                    <div className="flex flex-col gap-2 w-full max-w-[200px]">
                       <button 
                        type="button"
                        onClick={() => triggerPhotoSelection('before', 'camera')}
                        className="flex items-center justify-center gap-2 h-10 bg-blue-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                       >
                         <Camera size={14} />
                         Câmera
                       </button>
                       <button 
                        type="button"
                        onClick={() => triggerPhotoSelection('before', 'gallery')}
                        className="flex items-center justify-center gap-2 h-10 bg-slate-900 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg hover:bg-slate-800 active:scale-95 transition-all"
                       >
                         <UploadCloud size={14} />
                         Galeria
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Slot DEPOIS */}
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Vista Final (Depois)</label>
              <div className="relative group rounded-[2rem] overflow-hidden border-2 border-slate-200 bg-slate-50 min-h-[240px] flex flex-col items-center justify-center transition-all">
                {isProcessingAfter ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest text-center">Sincronizando Selo...</span>
                  </div>
                ) : imagePreviewAfter ? (
                  <>
                    <img src={imagePreviewAfter} alt="Preview Depois" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                       <button 
                        type="button"
                        onClick={() => { setImagePreviewAfter(null); setFormData(p => ({...p, photoAfter: ''})); }}
                        className="p-4 bg-rose-600 text-white rounded-2xl shadow-xl hover:scale-110 transition-transform"
                       >
                         <Trash2 size={24} />
                       </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-6">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md">
                       <ImageIcon className="w-8 h-8 text-slate-300" />
                    </div>
                    
                    <div className="flex flex-col gap-2 w-full max-w-[200px]">
                       <button 
                        type="button"
                        onClick={() => triggerPhotoSelection('after', 'camera')}
                        className="flex items-center justify-center gap-2 h-10 bg-blue-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                       >
                         <Camera size={14} />
                         Câmera
                       </button>
                       <button 
                        type="button"
                        onClick={() => triggerPhotoSelection('after', 'gallery')}
                        className="flex items-center justify-center gap-2 h-10 bg-slate-900 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg hover:bg-slate-800 active:scale-95 transition-all"
                       >
                         <UploadCloud size={14} />
                         Galeria
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <input 
            ref={cameraInputRef}
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            onChange={handleImageSource} 
          />
          <input 
            ref={galleryInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleImageSource} 
          />

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Parecer Técnico Descritivo</label>
            <textarea 
              rows={4}
              className="w-full p-5 border border-slate-200 rounded-[2rem] focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700 leading-relaxed text-sm"
              placeholder="Descreva as anomalias, patologias e necessidades de reparo observadas..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </div>

        {/* Botões de Ação Final */}
        <div className="fixed bottom-0 left-0 right-0 md:relative p-4 md:p-0 bg-white/90 backdrop-blur-md md:bg-transparent border-t md:border-t-0 flex gap-4 z-[100] safe-bottom">
          <button type="button" onClick={() => navigate(-1)} className="flex-1 h-16 bg-white border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-50">Descartar</button>
          <button 
            type="submit" 
            disabled={isSaving || isSaved || isProcessingBefore || isProcessingAfter}
            className={`flex-[2] md:flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center justify-center gap-3 px-8 transition-all duration-300 ${
              isSaved ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-blue-600 text-white shadow-blue-200'
            }`}
          >
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : isSaved ? <Check size={20} /> : <Save size={20} />}
            {isSaving ? 'Gravando Dados...' : isSaved ? 'Registro Salvo!' : 'Finalizar Lançamento'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewRequestPage;

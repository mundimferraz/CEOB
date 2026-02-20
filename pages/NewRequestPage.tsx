
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, Save, Loader2, Navigation as NavigationIcon, Crosshair, Check, UploadCloud, ImageIcon, Trash2, X, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import { useApp } from '../App';
import { RequestStatus, ZonalType, RepairRequest } from '../types';
import { ZONALS_LIST } from '../constants';
import { addWatermarkToImage } from '../services/imageUtils';

const NewRequestPage: React.FC = () => {
  const { addRequest, users, currentUser, getZonalName, notify, isViewer } = useApp();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isViewer) {
      notify("Você não tem permissão para criar vistorias.", "error");
      navigate('/requests');
    }
  }, [isViewer, navigate, notify]);
  
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [locating, setLocating] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const [isProcessingBefore, setIsProcessingBefore] = useState(false);
  const [isProcessingAfter, setIsProcessingAfter] = useState(false);
  const [activePhotoSlot, setActivePhotoSlot] = useState<'before' | 'after' | null>(null);

  const [formData, setFormData] = useState({
    protocol: '',
    seiNumber: '',
    contract: '',
    description: '',
    zonal: currentUser?.zonal || ZonalType.NORTH,
    technicianId: currentUser?.id || '',
    visitDate: new Date().toISOString().split('T')[0],
    latitude: -23.5505,
    longitude: -46.6333,
    address: '',
    photoBefore: '',
    photoAfter: ''
  });

  const [imagePreviewBefore, setImagePreviewBefore] = useState<string | null>(null);
  const [imagePreviewAfter, setImagePreviewAfter] = useState<string | null>(null);

  // Estados de Zoom Prévia
  const [zoomModal, setZoomModal] = useState<{url: string, title: string} | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    if (!mapRef.current) {
      const L = (window as any).L;
      if (!L) return;

      mapRef.current = L.map('map-container').setView([formData.latitude, formData.longitude], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);

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
      },
      () => {
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
          notify(`Foto processada com sucesso!`);
        } catch (err) {
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
    setIsSaving(true);
    const newRequest: RepairRequest = {
      id: `req_${Date.now()}`,
      protocol: formData.protocol || `PR-${Date.now().toString().slice(-6)}`,
      seiNumber: formData.seiNumber || '---',
      contract: formData.contract || '---',
      description: formData.description || 'Sem descrição',
      location: {
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address || 'Localização manual',
      },
      visitDate: formData.visitDate,
      status: formData.photoAfter ? RequestStatus.COMPLETED : RequestStatus.OPEN,
      technicianId: formData.technicianId || currentUser?.id || 'anonimo',
      zonal: formData.zonal,
      photoBefore: formData.photoBefore || undefined,
      photoAfter: formData.photoAfter || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      await addRequest(newRequest);
      setIsSaved(true);
      setTimeout(() => { navigate('/requests'); }, 800);
    } catch (error) {
      notify("Erro ao salvar dados.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPersonnel = users.filter(u => u.zonal === formData.zonal);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full pb-32">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Novo Registro</h1>
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Preenchimento flexível de vistoria</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase">
              <div className="w-1 h-5 bg-emerald-600 rounded-full"></div>
              Localização GPS
            </h2>
            <button type="button" onClick={handleCaptureLocation} className="text-emerald-600 font-black text-[9px] uppercase tracking-widest flex items-center gap-1">
              <NavigationIcon size={12} /> Atualizar GPS
            </button>
          </div>
          <div id="map-container" className="h-64 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-inner"></div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Endereço Identificado</p>
             <p className="text-[11px] font-bold text-slate-800 leading-tight">{formData.address || 'Posicione o marcador no mapa'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2 uppercase">
              <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
              Documentação
            </h2>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Processo SEI</label>
              <input type="text" className="w-full h-11 px-4 border border-slate-200 rounded-xl font-bold text-slate-900" value={formData.seiNumber} onChange={e => setFormData({...formData, seiNumber: e.target.value})} />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contrato</label>
              <input type="text" className="w-full h-11 px-4 border border-slate-200 rounded-xl font-bold text-slate-900" value={formData.contract} onChange={e => setFormData({...formData, contract: e.target.value})} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2 uppercase">
               <div className="w-1 h-5 bg-indigo-600 rounded-full"></div>
               Responsável
            </h2>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Unidade</label>
              <select className="w-full h-11 px-4 border border-slate-200 rounded-xl font-bold text-xs" value={formData.zonal} onChange={e => setFormData({...formData, zonal: e.target.value as ZonalType})}>
                {ZONALS_LIST.map(z => <option key={z} value={z}>{getZonalName(z)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vistoriador</label>
              <select className="w-full h-11 px-4 border border-slate-200 rounded-xl font-bold text-xs" value={formData.technicianId} onChange={e => setFormData({...formData, technicianId: e.target.value})}>
                <option value="">-- Selecione --</option>
                {filteredPersonnel.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
           <h2 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2 uppercase">
             <div className="w-1 h-5 bg-rose-600 rounded-full"></div>
             Evidências Fotográficas
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['before', 'after'].map((slot) => (
              <div key={slot} className="space-y-3">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{slot === 'before' ? 'Registro Antes' : 'Registro Depois'}</label>
                <div className="relative rounded-[2rem] overflow-hidden border-2 border-slate-200 bg-slate-50 min-h-[220px] flex flex-col items-center justify-center cursor-pointer">
                  {(slot === 'before' ? isProcessingBefore : isProcessingAfter) ? (
                    <Loader2 className="animate-spin text-blue-600" size={24} />
                  ) : (slot === 'before' ? imagePreviewBefore : imagePreviewAfter) ? (
                    <img 
                      src={slot === 'before' ? imagePreviewBefore! : imagePreviewAfter!} 
                      className="w-full h-full object-cover" 
                      onClick={() => setZoomModal({url: slot === 'before' ? imagePreviewBefore! : imagePreviewAfter!, title: slot === 'before' ? 'Prévia Antes' : 'Prévia Depois'})}
                    />
                  ) : (
                    <div className="flex flex-col gap-2 w-full px-8">
                       <button type="button" onClick={() => triggerPhotoSelection(slot as any, 'camera')} className="w-full h-10 bg-blue-600 text-white rounded-xl font-black uppercase text-[9px] flex items-center justify-center gap-2"><Camera size={14} /> Câmera</button>
                       <button type="button" onClick={() => triggerPhotoSelection(slot as any, 'gallery')} className="w-full h-10 bg-slate-900 text-white rounded-xl font-black uppercase text-[9px] flex items-center justify-center gap-2"><UploadCloud size={14} /> Galeria</button>
                    </div>
                  )}
                  {(slot === 'before' ? imagePreviewBefore : imagePreviewAfter) && (
                    <button type="button" onClick={() => { slot === 'before' ? setImagePreviewBefore(null) : setImagePreviewAfter(null); setFormData(p => ({...p, [slot === 'before' ? 'photoBefore' : 'photoAfter']: ''})) }} className="absolute top-2 right-2 p-2 bg-rose-600 text-white rounded-full shadow-lg z-10"><Trash2 size={14}/></button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSource} />
          <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSource} />

          <textarea rows={4} className="w-full p-5 border border-slate-200 rounded-[2rem] font-medium text-slate-700 text-sm" placeholder="Parecer técnico ou observações..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t flex gap-3 z-[100] safe-bottom md:static md:bg-transparent md:border-none md:p-0">
          <button type="button" onClick={() => navigate(-1)} className="flex-1 h-14 bg-white border border-slate-200 rounded-2xl font-black uppercase text-[10px] text-slate-500">Voltar</button>
          <button type="submit" disabled={isSaving || isSaved} className={`flex-[2] h-14 rounded-2xl font-black uppercase text-[10px] text-white shadow-xl transition-all ${isSaved ? 'bg-emerald-600' : 'bg-blue-600'}`}>
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : isSaved ? <Check size={18} /> : 'Salvar Vistoria'}
          </button>
        </div>
      </form>

      {/* MODAL DE ZOOM PRÉVIA */}
      {zoomModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4">
           <div className="absolute top-6 left-6 text-white">
              <h2 className="font-black uppercase tracking-widest text-sm">{zoomModal.title}</h2>
              <p className="text-slate-500 text-[8px] uppercase tracking-tighter">Clique fora para fechar</p>
           </div>
           <button onClick={() => { setZoomModal(null); setZoomScale(1); }} className="absolute top-6 right-6 p-4 bg-white/10 text-white rounded-2xl"><X size={24}/></button>
           
           <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <img 
                src={zoomModal.url} 
                className="max-w-full max-h-full rounded-lg shadow-2xl transition-transform duration-200" 
                style={{ transform: `scale(${zoomScale})` }}
              />
              
              <div className="absolute bottom-10 flex items-center gap-4 bg-black/40 backdrop-blur-xl p-2 rounded-3xl border border-white/10 shadow-2xl">
                 <button type="button" onClick={() => setZoomScale(p => Math.max(1, p - 0.5))} className="w-12 h-12 flex items-center justify-center text-white bg-white/10 rounded-2xl"><ZoomOut size={20}/></button>
                 <div className="px-4 text-white font-black text-xs">{zoomScale.toFixed(1)}x</div>
                 <button type="button" onClick={() => setZoomScale(p => Math.min(4, p + 0.5))} className="w-12 h-12 flex items-center justify-center text-white bg-white/10 rounded-2xl"><ZoomIn size={20}/></button>
                 <button type="button" onClick={() => setZoomScale(1)} className="w-12 h-12 flex items-center justify-center text-white bg-white/10 rounded-2xl"><RefreshCw size={18}/></button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default NewRequestPage;

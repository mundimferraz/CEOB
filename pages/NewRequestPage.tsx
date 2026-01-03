
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, Save, Loader2 } from 'lucide-react';
import { useApp } from '../App';
import { RequestStatus, ZonalType, RepairRequest } from '../types';
import { ZONALS_LIST } from '../constants';

const NewRequestPage: React.FC = () => {
  const { addRequest, users, getZonalName } = useApp();
  const navigate = useNavigate();
  
  const [locating, setLocating] = useState(false);
  
  const [formData, setFormData] = useState({
    protocol: '',
    seiNumber: '',
    contract: '',
    description: '',
    zonal: ZonalType.NORTH,
    technicianId: '',
    visitDate: new Date().toISOString().split('T')[0],
    latitude: 0,
    longitude: 0,
    address: '',
    photoBefore: ''
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleCaptureLocation = useCallback(() => {
    setLocating(true);
    if (!navigator.geolocation) {
      alert("Geolocalização não suportada no seu dispositivo.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Simulação de geocodificação reversa
        const mockAddress = `Rua Simulada, ${Math.floor(Math.random() * 1000)}, Bairro Exemplo, São Paulo - SP`;
        setFormData(prev => ({ ...prev, latitude, longitude, address: mockAddress }));
        setLocating(false);
      },
      () => {
        alert("Erro ao obter localização. Verifique as permissões de GPS.");
        setLocating(false);
      }
    );
  }, []);

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
    if (!formData.latitude || !formData.photoBefore) {
      alert("Localização e Foto são obrigatórios para comprovação de campo.");
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
        address: formData.address,
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

  // Filtra apenas colaboradores/estagiários da zonal selecionada
  const filteredPersonnel = users.filter(u => u.zonal === formData.zonal);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nova Visita Técnica</h1>
        <p className="text-slate-500 font-medium">Registro de vistoria oficial em campo.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 pb-24">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
            <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
            Protocolo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Número SEI</label>
              <input 
                type="text" 
                className="w-full h-12 px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="00.000.000/0000-00"
                value={formData.seiNumber}
                onChange={e => setFormData({...formData, seiNumber: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Contrato</label>
              <input 
                type="text" 
                className="w-full h-12 px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Ex: CTR-05/2023"
                value={formData.contract}
                onChange={e => setFormData({...formData, contract: e.target.value})}
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
             <div className="w-1.5 h-5 bg-indigo-600 rounded-full"></div>
             Atribuição
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Unidade Operativa</label>
              <select 
                className="w-full h-12 px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-slate-50"
                value={formData.zonal}
                onChange={e => setFormData({...formData, zonal: e.target.value as ZonalType, technicianId: ''})}
              >
                {ZONALS_LIST.map(z => <option key={z} value={z}>{getZonalName(z)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Responsável</label>
              <select 
                className="w-full h-12 px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-slate-50"
                value={formData.technicianId}
                onChange={e => setFormData({...formData, technicianId: e.target.value})}
                required
              >
                <option value="">Selecione...</option>
                {filteredPersonnel.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role === 'Intern' ? 'Estagiário' : 'Colaborador'})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
           <h2 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
             <div className="w-1.5 h-5 bg-emerald-600 rounded-full"></div>
             Evidência GPS
          </h2>
          <button 
            type="button"
            onClick={handleCaptureLocation}
            disabled={locating}
            className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-50 text-emerald-700 border-2 border-dashed border-emerald-200 rounded-2xl hover:bg-emerald-100 transition-all font-black text-sm uppercase tracking-wider"
          >
            {locating ? <Loader2 className="animate-spin" /> : <MapPin size={24} />}
            {formData.latitude ? 'Localização Capturada ✓' : 'Capturar GPS Atual'}
          </button>
          {formData.address && (
            <div className="p-4 bg-slate-50 rounded-xl text-xs font-medium text-slate-600 border border-slate-200">
              <p className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                 {formData.address}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
           <h2 className="text-lg font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
             <div className="w-1.5 h-5 bg-rose-600 rounded-full"></div>
             Evidência Visual
          </h2>
          <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-slate-300 border-dashed rounded-3xl cursor-pointer bg-slate-50 hover:bg-slate-100 overflow-hidden relative group">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Camera className="w-12 h-12 mb-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
                <p className="text-sm text-slate-900 font-black uppercase tracking-widest">Foto do "Antes"</p>
                <p className="text-xs text-slate-400 mt-2 font-medium">Toque para capturar a imagem do estado atual da via</p>
              </div>
            )}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
           <label className="block text-sm font-bold text-slate-700 mb-1">Descrição Técnica da Ocorrência</label>
            <textarea 
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium"
              placeholder="Descreva detalhadamente o problema observado..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              required
            />
        </div>

        <div className="fixed bottom-0 left-0 right-0 md:relative p-4 md:p-0 bg-white md:bg-transparent border-t md:border-t-0 flex gap-4 z-40 safe-bottom">
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-4 bg-white border border-slate-300 rounded-2xl font-black uppercase tracking-widest text-slate-700 active:scale-95 transition-transform"
          >
            Voltar
          </button>
          <button 
            type="submit"
            className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewRequestPage;

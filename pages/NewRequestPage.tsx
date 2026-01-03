
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, Save, X, Loader2 } from 'lucide-react';
import { useApp } from '../App';
import { RequestStatus, Zonal, RepairRequest } from '../types';
import { ZONALS } from '../constants';

const NewRequestPage: React.FC = () => {
  const { addRequest, users } = useApp();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  
  const [formData, setFormData] = useState({
    protocol: '',
    seiNumber: '',
    contract: '',
    description: '',
    zonal: Zonal.NORTH,
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
        // Mock reverse geocoding for demo
        const mockAddress = `Rua Simulada, ${Math.floor(Math.random() * 1000)}, Bairro Exemplo, São Paulo - SP`;
        setFormData(prev => ({ ...prev, latitude, longitude, address: mockAddress }));
        setLocating(false);
      },
      (error) => {
        console.error(error);
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
      alert("Localização e Foto são obrigatórios.");
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
      technicianId: formData.technicianId || users[0]?.id,
      zonal: formData.zonal,
      photoBefore: formData.photoBefore,
      createdAt: new Date().toISOString(),
    };

    addRequest(newRequest);
    navigate('/requests');
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Nova Visita Técnica</h1>
        <p className="text-slate-500">Preencha os dados da solicitação coletados em campo.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identity & Basic Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Informações Gerais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Protocolo</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ex: 2024.123456"
                value={formData.protocol}
                onChange={e => setFormData({...formData, protocol: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Número SEI</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="00.000.000/0000-00"
                value={formData.seiNumber}
                onChange={e => setFormData({...formData, seiNumber: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contrato</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="CTR-00/202X"
                value={formData.contract}
                onChange={e => setFormData({...formData, contract: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data da Visita</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.visitDate}
                onChange={e => setFormData({...formData, visitDate: e.target.value})}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Problema</label>
            <textarea 
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Descreva o que foi observado..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              required
            />
          </div>
        </div>

        {/* Responsible & Zonal */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Equipe Responsável</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Zonal</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.zonal}
                onChange={e => setFormData({...formData, zonal: e.target.value as Zonal})}
              >
                {ZONALS.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Responsável pela Visita</label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.technicianId}
                onChange={e => setFormData({...formData, technicianId: e.target.value})}
                required
              >
                <option value="">Selecione...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Location & GPS */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Localização (GPS)</h2>
          <div className="flex flex-col gap-4">
            <button 
              type="button"
              onClick={handleCaptureLocation}
              disabled={locating}
              className="flex items-center justify-center gap-2 w-full py-4 bg-blue-50 text-blue-700 border-2 border-dashed border-blue-200 rounded-xl hover:bg-blue-100 transition-colors font-medium"
            >
              {locating ? <Loader2 className="animate-spin" /> : <MapPin size={24} />}
              {formData.latitude ? 'Localização Atualizada' : 'Capturar Localização Atual'}
            </button>
            {formData.latitude !== 0 && (
              <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 border border-slate-100">
                <p><strong>Lat/Long:</strong> {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</p>
                <p><strong>Endereço:</strong> {formData.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Registro Fotográfico</h2>
          <div className="space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-2">Foto do Antes</span>
              <div className="flex flex-col items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Camera className="w-10 h-10 mb-3 text-slate-400" />
                      <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Clique para tirar foto</span></p>
                      <p className="text-xs text-slate-400">Captura direta da câmera</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 sticky bottom-4">
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-4 bg-white border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
          >
            <Save size={20} />
            Salvar Registro
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewRequestPage;

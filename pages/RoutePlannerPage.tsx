
import React, { useState, useMemo } from 'react';
import { useApp } from '../App';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, MapPin, ListChecks, Search, 
  Loader2, User as UserIcon, CheckSquare, Square,
  Navigation, MapPinned, Info, ShieldCheck, Briefcase
} from 'lucide-react';
import { RequestStatus, VisitRoute } from '../types';

const RoutePlannerPage: React.FC = () => {
  const { requests, users, addRoute, notify } = useApp();
  const navigate = useNavigate();
  
  const [routeName, setRouteName] = useState('');
  const [selectedTechId, setSelectedTechId] = useState('');
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filtra vistorias para roteirização (AGORA ACEITA TODOS OS STATUS)
  const availableRequests = useMemo(() => {
    return requests.filter(req => 
      req.protocol.toLowerCase().includes(searchTerm.toLowerCase()) || 
      req.location.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [requests, searchTerm]);

  const toggleSelection = (id: string) => {
    setSelectedRequestIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    const newRoute: VisitRoute = {
      id: `route_${Date.now()}`,
      name: routeName || `Rota ${new Date().toLocaleDateString('pt-BR')}`,
      technicianId: selectedTechId || 'Não definido',
      requestIds: selectedRequestIds,
      createdAt: new Date().toISOString(),
      status: 'Pendente'
    };

    try {
      await addRoute(newRoute);
      notify("Roteiro de visitas criado com sucesso!", "success");
      navigate('/routes');
    } catch (error) {
      notify("Erro ao salvar roteiro.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 pb-32">
      <header className="flex items-center gap-6">
        <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase leading-none">Planejador de Campo</h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Sincronização de Itinerários Técnicos</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSave} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 sticky top-8">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              Parâmetros da Rota
            </h2>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Identificação do Roteiro</label>
              <input 
                placeholder="Ex: Rota Centro - Manhã"
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                value={routeName}
                onChange={e => setRouteName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Técnico em Destaque</label>
              <div className="relative">
                <select 
                  className="w-full h-12 px-10 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none appearance-none"
                  value={selectedTechId}
                  onChange={e => setSelectedTechId(e.target.value)}
                >
                  <option value="">Selecione o Profissional</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
               <div className="bg-blue-50 p-4 rounded-2xl flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                     <ListChecks size={20} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-blue-900">{selectedRequestIds.length}</p>
                    <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Pontos Selecionados</p>
                  </div>
               </div>

               <button 
                type="submit"
                disabled={isSaving}
                className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3"
               >
                 {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                 Gerar Roteiro Oficial
               </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  placeholder="Filtrar vistorias por protocolo ou logradouro..."
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 border-none rounded-xl font-medium text-sm outline-none"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="bg-slate-100 px-4 py-2 rounded-xl flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span className="text-[10px] font-black text-slate-500 uppercase">Lista de Segurança</span>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
             {availableRequests.length > 0 ? (
               availableRequests.map(req => {
                 const isSelected = selectedRequestIds.includes(req.id);
                 return (
                   <button
                    key={req.id}
                    onClick={() => toggleSelection(req.id)}
                    className={`p-4 rounded-[2rem] border-2 transition-all flex items-center gap-4 text-left group ${
                      isSelected ? 'bg-blue-50 border-blue-600 shadow-lg' : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                   >
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                     </div>
                     
                     <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
                        {req.photoBefore && <img src={req.photoBefore} className="w-full h-full object-cover" alt="Miniatura" />}
                     </div>

                     <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{req.protocol}</p>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">{req.location.address}</h4>
                        <div className="flex items-center gap-3 mt-1">
                           <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                              <MapPin size={10} className="text-blue-500" />
                              Zonal: {req.zonal}
                           </span>
                        </div>
                     </div>

                     <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${
                        req.status === RequestStatus.COMPLETED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                        req.status === RequestStatus.OPEN ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                     }`}>
                        {req.status}
                     </div>
                   </button>
                 );
               })
             ) : (
                <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                   <Info size={40} className="mx-auto text-slate-200 mb-4" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhuma vistoria encontrada</p>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutePlannerPage;

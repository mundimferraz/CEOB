
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../App';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, MapPin, ListChecks, Search, 
  Loader2, User as UserIcon, CheckSquare, Square,
  ShieldCheck, Info, Navigation as NavigationIcon, LocateFixed,
  GripVertical, Trash2, Plus, ArrowUpDown, ChevronRight
} from 'lucide-react';
import { RequestStatus, VisitRoute, LocationData, RepairRequest } from '../types';
import { STATUS_COLORS } from '../constants';

const RoutePlannerPage: React.FC = () => {
  const { requests, users, addRoute, notify, getZonalName, routes } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  
  const [routeName, setRouteName] = useState('');
  const [selectedTechId, setSelectedTechId] = useState('');
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [startLocation, setStartLocation] = useState<LocationData | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Estado para Drag and Drop
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Carregar dados se for edição
  useEffect(() => {
    if (editId) {
      const existingRoute = routes.find(r => r.id === editId);
      if (existingRoute) {
        setRouteName(existingRoute.name);
        setSelectedTechId(existingRoute.technicianId);
        setSelectedRequestIds(existingRoute.requestIds);
        if (existingRoute.startLocation) {
          setStartLocation(existingRoute.startLocation);
        }
      }
    } else if (!startLocation) {
      handleGetLocation();
    }
  }, [editId, routes]);

  const handleGetLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      notify("GPS não suportado.", "error");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await res.json();
          setStartLocation({
            latitude,
            longitude,
            address: data.display_name || "Ponto de Partida Manual"
          });
        } catch (e) {
          setStartLocation({ latitude, longitude, address: "Localização Atual" });
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        notify("Erro ao capturar GPS.", "error");
        setIsLocating(false);
      }
    );
  };

  const availableRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = req.protocol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           req.location.address.toLowerCase().includes(searchTerm.toLowerCase());
      const isNotSelected = !selectedRequestIds.includes(req.id);
      return matchesSearch && isNotSelected;
    });
  }, [requests, searchTerm, selectedRequestIds]);

  const selectedRequestsDetails = useMemo(() => {
    return selectedRequestIds
      .map(id => requests.find(r => r.id === id))
      .filter((req): req is RepairRequest => !!req);
  }, [selectedRequestIds, requests]);

  // Lógica de Drag and Drop
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newList = [...selectedRequestIds];
    const itemToMove = newList[draggedItemIndex];
    newList.splice(draggedItemIndex, 1);
    newList.splice(index, 0, itemToMove);
    
    setDraggedItemIndex(index);
    setSelectedRequestIds(newList);
  };

  const onDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRequestIds.length === 0) {
      notify("O roteiro deve ter ao menos um destino.", "error");
      return;
    }

    setIsSaving(true);
    const routeData: VisitRoute = {
      id: editId || `route_${Date.now()}`,
      name: routeName || `Rota ${new Date().toLocaleDateString('pt-BR')}`,
      technicianId: selectedTechId,
      requestIds: selectedRequestIds,
      startLocation: startLocation || undefined,
      createdAt: editId ? (routes.find(r => r.id === editId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      status: 'Pendente'
    };

    try {
      await addRoute(routeData); // addRoute no contexto já faz upsert
      notify(editId ? "Roteiro atualizado!" : "Roteiro criado!", "success");
      navigate('/routes');
    } catch (error) {
      notify("Erro ao salvar.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 pb-32">
      <header className="flex items-center gap-6">
        <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase leading-none">
            {editId ? 'Ajustar Itinerário' : 'Novo Planejamento'}
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Otimização Logística de Equipes</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CONFIGURAÇÃO E SALVAMENTO (3 Colunas) */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSave} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              Informações
            </h2>

            <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 text-white space-y-3">
               <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Ponto de Partida</p>
                  <button type="button" onClick={handleGetLocation} className="text-emerald-400 hover:text-white transition-colors">
                     <LocateFixed size={14} />
                  </button>
               </div>
               {isLocating ? (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase animate-pulse">
                     <Loader2 size={12} className="animate-spin" /> Localizando...
                  </div>
               ) : (
                  <p className="text-[10px] font-bold leading-snug line-clamp-2 opacity-80">{startLocation?.address || 'Defina no GPS'}</p>
               )}
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Nome da Rota</label>
              <input 
                placeholder="Ex: Roteiro Norte Diário"
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                value={routeName}
                onChange={e => setRouteName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Equipe de Campo</label>
              <select 
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none appearance-none"
                value={selectedTechId}
                onChange={e => setSelectedTechId(e.target.value)}
              >
                <option value="">Selecione o Técnico</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100">
               <button 
                type="submit" 
                disabled={isSaving}
                className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
               >
                 {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                 {editId ? 'Atualizar Itinerário' : 'Criar Roteiro'}
               </button>
            </div>
          </form>
        </div>

        {/* SEQUÊNCIA DE VISITAS (6 Colunas - Central) */}
        <div className="lg:col-span-5 space-y-6">
           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[500px]">
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                   <ArrowUpDown size={20} className="text-blue-600" />
                   Sequência de Visitas
                 </h2>
                 <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase">
                   {selectedRequestIds.length} Pontos Selecionados
                 </span>
              </div>

              {selectedRequestsDetails.length > 0 ? (
                <div className="space-y-3 relative">
                   <div className="absolute left-[20px] top-6 bottom-6 w-0.5 bg-slate-100 border-l-2 border-dashed border-blue-100"></div>
                   
                   {selectedRequestsDetails.map((req, index) => (
                     <div 
                      key={req.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, index)}
                      onDragOver={(e) => onDragOver(e, index)}
                      onDragEnd={onDragEnd}
                      className={`relative flex items-center gap-4 p-4 bg-white border rounded-2xl transition-all cursor-move group ${
                        draggedItemIndex === index ? 'opacity-40 scale-95 border-blue-400 bg-blue-50' : 'border-slate-100 hover:border-blue-300 shadow-sm'
                      }`}
                     >
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg flex-shrink-0 z-10">
                           {index + 1}
                        </div>
                        <GripVertical size={16} className="text-slate-300 group-hover:text-blue-400" />
                        
                        <div className="flex-1 min-w-0">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{req.protocol}</p>
                           <h4 className="font-bold text-slate-900 text-xs truncate uppercase italic">{req.location.address}</h4>
                        </div>

                        <button 
                          onClick={() => setSelectedRequestIds(prev => prev.filter(id => id !== req.id))}
                          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                     </div>
                   ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                   <ListChecks size={48} className="text-slate-200 mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Arraste pontos da lista para cá</p>
                </div>
              )}
           </div>
        </div>

        {/* BUSCA DE VISTORIAS (3 Colunas) */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Adicionar Pontos</h2>
              
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  placeholder="Filtrar vistorias..."
                  className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                 {availableRequests.map(req => (
                   <button
                    key={req.id}
                    onClick={() => setSelectedRequestIds(prev => [...prev, req.id])}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left hover:border-blue-400 hover:bg-blue-50 transition-all group flex items-center justify-between"
                   >
                     <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{req.protocol}</p>
                        <p className="text-[10px] font-bold text-slate-800 truncate uppercase leading-tight">{req.location.address}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[8px] font-black text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-md uppercase">{getZonalName(req.zonal)}</span>
                           <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase border ${STATUS_COLORS[req.status]}`}>{req.status}</span>
                        </div>
                     </div>
                     <Plus size={16} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-all ml-2" />
                   </button>
                 ))}
                 {availableRequests.length === 0 && (
                   <p className="text-[10px] font-bold text-slate-400 text-center py-8">Todas vistorias selecionadas ou filtros ativos.</p>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RoutePlannerPage;


import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, Plus, ChevronRight, MapPin, Calendar, User as UserIcon, ClipboardList, ImageIcon, ShieldCheck, Users, FileText, FileSpreadsheet, ChevronDown, ShieldAlert, Trash2, Loader2 } from 'lucide-react';
import { useApp } from '../App';
import { RequestStatus, ZonalType, AppRole } from '../types';
import { STATUS_COLORS, ZONALS_LIST } from '../constants';
import * as XLSX from 'xlsx';

const RequestListPage: React.FC = () => {
  const { requests, users, zonals, currentUser, canDo, getZonalName, updateRequest, deleteRequest, notify } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zonalFilter, setZonalFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      // Regra de Acesso Restrito: Só vê a própria Zonal (Ignorado se for Admin via canDo)
      if (currentUser?.role === AppRole.RESTRICTED && req.zonal !== currentUser.zonal) {
        return false;
      }

      const matchesSearch = 
        req.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.location.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
      const matchesZonal = zonalFilter === 'all' || req.zonal === zonalFilter;

      return matchesSearch && matchesStatus && matchesZonal;
    });
  }, [requests, searchTerm, statusFilter, zonalFilter, currentUser]);

  const handleQuickStatusChange = (e: React.ChangeEvent<HTMLSelectElement>, req: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!canDo('edit_request')) {
      notify("Você não tem permissão para alterar status.", "error");
      return;
    }

    const newStatus = e.target.value as RequestStatus;
    updateRequest({ ...req, status: newStatus });
    notify(`Status de ${req.protocol} alterado para ${newStatus}`);
  };

  const handleQuickDelete = async (e: React.MouseEvent, id: string, protocol: string) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(`ATENÇÃO: Deseja excluir permanentemente a vistoria ${protocol}? Esta ação é irreversível.`);
    
    if (confirmed) {
      try {
        setDeletingId(id);
        await deleteRequest(id);
        notify(`Vistoria ${protocol} excluída com sucesso!`, 'success');
      } catch (error) {
        notify(`Erro ao excluir vistoria.`, 'error');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const exportToCSV = () => {
    const data = filteredRequests.map(req => {
      const zonalMeta = zonals.find(z => z.id === req.zonal);
      const engineer = users.find(u => u.id === zonalMeta?.managerId);
      
      return {
        Protocolo: req.protocol,
        SEI: req.seiNumber,
        Status: req.status,
        Zonal: getZonalName(req.zonal),
        Engenheiro: engineer?.name || '---',
        Data: new Date(req.visitDate).toLocaleDateString('pt-BR'),
        Endereco: req.location.address,
        Descricao: req.description
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SGR_Relatorio_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulo de Vistorias</span>
             {currentUser?.role === AppRole.RESTRICTED && (
               <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded border border-rose-100 uppercase tracking-tighter">Visão Limitada à Unidade</span>
             )}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Inventário de Obras</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold transition-all shadow-sm text-sm"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            Planilha CSV
          </button>
          
          {canDo('create_request') && (
            <Link 
              to="/new" 
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-200"
            >
              <Plus size={18} />
              Nova Vistoria
            </Link>
          )}
        </div>
      </header>

      <div className="bg-white p-2 md:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Protocolo, Logradouro ou Descrição..." 
            className="w-full pl-12 pr-4 h-12 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl focus:ring-0 outline-none transition-all text-slate-900 font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="flex-1 md:w-44 h-12 px-4 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none font-semibold text-slate-700 appearance-none text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">Status: Todos</option>
            {Object.values(RequestStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {canDo('view_all_zonals') && (
            <select 
              className="flex-1 md:w-44 h-12 px-4 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none font-semibold text-slate-700 appearance-none text-sm"
              value={zonalFilter}
              onChange={e => setZonalFilter(e.target.value)}
            >
              <option value="all">Unidade: Todas</option>
              {ZONALS_LIST.map(z => <option key={z} value={z}>{getZonalName(z)}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map(req => {
            const tech = users.find(u => u.id === req.technicianId);
            const zonalMeta = zonals.find(z => z.id === req.zonal);
            const canEdit = canDo('edit_request');
            const isDeleting = deletingId === req.id;

            return (
              <Link 
                key={req.id} 
                to={`/requests/${req.id}`}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-[0.98] flex gap-4 relative group"
              >
                {/* BOTÃO EXCLUIR RÁPIDO */}
                <button
                  onClick={(e) => handleQuickDelete(e, req.id, req.protocol)}
                  disabled={isDeleting}
                  className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white z-10 shadow-sm"
                  title="Excluir Vistoria"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>

                <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-100 shadow-inner">
                  {req.photoBefore ? (
                    <img src={req.photoBefore} alt="Miniatura" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <ImageIcon size={24} />
                      <span className="text-[8px] font-black uppercase mt-1">Sem Imagem</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between overflow-hidden pr-8">
                  <div>
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{req.protocol}</span>
                      <div 
                        className="relative"
                        onClick={e => e.preventDefault()}
                      >
                        <select 
                          value={req.status}
                          disabled={!canEdit}
                          onChange={e => handleQuickStatusChange(e, req)}
                          className={`appearance-none pl-2.5 pr-6 py-0.5 rounded-lg text-[8px] font-black border uppercase tracking-tighter outline-none cursor-pointer transition-colors ${STATUS_COLORS[req.status]} ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {Object.values(RequestStatus).map(status => (
                            <option key={status} value={status} className="bg-white text-slate-900">{status}</option>
                          ))}
                        </select>
                        {canEdit && <ChevronDown size={8} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />}
                      </div>
                    </div>
                    <h3 className="text-sm md:text-base font-black text-slate-900 leading-tight line-clamp-2 mb-2">{req.description}</h3>
                    
                    <div className="flex items-center gap-1.5 text-slate-500 mb-2">
                      <MapPin size={12} className="text-blue-500 flex-shrink-0" />
                      <span className="text-[10px] md:text-xs font-bold truncate">{req.location.address}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-black text-[10px] text-slate-600">
                          {tech?.name.charAt(0)}
                        </div>
                        <span className="text-[10px] font-black text-slate-900 truncate">{tech?.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 text-[9px] font-black uppercase tracking-tighter">
                         <Calendar size={10} />
                         {new Date(req.visitDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="lg:col-span-2 bg-slate-100 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
            <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClipboardList className="text-slate-400" size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 uppercase">Nada Encontrado</h3>
            <p className="text-slate-500 font-medium">Tente ajustar seus filtros ou termos de busca.</p>
          </div>
        )}
      </div>

      {canDo('create_request') && (
        <Link 
          to="/new" 
          className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform z-40 border-4 border-white"
        >
          <Plus size={32} strokeWidth={3} />
        </Link>
      )}
    </div>
  );
};

export default RequestListPage;

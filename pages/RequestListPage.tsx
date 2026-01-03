
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, Plus, ChevronRight, MapPin, Calendar, User as UserIcon, ClipboardList, MoreVertical } from 'lucide-react';
import { useApp } from '../App';
import { RequestStatus, ZonalType } from '../types';
import { STATUS_COLORS, ZONALS_LIST } from '../constants';
import * as XLSX from 'xlsx';

const RequestListPage: React.FC = () => {
  const { requests, users, getZonalName } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zonalFilter, setZonalFilter] = useState<string>('all');

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = 
        req.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.location.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
      const matchesZonal = zonalFilter === 'all' || req.zonal === zonalFilter;

      return matchesSearch && matchesStatus && matchesZonal;
    });
  }, [requests, searchTerm, statusFilter, zonalFilter]);

  const exportToExcel = () => {
    const data = filteredRequests.map(req => ({
      Protocolo: req.protocol,
      SEI: req.seiNumber,
      Contrato: req.contract,
      Status: req.status,
      Zonal: getZonalName(req.zonal),
      Data_Visita: req.visitDate,
      Endereco: req.location.address,
      Latitude: req.location.latitude,
      Longitude: req.location.longitude,
      Descricao: req.description,
      Responsavel: users.find(u => u.id === req.technicianId)?.name || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Solicitacoes");
    XLSX.writeFile(workbook, `Relatorio_Reparos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Vistorias de Campo</h1>
          <p className="text-slate-500 font-medium">Gerencie e monitore os reparos urbanos.</p>
        </div>
        <div className="hidden md:flex gap-2">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold transition-all shadow-sm"
          >
            <Download size={18} />
            Exportar XLSX
          </button>
          <Link 
            to="/new" 
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={18} />
            Nova Visita
          </Link>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="bg-white p-2 md:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="O que você procura?" 
            className="w-full pl-12 pr-4 h-12 md:h-11 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl focus:ring-0 outline-none transition-all text-slate-900 placeholder:text-slate-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="flex-1 md:w-44 h-12 md:h-11 px-4 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold text-slate-700 appearance-none text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">Status: Todos</option>
            {Object.values(RequestStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select 
            className="flex-1 md:w-44 h-12 md:h-11 px-4 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold text-slate-700 appearance-none text-sm"
            value={zonalFilter}
            onChange={e => setZonalFilter(e.target.value)}
          >
            <option value="all">Unidade: Todas</option>
            {ZONALS_LIST.map(z => <option key={z} value={z}>{getZonalName(z)}</option>)}
          </select>
          <button className="md:hidden h-12 w-12 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl">
             <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map(req => {
            const tech = users.find(u => u.id === req.technicianId);
            return (
              <Link 
                key={req.id} 
                to={`/requests/${req.id}`}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-[0.98]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{req.protocol}</span>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2">{req.description}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase ${STATUS_COLORS[req.status]}`}>
                    {req.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                      <MapPin size={16} />
                    </div>
                    <span className="text-sm font-medium line-clamp-1">{req.location.address}</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <UserIcon size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">{tech?.name || 'Técnico'}</span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{getZonalName(req.zonal)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                       <Calendar size={14} />
                       {new Date(req.visitDate).toLocaleDateString('pt-BR')}
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
            <h3 className="text-xl font-bold text-slate-900 mb-2">Nada por aqui hoje</h3>
            <p className="text-slate-500 font-medium">Não encontramos nenhum registro com esses filtros.</p>
          </div>
        )}
      </div>

      {/* FAB - Mobile only */}
      <Link 
        to="/new" 
        className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform z-40 border-4 border-white"
      >
        <Plus size={32} strokeWidth={3} />
      </Link>
    </div>
  );
};

export default RequestListPage;

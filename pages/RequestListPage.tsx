
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
// Added ClipboardList to the lucide-react imports
import { Search, Filter, Download, Plus, ChevronRight, MapPin, Calendar, User as UserIcon, ClipboardList } from 'lucide-react';
import { useApp } from '../App';
import { RequestStatus, Zonal } from '../types';
import { STATUS_COLORS, ZONALS } from '../constants';
import * as XLSX from 'xlsx';

const RequestListPage: React.FC = () => {
  const { requests, users } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zonalFilter, setZonalFilter] = useState<string>('all');

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = 
        req.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      Zonal: req.zonal,
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Solicitações de Reparos</h1>
          <p className="text-slate-500">Gerencie e filtre todos os chamados ativos.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-medium transition-colors"
          >
            <Download size={18} />
            Exportar XLSX
          </button>
          <Link 
            to="/new" 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-100"
          >
            <Plus size={18} />
            Nova Visita
          </Link>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select 
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos Status</option>
            {Object.values(RequestStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <select 
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={zonalFilter}
            onChange={e => setZonalFilter(e.target.value)}
          >
            <option value="all">Todas Zonais</option>
            {ZONALS.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 justify-end font-medium">
          <Filter size={16} />
          {filteredRequests.length} resultados
        </div>
      </div>

      {/* Requests List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map(req => {
            const tech = users.find(u => u.id === req.technicianId);
            return (
              <Link 
                key={req.id} 
                to={`/requests/${req.id}`}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[req.status]}`}>
                        {req.status.toUpperCase()}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{req.protocol}</span>
                      <span className="text-xs text-slate-400 font-mono hidden sm:block">SEI: {req.seiNumber}</span>
                    </div>
                    <p className="text-slate-800 font-medium line-clamp-1">{req.description}</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={16} className="text-slate-400" />
                        <span className="truncate max-w-[200px]">{req.location.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={16} className="text-slate-400" />
                        <span>{new Date(req.visitDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UserIcon size={16} className="text-slate-400" />
                        <span>{tech?.name || 'Não atribuído'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center gap-4">
                    <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {req.zonal}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="bg-slate-100 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
            {/* ClipboardList is now correctly imported */}
            <ClipboardList className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-slate-900">Nenhuma solicitação encontrada</h3>
            <p className="text-slate-500">Ajuste os filtros ou crie um novo registro.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestListPage;


import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, Plus, ChevronRight, MapPin, Calendar, User as UserIcon, ClipboardList, ImageIcon, ShieldCheck, Users, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { useApp } from '../App';
import { RequestStatus, ZonalType } from '../types';
import { STATUS_COLORS, ZONALS_LIST } from '../constants';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const RequestListPage: React.FC = () => {
  const { requests, users, zonals, getZonalName, getRoleLabel, updateRequest, notify } = useApp();
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

  const handleQuickStatusChange = (e: React.ChangeEvent<HTMLSelectElement>, req: any) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = e.target.value as RequestStatus;
    updateRequest({ ...req, status: newStatus });
    notify(`Status de ${req.protocol} alterado para ${newStatus}`);
  };

  const exportToCSV = () => {
    const data = filteredRequests.map(req => {
      const tech = users.find(u => u.id === req.technicianId);
      const zonalMeta = zonals.find(z => z.id === req.zonal);
      const engineer = users.find(u => u.id === zonalMeta?.managerId);
      const assistant = users.find(u => u.id === zonalMeta?.assistantId);
      
      return {
        Protocolo: req.protocol,
        SEI: req.seiNumber,
        Contrato: req.contract,
        Status: req.status,
        Zonal: getZonalName(req.zonal),
        Engenheiro: engineer?.name || '---',
        Assistente: assistant?.name || '---',
        Data: new Date(req.visitDate).toLocaleDateString('pt-BR'),
        Endereco: req.location.address,
        Descricao: req.description
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Relatorio_SGR_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateGeneralPDF = async () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const margin = 10;
    const pageWidth = 297;
    let y = 20;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO CONSOLIDADO DE VISTORIAS DE CAMPO - SGR-VIAS', pageWidth / 2, 10, { align: 'center' });

    y = 25;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - (margin * 2), 7, 'F');
    
    const cols = {
      prot: margin + 2,
      status: margin + 35,
      zonal: margin + 65,
      equipe: margin + 100,
      data: margin + 170,
      antes: margin + 195,
      depois: margin + 240
    };

    doc.text('PROTOCOLO', cols.prot, y + 4.5);
    doc.text('STATUS', cols.status, y + 4.5);
    doc.text('UNIDADE', cols.zonal, y + 4.5);
    doc.text('EQUIPE TÉCNICA', cols.equipe, y + 4.5);
    doc.text('DATA', cols.data, y + 4.5);
    doc.text('EVIDÊNCIA (ANTES)', cols.antes, y + 4.5);
    doc.text('EVIDÊNCIA (DEPOIS)', cols.depois, y + 4.5);

    y += 10;

    for (const req of filteredRequests) {
      if (y > 180) {
        doc.addPage('l', 'mm', 'a4');
        y = 20;
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y - 5, pageWidth - (margin * 2), 7, 'F');
        doc.text('PROTOCOLO', cols.prot, y - 0.5);
        doc.text('STATUS', cols.status, y - 0.5);
        doc.text('UNIDADE', cols.zonal, y - 0.5);
        doc.text('EQUIPE TÉCNICA', cols.equipe, y - 0.5);
        doc.text('DATA', cols.data, y - 0.5);
        doc.text('EVIDÊNCIA (ANTES)', cols.antes, y - 0.5);
        doc.text('EVIDÊNCIA (DEPOIS)', cols.depois, y - 0.5);
        y += 5;
      }

      const zonalMeta = zonals.find(z => z.id === req.zonal);
      const engineer = users.find(u => u.id === zonalMeta?.managerId);
      const assistant = users.find(u => u.id === zonalMeta?.assistantId);

      doc.setFont('helvetica', 'bold');
      doc.text(req.protocol, cols.prot, y + 10);
      doc.setFont('helvetica', 'normal');
      doc.text(req.status.toUpperCase(), cols.status, y + 10);
      doc.text(getZonalName(req.zonal), cols.zonal, y + 10);
      
      const equipeText = `ENG: ${engineer?.name || '---'}\nAST: ${assistant?.name || '---'}`;
      doc.text(equipeText, cols.equipe, y + 8);
      
      doc.text(new Date(req.visitDate).toLocaleDateString('pt-BR'), cols.data, y + 10);

      const imgW = 25;
      const imgH = 18;

      if (req.photoBefore) {
        try {
          doc.addImage(req.photoBefore, 'JPEG', cols.antes, y, imgW, imgH);
        } catch (e) {
          doc.setFontSize(6);
          doc.text('[Erro na imagem]', cols.antes, y + 10);
          doc.setFontSize(8);
        }
      }

      if (req.photoAfter) {
        try {
          doc.addImage(req.photoAfter, 'JPEG', cols.depois, y, imgW, imgH);
        } catch (e) {
          doc.setFontSize(6);
          doc.text('[Erro na imagem]', cols.depois, y + 10);
          doc.setFontSize(8);
        }
      } else {
        doc.setFontSize(6);
        doc.setTextColor(150);
        doc.text('SEM IMAGEM', cols.depois + 5, y + 10);
        doc.setTextColor(0);
        doc.setFontSize(8);
      }

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 20, pageWidth - margin, y + 20);
      y += 25;
    }

    doc.save(`Relatorio_Geral_SGR_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Vistorias de Campo</h1>
          <p className="text-slate-500 font-medium">Gerencie e monitore os reparos urbanos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold transition-all shadow-sm text-sm"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            Exportar CSV
          </button>
          <button 
            onClick={generateGeneralPDF}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold transition-all shadow-lg text-sm"
          >
            <FileText size={16} className="text-blue-400" />
            Relatório PDF
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

      <div className="bg-white p-2 md:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="O que você procura?" 
            className="w-full pl-12 pr-4 h-12 md:h-11 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl focus:ring-0 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium"
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map(req => {
            const tech = users.find(u => u.id === req.technicianId);
            const zonalMeta = zonals.find(z => z.id === req.zonal);
            const engineer = users.find(u => u.id === zonalMeta?.managerId);
            const assistant = users.find(u => u.id === zonalMeta?.assistantId);
            const primaryUser = assistant || tech;

            return (
              <Link 
                key={req.id} 
                to={`/requests/${req.id}`}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-[0.98] flex gap-4"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-100 shadow-inner">
                  {req.photoBefore ? (
                    <img src={req.photoBefore} alt="Miniatura" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <ImageIcon size={24} />
                      <span className="text-[8px] font-black uppercase mt-1">S/ Imagem</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[100px]">{req.protocol}</span>
                      <div 
                        className="relative"
                        onClick={e => e.preventDefault()} // Impede o Link de navegar ao clicar no container do select
                      >
                        <select 
                          value={req.status}
                          onChange={e => handleQuickStatusChange(e, req)}
                          className={`appearance-none pl-2.5 pr-6 py-0.5 rounded-lg text-[8px] font-black border uppercase tracking-tighter outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-colors ${STATUS_COLORS[req.status]}`}
                        >
                          {Object.values(RequestStatus).map(status => (
                            <option key={status} value={status} className="bg-white text-slate-900 font-bold uppercase">{status}</option>
                          ))}
                        </select>
                        <ChevronDown size={8} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
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
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] flex-shrink-0 ${assistant ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {primaryUser?.name.charAt(0)}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-[10px] font-black text-slate-900 truncate">
                            {primaryUser?.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400 text-[9px] font-black uppercase tracking-tighter">
                         <Calendar size={10} />
                         {new Date(req.visitDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-1">
                      {engineer && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-lg border border-blue-100 max-w-[140px]">
                          <ShieldCheck size={10} className="text-blue-600 flex-shrink-0" />
                          <span className="text-[8px] font-bold text-blue-700 uppercase tracking-tighter truncate">
                            ENG: {engineer.name}
                          </span>
                        </div>
                      )}
                      
                      {assistant && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 rounded-lg border border-indigo-100 max-w-[140px]">
                          <Users size={10} className="text-indigo-600 flex-shrink-0" />
                          <span className="text-[8px] font-bold text-indigo-700 uppercase tracking-tighter truncate">
                            {getRoleLabel(assistant.role).toUpperCase()}: {assistant.name}
                          </span>
                        </div>
                      )}
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

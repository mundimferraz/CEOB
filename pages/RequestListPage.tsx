
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { 
  Search, Download, Plus, MapPin, Calendar, 
  ClipboardList, ImageIcon, FileText, FileSpreadsheet, 
  ChevronDown, Trash2, Loader2, RotateCw, Map as MapIcon,
  Globe
} from 'lucide-react';
import { useApp } from '../App';
import { RequestStatus, AppRole, RepairRequest } from '../types';
import { STATUS_COLORS } from '../constants';
import * as XLSX from 'xlsx';

const RequestListPage: React.FC = () => {
  const { requests, users, zonals, currentUser, canDo, getZonalName, updateRequest, deleteRequest, refreshRequests, notify } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zonalFilter, setZonalFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
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

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRequests();
      notify("Lista sincronizada com sucesso!");
    } catch (e) {
      notify("Erro ao sincronizar.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleQuickStatusChange = (e: React.ChangeEvent<HTMLSelectElement>, req: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canDo('edit_request')) {
      notify("Você não tem permissão para alterar status.", "error");
      return;
    }
    const newStatus = e.target.value as RequestStatus;
    updateRequest({ ...req, status: newStatus });
  };

  const handleQuickDelete = async (e: React.MouseEvent, id: string, protocol: string) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = window.confirm(`⚠️ AVISO CRÍTICO:\n\nDeseja excluir permanentemente a vistoria "${protocol}"?\n\nEsta ação não poderá ser desfeita.`);
    if (confirmed) {
      try {
        setDeletingId(id);
        await deleteRequest(id);
        notify(`✅ Registro ${protocol} removido com sucesso!`, 'success');
      } catch (error) {
        notify(`❌ Falha na exclusão.`, 'error');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const exportToKML = () => {
    // Agrupar vistorias por zonal para criar pastas no KML
    // Fixed: Explicitly type the accumulator as Record<string, RepairRequest[]>
    const groupedByZonal: Record<string, RepairRequest[]> = filteredRequests.reduce((acc: Record<string, RepairRequest[]>, req) => {
      const zonalName = getZonalName(req.zonal);
      if (!acc[zonalName]) acc[zonalName] = [];
      acc[zonalName].push(req);
      return acc;
    }, {});

    let kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Vistorias SGR-Vias - ${new Date().toLocaleDateString('pt-BR')}</name>
    <description>Exportação georreferenciada do sistema SGR-Vias</description>
`;

    // Criar estilos básicos
    kmlContent += `
    <Style id="icon-open">
      <IconStyle><color>ffffc107</color><scale>1.1</scale><Icon><href>http://maps.google.com/mapfiles/kml/paddle/blu-blank.png</href></Icon></IconStyle>
    </Style>
    <Style id="icon-completed">
      <IconStyle><color>ff28a745</color><scale>1.1</scale><Icon><href>http://maps.google.com/mapfiles/kml/paddle/grn-blank.png</href></Icon></IconStyle>
    </Style>
`;

    // Fixed: Use Object.keys to iterate and ensure reqs is correctly typed to avoid 'unknown' issues in some TS versions with Object.entries
    Object.keys(groupedByZonal).forEach(zonalName => {
      const reqs = groupedByZonal[zonalName];
      kmlContent += `    <Folder>
      <name>${zonalName}</name>
`;
      reqs.forEach(req => {
        const tech = users.find(u => u.id === req.technicianId);
        kmlContent += `      <Placemark>
        <name>${req.protocol}</name>
        <description><![CDATA[
          <div style="font-family: Arial, sans-serif; padding: 10px;">
            <h3 style="color: #1e293b; margin-top: 0;">${req.protocol}</h3>
            <p><strong>Status:</strong> ${req.status}</p>
            <p><strong>SEI:</strong> ${req.seiNumber}</p>
            <p><strong>Vistoriador:</strong> ${tech?.name || 'Não atribuído'}</p>
            <p><strong>Endereço:</strong> ${req.location.address}</p>
            <p><strong>Descrição:</strong> ${req.description}</p>
            <p><small>Gerado via SGR-Vias em ${new Date(req.createdAt).toLocaleString('pt-BR')}</small></p>
          </div>
        ]]></description>
        <Point>
          <coordinates>${req.location.longitude},${req.location.latitude},0</coordinates>
        </Point>
      </Placemark>
`;
      });
      kmlContent += `    </Folder>\n`;
    });

    kmlContent += `  </Document>
</kml>`;

    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SGR_Georreferenciado_${Date.now()}.kml`;
    link.click();
    notify("KML para Google Earth gerado com sucesso!", "success");
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

  const generatePDFReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO CONSOLIDADO DE VISTORIAS - SGR-VIAS', 15, 15);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')} | Total de Registros: ${filteredRequests.length}`, 15, 22);

    let y = 45;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Protocolo', 15, y);
    doc.text('Status', 45, y);
    doc.text('Unidade', 75, y);
    doc.text('Localização', 105, y);
    
    y += 4;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y, pageWidth - 15, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    filteredRequests.forEach((req, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(req.protocol, 15, y);
      doc.text(req.status, 45, y);
      doc.text(getZonalName(req.zonal), 75, y);
      const addr = req.location.address.substring(0, 45) + (req.location.address.length > 45 ? '...' : '');
      doc.text(addr, 105, y);
      
      y += 6;
      doc.setDrawColor(240, 240, 240);
      doc.line(15, y-2, pageWidth - 15, y-2);
    });

    doc.save(`SGR_Relatorio_Consolidado_${Date.now()}.pdf`);
    notify("Relatório PDF gerado com sucesso!");
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulo de Vistorias</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight uppercase italic">Inventário de Obras</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleManualRefresh} disabled={isRefreshing} className="flex items-center justify-center w-11 h-11 bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50" title="Sincronizar Manualmente"><RotateCw size={18} className={isRefreshing ? "animate-spin text-blue-600" : ""} /></button>
          
          <button onClick={exportToKML} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-900 border border-slate-200 rounded-xl hover:bg-white font-bold transition-all shadow-sm text-sm" title="Abrir no Google Earth"><Globe size={16} className="text-blue-500" />Google Earth (KML)</button>
          <button onClick={generatePDFReport} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold transition-all shadow-lg text-sm"><FileText size={16} className="text-blue-400" />Relatório PDF</button>
          <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold transition-all shadow-sm text-sm"><FileSpreadsheet size={16} className="text-emerald-600" />Planilha CSV</button>
          
          {canDo('create_request') && (<Link to="/new" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-200"><Plus size={18} />Nova Vistoria</Link>)}
        </div>
      </header>

      <div className="bg-white p-2 md:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Buscar por protocolo ou endereço..." className="w-full h-12 pl-12 pr-4 bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 rounded-xl outline-none transition-all text-slate-900 font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <select className="flex-1 md:w-44 h-12 px-4 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none font-semibold text-slate-700 appearance-none text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Status: Todos</option>
            {Object.values(RequestStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map(req => {
            const tech = users.find(u => u.id === req.technicianId);
            const canEdit = canDo('edit_request');
            const isDeleting = deletingId === req.id;
            return (
              <Link key={req.id} to={`/requests/${req.id}`} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-[0.98] flex gap-4 relative group overflow-hidden">
                <button onClick={(e) => handleQuickDelete(e, req.id, req.protocol)} disabled={isDeleting} className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shadow-sm transition-all hover:bg-rose-600 hover:text-white active:scale-90 z-20" title="Excluir Vistoria">{isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}</button>
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-100 shadow-inner">{req.photoBefore ? (<img src={req.photoBefore} alt="Miniatura" className="w-full h-full object-cover" />) : (<div className="w-full h-full flex flex-col items-center justify-center text-slate-300"><ImageIcon size={24} /><span className="text-[8px] font-black uppercase mt-1 text-center px-2">Sem Imagem</span></div>)}</div>
                <div className="flex-1 flex flex-col justify-between overflow-hidden pr-10">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{req.protocol}</span>
                      <div className="relative w-fit" onClick={e => e.preventDefault()}>
                        <select value={req.status} disabled={!canEdit} onChange={e => handleQuickStatusChange(e, req)} className={`appearance-none pl-2 pr-6 py-0.5 rounded-lg text-[8px] font-black border uppercase tracking-tighter outline-none cursor-pointer transition-colors ${STATUS_COLORS[req.status]} ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}>
                          {Object.values(RequestStatus).map(status => (<option key={status} value={status} className="bg-white text-slate-900">{status}</option>))}
                        </select>
                        {canEdit && <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />}
                      </div>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors uppercase italic">{req.location.address}</h3>
                    <div className="flex items-center gap-1 text-blue-600 mb-2">
                        <MapPin size={12} className="flex-shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest truncate">{getZonalName(req.zonal)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center font-black text-[10px] text-blue-600 border border-blue-100 uppercase">{tech?.name.charAt(0) || '?'}</div>
                            <span className="text-[10px] font-black text-slate-700 truncate">{tech?.name || 'Não atribuído'}</span>
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
          <div className="lg:col-span-2 bg-slate-100 border-2 border-dashed border-slate-200 rounded-[2rem] p-16 text-center"><ClipboardList className="text-slate-400 mx-auto mb-4" size={40} /><h3 className="text-sm font-black text-slate-900 mb-2 uppercase tracking-widest">Nenhuma vistoria</h3><p className="text-slate-500 text-xs font-medium uppercase">Tente outros filtros.</p></div>
        )}
      </div>
    </div>
  );
};

export default RequestListPage;

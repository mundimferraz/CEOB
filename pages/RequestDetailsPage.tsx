
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { MapPin, Calendar, User as UserIcon, FileText, Camera, Download, Trash2, CheckCircle, AlertTriangle, Crosshair, ImageIcon, Edit2, X, Save, ExternalLink, Loader2, ShieldCheck, UserCheck, Users, ChevronDown, Share2, Hash, Briefcase, ClipboardList, UploadCloud } from 'lucide-react';
import { useApp } from '../App';
import { RequestStatus } from '../types';
import { STATUS_COLORS } from '../constants';
import { addWatermarkToImage } from '../services/imageUtils';

const RequestDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requests, updateRequest, deleteRequest, users, zonals, currentUser, getZonalName, getRoleLabel, notify, canDo } = useApp();
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const request = requests.find(r => r.id === id);
  const tech = users.find(u => u.id === request?.technicianId);
  const zonalMeta = zonals.find(z => z.id === request?.zonal);
  const engineer = users.find(u => u.id === zonalMeta?.managerId);
  const assistant = users.find(u => u.id === zonalMeta?.assistantId);

  const [editedAddress, setEditedAddress] = useState('');
  const [editedProtocol, setEditedProtocol] = useState('');
  const [editedSei, setEditedSei] = useState('');
  const [editedContract, setEditedContract] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingProtocol, setIsEditingProtocol] = useState(false);
  const [isEditingSei, setIsEditingSei] = useState(false);
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingTech, setIsEditingTech] = useState(false);
  const [isCapturingAfter, setIsCapturingAfter] = useState(false);

  useEffect(() => {
    if (request) {
      setEditedAddress(request.location.address || '');
      setEditedProtocol(request.protocol || '');
      setEditedSei(request.seiNumber || '');
      setEditedContract(request.contract || '');
      setEditedDescription(request.description || '');
    }
  }, [request?.id, request?.seiNumber, request?.contract, request?.protocol, request?.description, request?.location.address]);

  const canEdit = canDo('edit_request');

  if (!request) {
    return (
      <div className="p-12 text-center">
        <AlertTriangle className="mx-auto text-amber-500 mb-4" size={48} />
        <h2 className="text-xl font-bold">Solicitação não encontrada</h2>
        <button onClick={() => navigate('/requests')} className="mt-4 text-blue-600 font-medium underline">Voltar para lista</button>
      </div>
    );
  }

  const handleStatusChange = (newStatus: RequestStatus) => {
    updateRequest({ ...request, status: newStatus });
  };

  const handleShareImage = async (base64Data: string, title: string) => {
    try {
      if (!base64Data) return;
      const res = await fetch(base64Data);
      const blob = await res.blob();
      const file = new File([blob], `${title.replace(/\s+/g, '_')}.jpg`, { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Evidência: ${title}`,
          text: `SGR-Vias: Evidência da vistoria ${request.protocol}`,
        });
      } else {
        const link = document.createElement('a');
        link.href = base64Data;
        link.download = `${title}.jpg`;
        link.click();
        notify("Compartilhamento nativo indisponível. Imagem baixada.");
      }
    } catch (err) {
      console.error("Erro ao compartilhar:", err);
      notify("Erro ao tentar compartilhar a imagem.", "error");
    }
  };

  const handleDelete = async () => {
    if (window.confirm('⚠️ AVISO: Deseja excluir permanentemente esta vistoria?')) {
      await deleteRequest(request.id);
      navigate('/requests');
      notify('Registro removido do sistema.');
    }
  };

  const saveField = async (field: string, value: any) => {
    try {
      await updateRequest({ ...request, [field]: value });
    } catch (err) {
      console.error("Erro ao salvar campo:", err);
    }
  };

  const handleSaveAddress = async () => {
    await updateRequest({
      ...request,
      location: { ...request.location, address: editedAddress }
    });
    setIsEditingAddress(false);
  };

  const handleSaveDescription = async () => {
    await updateRequest({
      ...request,
      description: editedDescription
    });
    setIsEditingDescription(false);
  };

  const handleAfterPhotoProcess = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && request) {
      setIsCapturingAfter(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        try {
          const techName = tech?.name || currentUser?.name || 'Técnico';
          const watermarked = await addWatermarkToImage(rawBase64, {
            address: request.location.address || 'Endereço não identificado',
            lat: request.location.latitude,
            lng: request.location.longitude,
            userName: techName,
            date: new Date()
          });
          
          await updateRequest({
            ...request,
            photoAfter: watermarked,
            status: RequestStatus.COMPLETED
          });
          notify('Evidência de conclusão salva com selo digital!', 'success');
        } catch (err) {
          console.error(err);
          notify("Imagem salva sem selo devido a erro de processamento.", "info");
          await updateRequest({
            ...request,
            photoAfter: rawBase64,
            status: RequestStatus.COMPLETED
          });
        } finally {
          setIsCapturingAfter(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = 210;
    const contentWidth = pageWidth - (margin * 2);
    let y = 18;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('LAUDO TÉCNICO DE VISTORIA - SGR-VIAS', pageWidth / 2, 11.5, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    y = 28;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('1. DADOS ADMINISTRATIVOS', margin, y);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 1.5, margin + contentWidth, y + 1.5);
    y += 8;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold'); doc.text('Protocolo:', margin, y);
    doc.setFont('helvetica', 'normal'); doc.text(request.protocol, margin + 22, y);
    doc.setFont('helvetica', 'bold'); doc.text('SEI:', margin + contentWidth / 2, y);
    doc.setFont('helvetica', 'normal'); doc.text(request.seiNumber, margin + contentWidth / 2 + 10, y);
    
    y += 5;
    doc.setFont('helvetica', 'bold'); doc.text('Contrato:', margin, y);
    doc.setFont('helvetica', 'normal'); doc.text(request.contract, margin + 22, y);
    doc.setFont('helvetica', 'bold'); doc.text('Status:', margin + contentWidth / 2, y);
    doc.setFont('helvetica', 'normal'); doc.text(request.status.toUpperCase(), margin + contentWidth / 2 + 10, y);

    y += 5;
    doc.setFont('helvetica', 'bold'); doc.text('Unidade:', margin, y);
    doc.setFont('helvetica', 'normal'); doc.text(getZonalName(request.zonal), margin + 22, y);
    doc.setFont('helvetica', 'bold'); doc.text('Data Visita:', margin + contentWidth / 2, y);
    doc.setFont('helvetica', 'normal'); doc.text(new Date(request.visitDate).toLocaleDateString('pt-BR'), margin + contentWidth / 2 + 20, y);

    y += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('2. LOCALIZAÇÃO E GEORREFERENCIAMENTO', margin, y);
    doc.line(margin, y + 1.5, margin + contentWidth, y + 1.5);
    y += 8;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold'); doc.text('Coordenadas:', margin, y);
    doc.setFont('helvetica', 'normal'); doc.text(`${request.location.latitude.toFixed(6)}, ${request.location.longitude.toFixed(6)} (WGS84)`, margin + 22, y);
    
    y += 5;
    doc.setFont('helvetica', 'bold'); doc.text('Logradouro:', margin, y);
    doc.setFont('helvetica', 'normal');
    const addrLines = doc.splitTextToSize(request.location.address, contentWidth - 22);
    doc.text(addrLines, margin + 22, y);
    y += (addrLines.length * 4) + 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('3. PARECER TÉCNICO DESCRITIVO', margin, y);
    doc.line(margin, y + 1.5, margin + contentWidth, y + 1.5);
    y += 8;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(request.description, contentWidth);
    doc.text(request.description, margin, y, { maxWidth: contentWidth, align: 'justify' });
    y += (descLines.length * 4.5) + 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('4. REGISTRO FOTOGRÁFICO DE EVIDÊNCIAS', margin, y);
    doc.line(margin, y + 1.5, margin + contentWidth, y + 1.5);
    y += 6;

    const imgWidth = (contentWidth / 2) - 3;
    const imgHeight = 52;

    if (request.photoBefore) {
      doc.setFontSize(7.5);
      doc.text('VISTA INICIAL (ANTES)', margin + (imgWidth / 2), y + 3, { align: 'center' });
      try { doc.addImage(request.photoBefore, 'JPEG', margin, y + 5, imgWidth, imgHeight); } catch (e) { doc.text('[Erro na Imagem]', margin + 5, y + 20); }
    }

    if (request.photoAfter) {
      doc.setFontSize(7.5);
      doc.text('VISTA FINAL (DEPOIS)', margin + contentWidth - (imgWidth / 2), y + 3, { align: 'center' });
      try { doc.addImage(request.photoAfter, 'JPEG', margin + contentWidth - imgWidth, y + 5, imgWidth, imgHeight); } catch (e) { doc.text('[Erro na Imagem]', margin + contentWidth - imgWidth + 5, y + 20); }
    } else {
        doc.setFontSize(7.5);
        doc.setTextColor(160);
        doc.text('AGUARDANDO CONCLUSÃO', margin + contentWidth - (imgWidth / 2), y + 25, { align: 'center' });
        doc.setDrawColor(240);
        doc.rect(margin + contentWidth - imgWidth, y + 5, imgWidth, imgHeight, 'S');
        doc.setTextColor(15, 23, 42);
    }

    y += imgHeight + 18;
    if (y > 250) { doc.addPage(); y = 25; } 

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('5. RESPONSABILIDADE TÉCNICA', margin, y);
    doc.line(margin, y + 1.5, margin + contentWidth, y + 1.5);
    y += 25;

    const sigLineWidth = 90;
    const sigX = (pageWidth / 2) - (sigLineWidth / 2);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.2);
    doc.line(sigX, y, sigX + sigLineWidth, y);
    
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(engineer?.name || 'ENGENHEIRO RESPONSÁVEL', pageWidth / 2, y, { align: 'center' });
    
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Engenheiro Civil - Responsável Técnico', pageWidth / 2, y, { align: 'center' });
    
    const visitor = assistant || tech;
    if (visitor) {
      y += 10;
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.text(`Vistoria técnica realizada por: ${visitor.name} (Matrícula: ${visitor.registrationNumber || '---'})`, pageWidth / 2, y, { align: 'center' });
    }

    doc.setFontSize(7);
    doc.setTextColor(150);
    const footerY = 288;
    doc.text(`Documento oficial gerado digitalmente via SGR-Vias em ${new Date().toLocaleString('pt-BR')}`, margin, footerY);
    doc.text(`ID de Rastreabilidade: ${request.id}`, margin + contentWidth, footerY, { align: 'right' });

    doc.save(`Laudo_Tecnico_${request.protocol}.pdf`);
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${request.location.latitude},${request.location.longitude}`;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 pb-24">
      {/* Header com Status e Título */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase ${STATUS_COLORS[request.status]}`}>
              {request.status}
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REGISTRO: {request.id}</span>
          </div>
          <div className="flex items-center gap-2 group">
            {isEditingProtocol ? (
              <div className="flex items-center gap-2">
                <input 
                  className="bg-white border border-blue-500 rounded-lg px-2 py-1 font-black text-slate-900 uppercase text-2xl tracking-tight outline-none"
                  value={editedProtocol}
                  onChange={e => setEditedProtocol(e.target.value)}
                />
                <button onClick={() => { saveField('protocol', editedProtocol); setIsEditingProtocol(false); }} className="text-emerald-600"><Save size={20}/></button>
                <button onClick={() => { setIsEditingProtocol(false); setEditedProtocol(request.protocol); }} className="text-rose-600"><X size={20}/></button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none italic">{request.protocol}</h1>
                {canEdit && (
                  <button onClick={() => setIsEditingProtocol(true)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-all">
                    <Edit2 size={16} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <button 
              onClick={handleDelete}
              className="w-12 h-12 flex items-center justify-center bg-white border border-rose-200 text-rose-500 rounded-2xl hover:bg-rose-50 transition-all shadow-sm"
              title="Excluir Registro"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button 
            onClick={generatePDF}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl font-bold text-sm uppercase tracking-widest"
          >
            <Download size={18} />
            Gerar Laudo PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Relatório de Campo</h2>
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Operativo</label>
                <div className="relative">
                  <select 
                    value={request.status}
                    disabled={!canEdit}
                    onChange={e => handleStatusChange(e.target.value as RequestStatus)}
                    className={`w-full sm:w-48 h-10 appearance-none pl-4 pr-10 rounded-xl text-xs font-black border uppercase transition-all shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${STATUS_COLORS[request.status]} ${!canEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {Object.values(RequestStatus).map(s => (
                      <option key={s} value={s} className="bg-white text-slate-900 font-bold">{s}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                </div>
              </div>
            </div>
            
            <div className="p-6 md:p-8 space-y-10">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                <div className="group">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Processo SEI</p>
                  {isEditingSei ? (
                    <div className="flex items-center gap-2">
                      <input className="w-full bg-white border border-blue-500 rounded-lg px-2 py-1 font-bold text-slate-900 text-lg outline-none" value={editedSei} onChange={e => setEditedSei(e.target.value)} />
                      <button onClick={() => { saveField('seiNumber', editedSei); setIsEditingSei(false); }} className="text-emerald-600"><Save size={16}/></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-lg">{request.seiNumber}</p>
                      {canEdit && <button onClick={() => setIsEditingSei(true)} className="text-slate-300 hover:text-blue-500"><Edit2 size={14}/></button>}
                    </div>
                  )}
                </div>
                <div className="group">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Instrumento Contratual</p>
                  {isEditingContract ? (
                    <div className="flex items-center gap-2">
                      <input className="w-full bg-white border border-blue-500 rounded-lg px-2 py-1 font-bold text-slate-900 text-lg outline-none" value={editedContract} onChange={e => setEditedContract(e.target.value)} />
                      <button onClick={() => { saveField('contract', editedContract); setIsEditingContract(false); }} className="text-emerald-600"><Save size={16}/></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-lg">{request.contract}</p>
                      {canEdit && <button onClick={() => setIsEditingContract(true)} className="text-slate-300 hover:text-blue-500"><Edit2 size={14}/></button>}
                    </div>
                  )}
                </div>
              </div>

              {/* Localização */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a 
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 bg-slate-900 rounded-3xl border border-slate-800 flex items-start gap-4 transition-all hover:bg-slate-800 group shadow-lg"
                >
                   <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <Crosshair size={24} />
                   </div>
                   <div className="flex-1">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Coordenadas Geodésicas</p>
                      <p className="font-bold text-white text-sm tracking-widest">
                        {request.location.latitude.toFixed(6)}, {request.location.longitude.toFixed(6)}
                      </p>
                      <p className="text-[8px] text-emerald-600 font-bold uppercase mt-1">Abrir Rota no GPS</p>
                   </div>
                </a>

                <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4 shadow-sm">
                   <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                      <MapPin size={24} />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Logradouro / Endereço</p>
                        {canEdit && <button onClick={() => setIsEditingAddress(!isEditingAddress)} className="text-blue-600 hover:text-blue-800"><Edit2 size={14} /></button>}
                      </div>
                      {isEditingAddress ? (
                        <div className="flex flex-col gap-2">
                          <textarea className="w-full text-sm font-bold text-blue-900 bg-white border border-blue-200 rounded-lg p-2 outline-none" value={editedAddress} onChange={(e) => setEditedAddress(e.target.value)} rows={2} />
                          <button onClick={handleSaveAddress} className="bg-blue-600 text-white text-[10px] font-black uppercase py-2 rounded-lg">Salvar Endereço</button>
                        </div>
                      ) : (
                        <p className="font-bold text-blue-900 text-sm leading-snug line-clamp-2">{request.location.address}</p>
                      )}
                   </div>
                </div>
              </div>

              {/* Parecer Técnico */}
              <div>
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                  <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                         <ClipboardList size={20} className="text-slate-400" />
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Parecer Técnico Detalhado</p>
                      </div>
                      {canEdit && <button onClick={() => setIsEditingDescription(!isEditingDescription)} className="text-blue-600 hover:text-blue-800"><Edit2 size={16} /></button>}
                  </div>
                  {isEditingDescription ? (
                    <div className="space-y-3">
                      <textarea className="w-full text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-2xl p-4 outline-none focus:ring-4 focus:ring-blue-500/10" value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} rows={4} />
                      <button onClick={handleSaveDescription} className="w-full bg-slate-900 text-white text-[10px] font-black uppercase py-4 rounded-2xl shadow-xl">Confirmar Parecer</button>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-slate-800 leading-relaxed italic border-l-4 border-blue-400 pl-4 py-2">
                      "{request.description}"
                    </div>
                  )}
                </div>
              </div>

              {/* Galeria Dual */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Galeria de Evidências Fotográficas</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="relative group rounded-[2rem] overflow-hidden border border-slate-200 bg-slate-100 h-64 shadow-md">
                     <div className="absolute top-4 left-4 bg-slate-900/80 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase z-10 backdrop-blur-md">Vistoria Inicial</div>
                     {request.photoBefore && (
                       <button onClick={() => handleShareImage(request.photoBefore!, 'Vistoria_Inicial')} className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-xl hover:bg-blue-600 transition-all z-10 shadow-lg"><Share2 size={16} /></button>
                     )}
                     {request.photoBefore ? (
                        <img src={request.photoBefore} alt="Antes" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300"><ImageIcon size={48} /><span className="text-[9px] font-black uppercase mt-2">Sem Registro</span></div>
                     )}
                   </div>
                   
                   <div className="relative group rounded-[2rem] overflow-hidden border border-slate-200 bg-slate-100 h-64 shadow-md">
                      <div className={`absolute top-4 left-4 ${request.photoAfter ? 'bg-emerald-600' : 'bg-amber-600'} text-white px-3 py-1 rounded-full text-[10px] font-black uppercase z-10 backdrop-blur-md shadow-lg`}>
                        {request.photoAfter ? 'Conclusão da Obra' : 'Aguardando Término'}
                      </div>
                      
                      {request.photoAfter ? (
                         <>
                           <img src={request.photoAfter} alt="Depois" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                           <button onClick={() => handleShareImage(request.photoAfter!, 'Vistoria_Conclusao')} className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white p-2 rounded-xl hover:bg-emerald-600 transition-all z-10 shadow-lg"><Share2 size={16} /></button>
                         </>
                      ) : (
                         <div className="w-full h-full bg-emerald-50 flex flex-col items-center justify-center p-6 text-center">
                            {isCapturingAfter ? (
                              <Loader2 className="animate-spin text-emerald-600" size={48} />
                            ) : (
                              <div className="space-y-4 w-full">
                                <div className="flex flex-col gap-2">
                                  <button 
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all"
                                  >
                                    <Camera size={18} />
                                    Tirar Foto (Câmera)
                                  </button>
                                  <button 
                                    onClick={() => galleryInputRef.current?.click()}
                                    className="h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
                                  >
                                    <UploadCloud size={18} />
                                    Subir Arquivo
                                  </button>
                                </div>
                                <p className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">O selo digital será aplicado</p>
                              </div>
                            )}
                            
                            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleAfterPhotoProcess} />
                            <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleAfterPhotoProcess} />
                         </div>
                      )}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Técnica */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h2 className="font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
               <Briefcase size={20} className="text-blue-600" />
               Conselho Técnico
            </h2>
            
            <div className="space-y-3 mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsável pela Unidade</p>
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><ShieldCheck size={20} /></div>
                <div className="overflow-hidden">
                  <p className="font-black text-slate-900 text-sm leading-tight truncate">{engineer?.name || 'Não definido'}</p>
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Titular da Engenharia</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between group">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vistoriador de Campo</p>
                {canEdit && !isEditingTech && <button onClick={() => setIsEditingTech(true)} className="opacity-0 group-hover:opacity-100 text-blue-500"><Edit2 size={12}/></button>}
              </div>
              
              {isEditingTech ? (
                <div className="space-y-2">
                  <select className="w-full h-12 px-3 bg-white border-2 border-blue-500 rounded-xl font-bold text-slate-900 text-xs outline-none" value={request.technicianId} onChange={e => { saveField('technicianId', e.target.value); setIsEditingTech(false); }}>
                    <option value="">-- Trocar Profissional --</option>
                    {users.filter(u => u.zonal === request.zonal).map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <button onClick={() => setIsEditingTech(false)} className="w-full text-[9px] font-black text-rose-500 uppercase tracking-widest text-center">Cancelar</button>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg">{tech?.name.charAt(0) || '?'}</div>
                  <div className="overflow-hidden">
                    <p className="font-black text-slate-900 text-sm leading-tight truncate">{tech?.name}</p>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Técnico Operacional</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Data de Registro</span>
                <span className="text-slate-900 font-bold">{new Date(request.visitDate).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Jurisdição Zonal</span>
                <span className="text-slate-900 font-bold">{getZonalName(request.zonal)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><FileText size={120} /></div>
             <div className="flex items-center gap-2 mb-4 relative z-10">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900"><CheckCircle size={18} /></div>
                <h3 className="font-black uppercase tracking-tight text-sm">Resumo Executivo</h3>
             </div>
             <p className="text-xs text-slate-400 font-medium leading-relaxed mb-8 relative z-10">Situação atual da ordem de serviço: <strong>{request.status.toUpperCase()}</strong>. {request.status !== RequestStatus.COMPLETED ? 'Aguardando validação final em campo.' : 'Obra finalizada e georreferenciada.'}</p>
             <div className="space-y-2 relative z-10">
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden shadow-inner">
                   <div className={`h-full bg-emerald-500 transition-all duration-1000 ${request.status === RequestStatus.COMPLETED ? 'w-full' : request.status === RequestStatus.IN_PROGRESS ? 'w-1/2' : 'w-1/4'}`}></div>
                </div>
                <div className="flex justify-between items-center">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Eficiência</p>
                   <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{request.status}</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailsPage;

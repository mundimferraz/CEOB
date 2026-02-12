
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { 
  MapPin, Calendar, User as UserIcon, FileText, Camera, Download, Trash2, 
  CheckCircle, AlertTriangle, Crosshair, ImageIcon, Edit2, X, Save, 
  ExternalLink, Loader2, ShieldCheck, UserCheck, Users, ChevronDown, 
  Share2, Hash, Briefcase, ClipboardList, UploadCloud, RefreshCw, Navigation,
  Maximize2, ZoomIn, ZoomOut, RotateCcw, Map as MapIcon
} from 'lucide-react';
import { useApp } from '../App';
import { RequestStatus, AppRole, User } from '../types';
import { STATUS_COLORS } from '../constants';
import { addWatermarkToImage } from '../services/imageUtils';

const RequestDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requests, updateRequest, deleteRequest, users, zonals, currentUser, getZonalName, getRoleLabel, notify, canDo } = useApp();
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const request = requests.find(r => r.id === id);
  const tech = users.find(u => u.id === request?.technicianId);
  const zonalMeta = zonals.find(z => z.id === request?.zonal);
  const engineer = users.find(u => u.id === zonalMeta?.managerId);

  const [editedAddress, setEditedAddress] = useState('');
  const [editedProtocol, setEditedProtocol] = useState('');
  const [editedSei, setEditedSei] = useState('');
  const [editedContract, setEditedContract] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedLat, setEditedLat] = useState<number>(0);
  const [editedLng, setEditedLng] = useState<number>(0);
  const [editedTechId, setEditedTechId] = useState('');

  const [isEditingCoords, setIsEditingCoords] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isProcessingBefore, setIsProcessingBefore] = useState(false);
  const [isProcessingAfter, setIsProcessingAfter] = useState(false);
  const [activePhotoSlot, setActivePhotoSlot] = useState<'before' | 'after' | null>(null);

  const [fullscreenImage, setFullscreenImage] = useState<{url: string, title: string} | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (request) {
      setEditedAddress(request.location.address || '');
      setEditedProtocol(request.protocol || '');
      setEditedSei(request.seiNumber || '');
      setEditedContract(request.contract || '');
      setEditedDescription(request.description || '');
      setEditedLat(request.location.latitude);
      setEditedLng(request.location.longitude);
      setEditedTechId(request.technicianId || '');
    }
  }, [request]);

  useEffect(() => {
    if (isEditingCoords && !mapRef.current) {
      const L = (window as any).L;
      if (!L) return;
      setTimeout(() => {
        const container = document.getElementById('edit-map-container');
        if (!container) return;
        mapRef.current = L.map('edit-map-container').setView([editedLat, editedLng], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
        markerRef.current = L.marker([editedLat, editedLng], { draggable: true }).addTo(mapRef.current);
        
        const updateFromMarker = async () => {
          const pos = markerRef.current.getLatLng();
          setEditedLat(pos.lat);
          setEditedLng(pos.lng);
        };

        markerRef.current.on('dragend', updateFromMarker);
        mapRef.current.on('click', (e: any) => {
          markerRef.current.setLatLng(e.latlng);
          updateFromMarker();
        });
      }, 100);
    }
    return () => { if (!isEditingCoords && mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [isEditingCoords]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreenImage(null); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (!request) return <div className="p-12 text-center font-bold text-slate-400">Solicitação não encontrada</div>;

  const isAdmin = currentUser?.role === AppRole.ADMIN;
  const isFinished = request.status === RequestStatus.COMPLETED || request.status === RequestStatus.CANCELED;
  const canModify = isAdmin || (!isFinished && canDo('edit_request'));

  const handleUpdateInfo = async () => {
    if (!canModify) return;
    setIsSaving(true);
    try {
      await updateRequest({
        ...request,
        protocol: editedProtocol,
        seiNumber: editedSei,
        contract: editedContract,
        description: editedDescription,
        technicianId: editedTechId,
        location: {
          ...request.location,
          latitude: editedLat,
          longitude: editedLng,
          address: editedAddress
        }
      });
      setIsEditingInfo(false);
      setIsEditingCoords(false);
      notify("Dados do registro atualizados!");
    } catch (err) {
      notify("Erro ao atualizar dados.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareImage = async (base64Data: string, title: string) => {
    try {
      const res = await fetch(base64Data);
      const blob = await res.blob();
      const file = new File([blob], `${title}.jpg`, { type: 'image/jpeg' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title, text: `SGR-Vias: ${request.protocol}` });
      } else {
        const link = document.createElement('a');
        link.href = base64Data;
        link.download = `${title}.jpg`;
        link.click();
      }
    } catch (err) { notify("Erro ao processar imagem.", "error"); }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activePhotoSlot) {
      const isBefore = activePhotoSlot === 'before';
      if (isBefore) setIsProcessingBefore(true); else setIsProcessingAfter(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        try {
          const watermarked = await addWatermarkToImage(rawBase64, {
            address: request.location.address,
            lat: request.location.latitude,
            lng: request.location.longitude,
            userName: tech?.name || currentUser?.name || 'Técnico',
            date: new Date()
          });
          const updatedData = isBefore ? { ...request, photoBefore: watermarked } : { ...request, photoAfter: watermarked, status: RequestStatus.COMPLETED };
          await updateRequest(updatedData);
          notify("Evidência atualizada!");
        } finally {
          setIsProcessingBefore(false);
          setIsProcessingAfter(false);
          setActivePhotoSlot(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Header Modernizado
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('LAUDO TÉCNICO DE INSPEÇÃO', margin, 20);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('SISTEMA DE GESTÃO DE REPAROS EM VIAS - SGR-VIAS', margin, 26);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`PROTOCOLO: ${request.protocol}`, pageWidth - margin, 20, { align: 'right' });
    doc.text(`STATUS: ${request.status.toUpperCase()}`, pageWidth - margin, 26, { align: 'right' });
    
    // Sub-header Info
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 35, pageWidth, 10, 'F');
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Documento SEI: ${request.seiNumber || 'N/A'}  |  Contrato: ${request.contract || 'N/A'}  |  Emissão: ${new Date().toLocaleDateString('pt-BR')}`, margin, 41.5);

    let y = 60;

    // Seção 1: Localização em Grid
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1. DADOS DE LOCALIZAÇÃO', margin, y);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    
    y += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Endereço:', margin, y);
    doc.setFont('helvetica', 'normal');
    const addressLines = doc.splitTextToSize(request.location.address, contentWidth - 25);
    doc.text(addressLines, margin + 25, y);
    
    y += (addressLines.length * 5) + 2;
    doc.setFont('helvetica', 'bold');
    doc.text('Coordenadas:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${request.location.latitude.toFixed(6)}, ${request.location.longitude.toFixed(6)}`, margin + 25, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Unidade:', margin + contentWidth/2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(getZonalName(request.zonal), margin + contentWidth/2 + 20, y);

    y += 12;

    // Seção 2: Equipe
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. RESPONSABILIDADE TÉCNICA', margin, y);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    
    y += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Eng. Responsável:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(engineer?.name || 'Não designado', margin + 35, y);
    
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Vistoriador:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(tech?.name || 'Não designado', margin + 35, y);

    y += 12;

    // Seção 3: Descritivo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. DESCRITIVO TÉCNICO E PARECER', margin, y);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    
    y += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(request.description, contentWidth);
    doc.text(descLines, margin, y, { align: 'justify' });
    
    y += (descLines.length * 5) + 15;

    // Seção 4: Evidências Fotográficas (Lado a Lado e Menores)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('4. EVIDÊNCIAS FOTOGRÁFICAS', margin, y);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    
    y += 10;
    
    const imgWidth = (contentWidth / 2) - 5;
    const imgHeight = 60; // Altura otimizada
    
    if (request.photoBefore) {
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('REGISTRO INICIAL (ANTES)', margin, y - 2);
      try {
        doc.addImage(request.photoBefore, 'JPEG', margin, y, imgWidth, imgHeight);
      } catch (e) {
        doc.rect(margin, y, imgWidth, imgHeight);
        doc.text('Erro ao carregar imagem', margin + 5, y + imgHeight/2);
      }
    } else {
      doc.setDrawColor(241, 245, 249);
      doc.rect(margin, y, imgWidth, imgHeight, 'F');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Sem registro inicial', margin + imgWidth/2, y + imgHeight/2, { align: 'center' });
    }

    if (request.photoAfter) {
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('REGISTRO FINAL (DEPOIS)', margin + imgWidth + 10, y - 2);
      try {
        doc.addImage(request.photoAfter, 'JPEG', margin + imgWidth + 10, y, imgWidth, imgHeight);
      } catch (e) {
        doc.rect(margin + imgWidth + 10, y, imgWidth, imgHeight);
        doc.text('Erro ao carregar imagem', margin + imgWidth + 15, y + imgHeight/2);
      }
    } else {
      doc.setDrawColor(241, 245, 249);
      doc.rect(margin + imgWidth + 10, y, imgWidth, imgHeight, 'F');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Aguardando conclusão', margin + imgWidth + 10 + imgWidth/2, y + imgHeight/2, { align: 'center' });
    }

    // Rodapé em todas as páginas
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.line(margin, doc.internal.pageSize.getHeight() - 15, pageWidth - margin, doc.internal.pageSize.getHeight() - 15);
        doc.text(`SGR-Vias - Sistema de Gestão de Reparos  |  Página ${i} de ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        doc.text(`ID Único: ${request.id}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    }
    
    doc.save(`Laudo_Tecnico_${request.protocol.replace('.', '_')}.pdf`);
    notify("Laudo técnico gerado com sucesso!");
  };

  // Funções de Zoom
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 1));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 pb-24">
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase ${STATUS_COLORS[request.status]}`}>{request.status}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REGISTRO: {request.id}</span>
          </div>
          <div className="flex items-center gap-3">
            {isEditingInfo ? (
              <input 
                className="text-2xl font-black text-slate-900 tracking-tight uppercase italic border-b-2 border-blue-600 outline-none bg-transparent"
                value={editedProtocol}
                onChange={e => setEditedProtocol(e.target.value)}
              />
            ) : (
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none italic">{request.protocol}</h1>
            )}
            {canModify && !isEditingInfo && (
              <button onClick={() => setIsEditingInfo(true)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                <Edit2 size={18} />
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isEditingInfo || isEditingCoords ? (
            <div className="flex gap-2">
               <button onClick={() => { setIsEditingInfo(false); setIsEditingCoords(false); }} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-50">
                 Cancelar
               </button>
               <button onClick={handleUpdateInfo} disabled={isSaving} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-blue-700 disabled:opacity-50">
                 {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                 Salvar
               </button>
            </div>
          ) : (
            <>
              <button onClick={generatePDF} className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl font-bold text-sm uppercase tracking-widest">
                <Download size={18} /> Laudo PDF
              </button>
              {canModify && isFinished && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-[9px] font-black uppercase tracking-widest">
                  <ShieldCheck size={14} /> Modo Admin: Edição Liberada
                </div>
              )}
            </>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8 space-y-8">
            
            {isEditingCoords ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Reposicionamento Geográfico</h3>
                  <div className="text-[10px] font-bold text-blue-600">Arraste o pino ou digite os valores</div>
                </div>
                <div id="edit-map-container" className="h-64 w-full rounded-2xl border border-slate-200 shadow-inner overflow-hidden"></div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                    <input 
                      type="number" 
                      step="0.000001"
                      value={editedLat}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setEditedLat(val);
                        if (markerRef.current) markerRef.current.setLatLng([val, editedLng]);
                        if (mapRef.current) mapRef.current.panTo([val, editedLng]);
                      }}
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                    <input 
                      type="number" 
                      step="0.000001"
                      value={editedLng}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setEditedLng(val);
                        if (markerRef.current) markerRef.current.setLatLng([editedLat, val]);
                        if (mapRef.current) mapRef.current.panTo([editedLat, val]);
                      }}
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-900 rounded-3xl border border-slate-800 flex items-start justify-between shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg"><Crosshair size={24} /></div>
                      <div>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Coordenadas</p>
                        <p className="font-bold text-white text-xs tracking-widest">{request.location.latitude.toFixed(6)}, {request.location.longitude.toFixed(6)}</p>
                      </div>
                    </div>
                    {canModify && (
                      <button onClick={() => setIsEditingCoords(true)} className="text-slate-500 hover:text-white transition-colors">
                        <Edit2 size={16} />
                      </button>
                    )}
                </div>
                <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg"><MapPin size={24} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Endereço</p>
                      {isEditingInfo ? (
                        <textarea 
                          className="w-full font-bold text-blue-900 text-xs leading-snug bg-transparent border-b border-blue-200 outline-none"
                          value={editedAddress}
                          onChange={e => setEditedAddress(e.target.value)}
                        />
                      ) : (
                        <p className="font-bold text-blue-900 text-xs leading-snug line-clamp-2">{request.location.address}</p>
                      )}
                    </div>
                </div>
              </div>
            )}

            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 italic font-medium text-slate-700 relative group">
               {isEditingInfo ? (
                 <textarea 
                  className="w-full bg-transparent border-none outline-none resize-none font-medium italic text-slate-700"
                  rows={3}
                  value={editedDescription}
                  onChange={e => setEditedDescription(e.target.value)}
                 />
               ) : (
                 `"${request.description}"`
               )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Galeria de Evidências Fotográficas</p>
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Clique para ampliar</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div 
                    onClick={() => request.photoBefore && setFullscreenImage({url: request.photoBefore, title: 'Vistoria Inicial (Antes)'})}
                    className="relative group rounded-[2rem] overflow-hidden border border-slate-200 bg-slate-100 h-64 shadow-md flex items-center justify-center cursor-zoom-in"
                   >
                     <div className="absolute top-4 left-4 bg-slate-900/80 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase z-10 backdrop-blur-md">Antes</div>
                     {request.photoBefore ? (
                       <>
                         <img src={request.photoBefore} alt="Antes" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm z-10">
                            <Maximize2 size={32} className="text-white scale-75 group-hover:scale-100 transition-transform" />
                            <p className="text-white font-black text-[10px] uppercase tracking-widest">Ampliar Detalhes</p>
                         </div>
                       </>
                     ) : (
                        <div className="text-center p-6">
                           <ImageIcon size={48} className="text-slate-300 mx-auto mb-2" />
                           {canModify && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActivePhotoSlot('before'); cameraInputRef.current?.click(); }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg"
                              >
                                Adicionar Foto
                              </button>
                           )}
                        </div>
                     )}
                   </div>
                   
                   <div 
                    onClick={() => request.photoAfter && setFullscreenImage({url: request.photoAfter, title: 'Vistoria Final (Depois)'})}
                    className="relative group rounded-[2rem] overflow-hidden border border-slate-200 bg-slate-100 h-64 shadow-md flex items-center justify-center cursor-zoom-in"
                   >
                      <div className="absolute top-4 left-4 bg-slate-900/80 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase z-10 backdrop-blur-md">Depois</div>
                      {request.photoAfter ? (
                         <>
                           <img src={request.photoAfter} alt="Depois" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm z-10">
                              <Maximize2 size={32} className="text-white scale-75 group-hover:scale-100 transition-transform" />
                              <p className="text-white font-black text-[10px] uppercase tracking-widest">Análise Técnica</p>
                           </div>
                         </>
                      ) : (
                         <div className="text-center p-6">
                            <ImageIcon size={48} className="text-slate-300 mx-auto mb-2" />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Aguardando Execução</p>
                            {canModify && (
                               <button 
                                onClick={(e) => { e.stopPropagation(); setActivePhotoSlot('after'); cameraInputRef.current?.click(); }}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg"
                               >
                                Concluir Obra
                               </button>
                            )}
                         </div>
                      )}
                   </div>
                </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <h2 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
               <Briefcase size={20} className="text-blue-600" /> Responsáveis
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Engenheiro Titular</p>
                <p className="font-black text-slate-900 text-sm">{engineer?.name || 'Não designado'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Vistoriador de Campo</p>
                {isEditingInfo ? (
                  <select 
                    className="w-full bg-transparent font-black text-slate-900 text-sm border-b border-slate-300 outline-none appearance-none"
                    value={editedTechId}
                    onChange={e => setEditedTechId(e.target.value)}
                  >
                    <option value="">Não atribuído</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                ) : (
                  <p className="font-black text-slate-900 text-sm">{tech?.name || 'Não designado'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
               <FileText size={20} className="text-indigo-600" /> Documentação
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Processo SEI</p>
                {isEditingInfo ? (
                  <input 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs"
                    value={editedSei}
                    onChange={e => setEditedSei(e.target.value)}
                  />
                ) : (
                  <p className="font-bold text-slate-700 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">{request.seiNumber || '---'}</p>
                )}
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Contrato</p>
                {isEditingInfo ? (
                  <input 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs"
                    value={editedContract}
                    onChange={e => setEditedContract(e.target.value)}
                  />
                ) : (
                  <p className="font-bold text-slate-700 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">{request.contract || '---'}</p>
                )}
              </div>
            </div>
          </div>
          
          {canModify && (
            <button 
              onClick={() => { if(window.confirm("⚠️ Excluir permanentemente este registro?")) { deleteRequest(request.id); navigate('/requests'); } }} 
              className="w-full flex items-center justify-center gap-2 py-4 text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
            >
              <Trash2 size={16} /> Excluir Registro
            </button>
          )}
        </div>
      </div>

      {fullscreenImage && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between text-white z-50 bg-gradient-to-b from-slate-950/80 to-transparent">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight italic">{fullscreenImage.title}</h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                <Hash size={12} className="text-blue-500" /> {request.protocol}
                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                <MapPin size={12} /> {request.location.address.split(',')[0]}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => handleShareImage(fullscreenImage.url, fullscreenImage.title)} className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-2xl shadow-xl hover:bg-blue-700 transition-all"><Download size={20} /></button>
              <button onClick={() => { setFullscreenImage(null); setZoomLevel(1); }} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-rose-600 text-white rounded-2xl transition-all border border-white/10"><X size={24} /></button>
            </div>
          </div>

          <div className="w-full h-full flex items-center justify-center overflow-auto p-4 cursor-grab active:cursor-grabbing scrollbar-hide">
             <img 
               src={fullscreenImage.url} 
               alt="ZoomView" 
               style={{ 
                 transform: `scale(${zoomLevel})`, 
                 transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                 maxWidth: zoomLevel > 1 ? 'none' : '90%', 
                 maxHeight: zoomLevel > 1 ? 'none' : '85%' 
               }} 
               className="rounded-lg shadow-2xl pointer-events-auto" 
             />
          </div>

          {/* BARRA DE CONTROLE DE ZOOM FLUTUANTE */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 z-50 animate-in slide-in-from-bottom-4 duration-500 shadow-2xl">
            <button 
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              className="w-12 h-12 flex items-center justify-center bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all disabled:opacity-30"
              title="Diminuir Zoom"
            >
              <ZoomOut size={20} />
            </button>
            <div className="px-4 text-[10px] font-black text-white uppercase tracking-widest min-w-[80px] text-center">
              {Math.round(zoomLevel * 100)}%
            </div>
            <button 
              onClick={handleZoomIn}
              disabled={zoomLevel >= 5}
              className="w-12 h-12 flex items-center justify-center bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all disabled:opacity-30"
              title="Aumentar Zoom"
            >
              <ZoomIn size={20} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1"></div>
            <button 
              onClick={handleResetZoom}
              className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
              title="Resetar Zoom"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetailsPage;

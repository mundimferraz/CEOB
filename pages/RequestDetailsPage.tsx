
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { 
  MapPin, Calendar, User as UserIcon, FileText, Camera, Download, Trash2, 
  Crosshair, ImageIcon, Edit2, X, Save, Loader2, UploadCloud, 
  RotateCcw, Maximize2, ZoomIn, ZoomOut, RefreshCw
} from 'lucide-react';
import { useApp } from '../App';
import { RequestStatus, AppRole } from '../types';
import { STATUS_COLORS } from '../constants';
import { addWatermarkToImage } from '../services/imageUtils';

const RequestDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requests, updateRequest, deleteRequest, users, zonals, currentUser, getZonalName, notify, canDo, isAdmin } = useApp();
  
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

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activePhotoSlot, setActivePhotoSlot] = useState<'before' | 'after' | null>(null);
  
  // Estados de Zoom
  const [fullscreenImage, setFullscreenImage] = useState<{url: string, title: string} | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canModify = isAdmin || (request?.status === RequestStatus.OPEN && canDo('edit_request'));

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
    if (isEditing && !mapRef.current) {
      const L = (window as any).L;
      if (!L) return;
      setTimeout(() => {
        const container = document.getElementById('edit-map-container');
        if (!container) return;
        mapRef.current = L.map('edit-map-container').setView([editedLat, editedLng], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
        markerRef.current = L.marker([editedLat, editedLng], { draggable: true }).addTo(mapRef.current);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current.getLatLng();
          setEditedLat(pos.lat);
          setEditedLng(pos.lng);
        });
      }, 100);
    }
    return () => { if (!isEditing && mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [isEditing]);

  if (!request) return <div className="p-12 text-center font-bold text-slate-400">Não encontrado</div>;

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      await updateRequest({
        ...request,
        protocol: editedProtocol,
        seiNumber: editedSei,
        contract: editedContract,
        description: editedDescription,
        technicianId: editedTechId,
        location: { ...request.location, latitude: editedLat, longitude: editedLng, address: editedAddress }
      });
      setIsEditing(false);
      notify("Alterações gravadas com sucesso.");
    } catch (err) {
      notify("Erro ao atualizar.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activePhotoSlot) {
      const isBefore = activePhotoSlot === 'before';
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        try {
          const watermarked = await addWatermarkToImage(rawBase64, {
            address: request.location.address,
            lat: request.location.latitude,
            lng: request.location.longitude,
            userName: tech?.name || currentUser?.name || 'Operador',
            date: new Date()
          });
          const updatedData = isBefore ? { ...request, photoBefore: watermarked } : { ...request, photoAfter: watermarked, status: RequestStatus.COMPLETED };
          await updateRequest(updatedData);
          notify("Foto atualizada.");
        } finally {
          setActivePhotoSlot(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // 1. Cabeçalho Azul Escuro (Slate-950)
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('LAUDO TÉCNICO DE INSPEÇÃO', 15, 18);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('SISTEMA DE GESTÃO DE REPAROS EM VIAS - SGR-VIAS', 15, 25);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`PROTOCOLO: ${request.protocol}`, pageWidth - 15, 18, { align: 'right' });
    doc.text(`STATUS: ${request.status.toUpperCase()}`, pageWidth - 15, 25, { align: 'right' });

    // 2. Barra de Metadados
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 35, pageWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const emissionDate = new Date().toLocaleDateString('pt-BR');
    doc.text(`Documento SEI: ${request.seiNumber || 'N/A'}  |  Contrato: ${request.contract || 'N/A'}  |  Emissão: ${emissionDate}`, 15, 41.5);

    let y = 60;

    const renderSectionTitle = (num: string, title: string, posY: number) => {
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${num}. ${title}`, 15, posY);
      doc.setDrawColor(226, 232, 240);
      doc.line(15, posY + 2, pageWidth - 15, posY + 2);
      return posY + 12;
    };

    // SEÇÃO 1: DADOS DE LOCALIZAÇÃO
    y = renderSectionTitle('1', 'DADOS DE LOCALIZAÇÃO', y);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Endereço:', 15, y);
    doc.setFont('helvetica', 'normal');
    const splitAddress = doc.splitTextToSize(request.location.address, 160);
    doc.text(splitAddress, 40, y);
    
    y += (splitAddress.length * 5) + 2;
    doc.setFont('helvetica', 'bold');
    doc.text('Coordenadas:', 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${request.location.latitude.toFixed(6)}, ${request.location.longitude.toFixed(6)}`, 40, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Unidade:', 100, y);
    doc.setFont('helvetica', 'normal');
    doc.text(getZonalName(request.zonal), 120, y);

    // SEÇÃO 2: RESPONSABILIDADE TÉCNICA
    y += 15;
    y = renderSectionTitle('2', 'RESPONSABILIDADE TÉCNICA', y);
    doc.setFont('helvetica', 'bold');
    doc.text('Eng. Responsável:', 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(engineer?.name || '---', 45, y);
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Vistoriador:', 15, y);
    doc.setFont('helvetica', 'normal');
    doc.text(tech?.name || '---', 45, y);

    // SEÇÃO 3: DESCRITIVO TÉCNICO E PARECER
    y += 15;
    y = renderSectionTitle('3', 'DESCRITIVO TÉCNICO E PARECER', y);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const splitDesc = doc.splitTextToSize(request.description || 'Nenhum parecer técnico registrado.', 180);
    doc.text(splitDesc, 15, y);

    // SEÇÃO 4: EVIDÊNCIAS FOTOGRÁFICAS
    y += (splitDesc.length * 5) + 15;
    y = renderSectionTitle('4', 'EVIDÊNCIAS FOTOGRÁFICAS', y);
    const imgWidth = 85;
    const imgHeight = 65;

    // Foto Antes
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('REGISTRO INICIAL (ANTES)', 15, y);
    if (request.photoBefore) {
      try { doc.addImage(request.photoBefore, 'JPEG', 15, y + 4, imgWidth, imgHeight); } catch (e) {}
    } else {
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y + 4, imgWidth, imgHeight, 'F');
      doc.text('Sem registro fotográfico', 35, y + 35);
    }

    // Foto Depois
    doc.text('REGISTRO FINAL (DEPOIS)', 110, y);
    if (request.photoAfter) {
      try { doc.addImage(request.photoAfter, 'JPEG', 110, y + 4, imgWidth, imgHeight); } catch (e) {}
    } else {
      doc.setFillColor(241, 245, 249);
      doc.rect(110, y + 4, imgWidth, imgHeight, 'F');
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(10);
      doc.text('Aguardando conclusão', 130, y + 35);
    }

    // Rodapé
    const footerY = 285;
    doc.setDrawColor(226, 232, 240);
    doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.text(`SGR-Vias - Sistema de Gestão de Reparos  |  Página 1 de 1`, 15, footerY);
    doc.text(`ID Único: ${request.id}`, pageWidth - 15, footerY, { align: 'right' });

    doc.save(`Laudo_Tecnico_${request.protocol}.pdf`);
    notify("Laudo Técnico gerado com sucesso!");
  };

  const handleZoom = (delta: number) => {
    setZoomScale(prev => Math.min(Math.max(1, prev + delta), 4));
  };

  const resetZoom = () => {
    setZoomScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 pb-24">
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${STATUS_COLORS[request.status]}`}>{request.status}</span>
              {isEditing && <span className="bg-amber-600 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase">Modo Edição</span>}
           </div>
           {isEditing ? (
             <input className="text-2xl font-black text-slate-900 border-b-2 border-blue-600 outline-none uppercase italic" value={editedProtocol} onChange={e => setEditedProtocol(e.target.value)} />
           ) : (
             <h1 className="text-2xl font-black text-slate-900 uppercase italic">{request.protocol}</h1>
           )}
        </div>
        <div className="flex gap-2">
           {isEditing ? (
             <>
               <button onClick={() => setIsEditing(false)} className="h-12 px-6 bg-slate-100 rounded-xl font-black text-[10px] uppercase">Cancelar</button>
               <button onClick={handleUpdate} className="h-12 px-6 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase shadow-xl">Salvar</button>
             </>
           ) : (
             <>
               <button onClick={generatePDF} className="h-12 px-6 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2"><Download size={16}/> PDF</button>
               {canModify && <button onClick={() => setIsEditing(true)} className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-xl"><Edit2 size={18} /></button>}
             </>
           )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              {isEditing && (
                <div id="edit-map-container" className="h-64 rounded-2xl border border-slate-200 shadow-inner overflow-hidden mb-4"></div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-slate-900 p-4 rounded-2xl text-white">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">GPS</p>
                    <p className="text-xs font-bold">{request.location.latitude.toFixed(6)}, {request.location.longitude.toFixed(6)}</p>
                 </div>
                 <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Endereço</p>
                    {isEditing ? (
                      <textarea className="w-full bg-transparent text-xs font-bold text-blue-900 outline-none" rows={2} value={editedAddress} onChange={e => setEditedAddress(e.target.value)} />
                    ) : (
                      <p className="text-xs font-bold text-blue-900 line-clamp-2">{request.location.address}</p>
                    )}
                 </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                {isEditing ? (
                  <textarea className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none italic" rows={4} value={editedDescription} onChange={e => setEditedDescription(e.target.value)} />
                ) : (
                  <p className="text-sm font-medium text-slate-700 italic">"{request.description}"</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {['before', 'after'].map(slot => {
                    const img = slot === 'before' ? request.photoBefore : request.photoAfter;
                    return (
                      <div key={slot} className="relative group rounded-[2rem] overflow-hidden border border-slate-200 bg-slate-50 h-60 flex items-center justify-center cursor-zoom-in">
                         {img ? (
                           <>
                             <img 
                               src={img} 
                               className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                               onClick={() => setFullscreenImage({url: img, title: slot === 'before' ? 'Antes' : 'Depois'})}
                             />
                             <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                {isEditing && isAdmin && (
                                   <div className="flex flex-col gap-1">
                                      <button onClick={() => { setActivePhotoSlot(slot as any); cameraInputRef.current?.click(); }} className="p-2 bg-blue-600 text-white rounded-lg shadow-lg"><Camera size={14}/></button>
                                      <button onClick={() => { setActivePhotoSlot(slot as any); galleryInputRef.current?.click(); }} className="p-2 bg-slate-900 text-white rounded-lg shadow-lg"><UploadCloud size={14}/></button>
                                   </div>
                                )}
                             </div>
                             <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[8px] text-white font-black uppercase tracking-widest pointer-events-none">
                                {slot === 'before' ? 'Registro Antes' : 'Registro Depois'}
                             </div>
                           </>
                         ) : (
                           <div className="flex flex-col gap-2 w-full px-8">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">{slot === 'before' ? 'S/ Foto Antes' : 'S/ Foto Depois'}</p>
                              {isEditing && isAdmin && (
                                <>
                                  <button onClick={() => { setActivePhotoSlot(slot as any); cameraInputRef.current?.click(); }} className="h-9 bg-blue-600 text-white rounded-xl text-[8px] font-black uppercase flex items-center justify-center gap-2"><Camera size={14}/> Câmera</button>
                                  <button onClick={() => { setActivePhotoSlot(slot as any); galleryInputRef.current?.click(); }} className="h-9 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase flex items-center justify-center gap-2"><UploadCloud size={14}/> Galeria</button>
                                </>
                              )}
                           </div>
                         )}
                      </div>
                    );
                 })}
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-tight">Responsabilidade</h3>
              <div className="space-y-3">
                 <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                    <p className="text-[8px] font-black text-blue-500 uppercase mb-1">Engenheiro Titular</p>
                    <p className="text-xs font-black text-slate-900">{engineer?.name || 'Não designado'}</p>
                 </div>
                 <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Vistoriador</p>
                    {isEditing && isAdmin ? (
                      <select className="w-full bg-transparent text-xs font-black outline-none border-b border-slate-200" value={editedTechId} onChange={e => setEditedTechId(e.target.value)}>
                        <option value="">Não atribuído</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    ) : (
                      <p className="text-xs font-black text-slate-900">{tech?.name || 'Não atribuído'}</p>
                    )}
                 </div>
              </div>
           </div>
            {isAdmin && (
             <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
               <h3 className="text-xs font-black uppercase tracking-tight">Administração</h3>
               <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Processo SEI</label>
                  {isEditing ? <input className="w-full h-10 px-3 bg-slate-50 border rounded-lg text-xs font-bold" value={editedSei} onChange={e => setEditedSei(e.target.value)} /> : <p className="text-xs font-bold">{request.seiNumber}</p>}
               </div>
               <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Contrato</label>
                  {isEditing ? <input className="w-full h-10 px-3 bg-slate-50 border rounded-lg text-xs font-bold" value={editedContract} onChange={e => setEditedContract(e.target.value)} /> : <p className="text-xs font-bold">{request.contract}</p>}
               </div>
               {canDo('delete_request') && (
                 <button onClick={() => { if(window.confirm("Excluir registro permanentemente?")) { deleteRequest(request.id); navigate('/requests'); } }} className="w-full h-12 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-black text-[9px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">Excluir Registro</button>
               )}
             </div>
           )}
        </div>
      </div>

      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onTouchMove={handleMouseMove}
          onTouchEnd={() => setIsDragging(false)}
        >
           <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
              <div className="pointer-events-auto">
                 <h2 className="text-white font-black uppercase tracking-widest text-sm">{fullscreenImage.title}</h2>
                 <p className="text-slate-400 text-[9px] font-bold uppercase">{request.protocol}</p>
              </div>
              <button onClick={() => { setFullscreenImage(null); resetZoom(); }} className="pointer-events-auto p-4 bg-white/10 text-white rounded-2xl hover:bg-rose-600 transition-all"><X size={24}/></button>
           </div>
           <div className={`w-full h-full flex items-center justify-center overflow-hidden ${zoomScale > 1 ? 'cursor-grab' : 'cursor-default'} ${isDragging ? 'cursor-grabbing' : ''}`} onMouseDown={handleMouseDown} onTouchStart={handleMouseDown}>
              <img src={fullscreenImage.url} className="max-w-full max-h-full rounded-lg shadow-2xl transition-transform duration-200" style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${zoomScale})`, pointerEvents: zoomScale > 1 ? 'none' : 'auto' }} draggable={false} />
           </div>
           <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/40 backdrop-blur-2xl p-2 rounded-3xl border border-white/10 shadow-2xl">
              <button onClick={() => handleZoom(-0.5)} className="w-12 h-12 flex items-center justify-center bg-white/10 text-white rounded-2xl hover:bg-blue-600"><ZoomOut size={20}/></button>
              <div className="px-4 text-white font-black text-xs min-w-[60px] text-center">{zoomScale.toFixed(1)}x</div>
              <button onClick={() => handleZoom(0.5)} className="w-12 h-12 flex items-center justify-center bg-white/10 text-white rounded-2xl hover:bg-blue-600"><ZoomIn size={20}/></button>
              <div className="w-px h-8 bg-white/10 mx-1"></div>
              <button onClick={resetZoom} className="w-12 h-12 flex items-center justify-center bg-white/10 text-white rounded-2xl hover:bg-amber-600"><RefreshCw size={18}/></button>
           </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetailsPage;

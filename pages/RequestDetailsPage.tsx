
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { 
  MapPin, Calendar, User as UserIcon, FileText, Camera, Download, Trash2, 
  Crosshair, ImageIcon, Edit2, X, Save, Loader2, UploadCloud, 
  RotateCcw, Maximize2, ZoomIn, ZoomOut
} from 'lucide-react';
import { useApp } from '../App';
import { RequestStatus, AppRole } from '../types';
import { STATUS_COLORS } from '../constants';
import { addWatermarkToImage } from '../services/imageUtils';

const RequestDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requests, updateRequest, deleteRequest, users, zonals, currentUser, getZonalName, notify, canDo } = useApp();
  
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
  const [fullscreenImage, setFullscreenImage] = useState<{url: string, title: string} | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const isAdmin = currentUser?.role === AppRole.ADMIN || currentUser?.name === 'claudioasousa';
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
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('LAUDO TÉCNICO SGR-VIAS', 20, 20);
    doc.setFontSize(9);
    doc.text(`Protocolo: ${request.protocol} | Status: ${request.status}`, 20, 28);
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text('DETALHES DA LOCALIZAÇÃO:', 20, 55);
    doc.text(request.location.address, 20, 62, { maxWidth: 170 });
    
    doc.text('DESCRIÇÃO TÉCNICA:', 20, 85);
    doc.text(request.description, 20, 92, { maxWidth: 170 });

    if (request.photoBefore) {
        doc.text('EVIDÊNCIA ANTES:', 20, 130);
        try { doc.addImage(request.photoBefore, 'JPEG', 20, 135, 80, 60); } catch(e) {}
    }

    if (request.photoAfter) {
        doc.text('EVIDÊNCIA DEPOIS:', 110, 130);
        try { doc.addImage(request.photoAfter, 'JPEG', 110, 135, 80, 60); } catch(e) {}
    }

    doc.save(`Laudo_${request.protocol}.pdf`);
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
                      <div key={slot} className="relative group rounded-[2rem] overflow-hidden border border-slate-200 bg-slate-50 h-60 flex items-center justify-center">
                         {img ? (
                           <>
                             <img src={img} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                <button onClick={() => setFullscreenImage({url: img, title: slot === 'before' ? 'Antes' : 'Depois'})} className="p-3 bg-white/20 rounded-xl text-white"><Maximize2 size={20}/></button>
                                {canModify && (
                                   <div className="flex flex-col gap-2">
                                      <button onClick={() => { setActivePhotoSlot(slot as any); cameraInputRef.current?.click(); }} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">Trocar (Cam)</button>
                                      <button onClick={() => { setActivePhotoSlot(slot as any); galleryInputRef.current?.click(); }} className="px-3 py-2 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">Trocar (Gal)</button>
                                   </div>
                                )}
                             </div>
                           </>
                         ) : (
                           <div className="flex flex-col gap-2 w-full px-8">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">{slot === 'before' ? 'S/ Foto Antes' : 'S/ Foto Depois'}</p>
                              {canModify && (
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
                    {isEditing ? (
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
             <button onClick={() => { if(window.confirm("Excluir registro permanentemente?")) { deleteRequest(request.id); navigate('/requests'); } }} className="w-full h-12 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-black text-[9px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">Excluir Registro</button>
           )}
        </div>
      </div>

      {fullscreenImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4">
           <button onClick={() => setFullscreenImage(null)} className="absolute top-6 right-6 p-4 bg-white/10 text-white rounded-2xl"><X size={24}/></button>
           <img src={fullscreenImage.url} className="max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default RequestDetailsPage;

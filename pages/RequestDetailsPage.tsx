
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { MapPin, Calendar, User as UserIcon, FileText, Camera, Download, Trash2, CheckCircle, AlertTriangle, Crosshair, ImageIcon } from 'lucide-react';
import { useApp } from '../App';
import { RequestStatus } from '../types';
import { STATUS_COLORS } from '../constants';

const RequestDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requests, updateRequest, users, getZonalName, getRoleLabel } = useApp();
  
  const request = requests.find(r => r.id === id);
  const tech = users.find(u => u.id === request?.technicianId);

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

  const generatePDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 30;

    // Cabeçalho Institucional
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LAUDO TÉCNICO DE VISTORIA - SGR-VIAS', margin, 17);

    doc.setTextColor(15, 23, 42);
    y = 40;

    // Dados de Identificação
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. DADOS DE IDENTIFICAÇÃO', margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Protocolo: ${request.protocol}`, margin, y);
    doc.text(`Processo SEI: ${request.seiNumber}`, margin + 90, y);
    y += 7;
    doc.text(`Contrato: ${request.contract}`, margin, y);
    doc.text(`Zonal/Unidade: ${getZonalName(request.zonal)}`, margin + 90, y);
    y += 15;

    // Localização
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. LOCALIZAÇÃO E GEORREFERENCIAMENTO', margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Endereço: ${request.location.address}`, margin, y);
    y += 7;
    doc.text(`Coordenadas: ${request.location.latitude.toFixed(6)}, ${request.location.longitude.toFixed(6)}`, margin, y);
    y += 15;

    // Parecer Técnico
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('3. PARECER TÉCNICO', margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(request.description, 170);
    doc.text(descLines, margin, y);
    y += (descLines.length * 5) + 15;

    // FOTOGRAFIAS (A seção solicitada)
    if (request.photoBefore) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('4. EVIDÊNCIAS FOTOGRÁFICAS (ANTES)', margin, y);
      y += 10;

      // Adicionar Imagem
      // Calculando tamanho para caber proporcionalmente
      const imgWidth = 80;
      const imgHeight = 60;
      
      try {
        doc.addImage(request.photoBefore, 'JPEG', margin, y, imgWidth, imgHeight);
        y += imgHeight + 8;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(`Fig 1. Registro fotográfico inicial realizado em ${new Date(request.createdAt).toLocaleDateString()}`, margin, y);
        y += 15;
      } catch (e) {
        doc.text('[Erro ao carregar imagem no PDF]', margin, y);
        y += 10;
      }
    }

    // Responsabilidade
    if (y > 240) { doc.addPage(); y = 30; }
    
    const roleName = tech ? getRoleLabel(tech.role) : 'Técnico';
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('5. RESPONSABILIDADE', margin, y);
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Vistoriador: ${tech?.name}`, margin, y);
    y += 7;
    doc.text(`Cargo/Função: ${roleName}`, margin, y);
    y += 7;
    doc.text(`Data da Emissão: ${new Date().toLocaleDateString('pt-BR')}`, margin, y);

    doc.save(`Laudo_Tecnico_${request.protocol}.pdf`);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase ${STATUS_COLORS[request.status]}`}>
              {request.status}
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REGISTRO: {request.id}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">{request.protocol}</h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={generatePDF}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl font-bold text-sm"
          >
            <Download size={18} />
            Gerar Laudo PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-black text-slate-900 uppercase tracking-tight">Memorial Descritivo</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleStatusChange(RequestStatus.IN_PROGRESS)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${request.status === RequestStatus.IN_PROGRESS ? 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm' : 'bg-white text-slate-400 border-slate-200'}`}
                >
                  EM EXECUÇÃO
                </button>
                <button 
                  onClick={() => handleStatusChange(RequestStatus.COMPLETED)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${request.status === RequestStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm' : 'bg-white text-slate-400 border-slate-200'}`}
                >
                  CONCLUÍDO
                </button>
              </div>
            </div>
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Processo SEI</p>
                  <p className="font-bold text-slate-900 text-lg">{request.seiNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Contrato</p>
                  <p className="font-bold text-slate-900 text-lg">{request.contract}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 flex items-start gap-4">
                   <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                      <Crosshair size={24} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Coordenadas GPS</p>
                      <p className="font-bold text-white text-sm tracking-widest">
                        {request.location.latitude.toFixed(6)}, {request.location.longitude.toFixed(6)}
                      </p>
                   </div>
                </div>

                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                   <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                      <MapPin size={24} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Logradouro</p>
                      <p className="font-bold text-blue-900 text-sm leading-snug">{request.location.address}</p>
                   </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Parecer Técnico</p>
                <div className="bg-slate-50 p-6 rounded-[2rem] text-slate-700 font-medium leading-relaxed border border-slate-100 italic">
                  "{request.description}"
                </div>
              </div>

              {/* Seção Visual de Evidências na Tela */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Evidência Fotográfica Principal</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="relative group rounded-3xl overflow-hidden border border-slate-200">
                     <div className="absolute top-4 left-4 bg-slate-900/80 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase z-10">Estado Inicial (Antes)</div>
                     {request.photoBefore ? (
                        <img src={request.photoBefore} alt="Antes" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
                     ) : (
                        <div className="w-full h-64 bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                           <ImageIcon size={48} />
                           <span className="text-xs font-black uppercase mt-2">Sem imagem capturada</span>
                        </div>
                     )}
                   </div>
                   
                   {/* Espaço para foto do depois se existir */}
                   {request.photoAfter && (
                     <div className="relative group rounded-3xl overflow-hidden border border-slate-200">
                        <div className="absolute top-4 left-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase z-10">Conclusão (Depois)</div>
                        <img src={request.photoAfter} alt="Depois" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="font-black text-slate-900 uppercase tracking-tight mb-6">Equipe Responsável</h2>
            <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                {tech?.name.charAt(0)}
              </div>
              <div>
                <p className="font-black text-slate-900 leading-tight">{tech?.name}</p>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{tech ? getRoleLabel(tech.role) : 'Técnico'}</span>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Data da Vistoria</span>
                <span className="text-slate-900 font-bold">{new Date(request.visitDate).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Lotação</span>
                <span className="text-slate-900 font-bold">{getZonalName(request.zonal)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl">
             <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900">
                   <FileText size={18} />
                </div>
                <h3 className="font-black uppercase tracking-tight text-sm">Resumo da Ação</h3>
             </div>
             <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">Esta solicitação foi protocolada sob o regime de manutenção urbana e requer atenção imediata conforme diretrizes da Unidade Operacional.</p>
             <div className="space-y-2">
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                   <div className={`h-full bg-emerald-500 transition-all ${request.status === RequestStatus.COMPLETED ? 'w-full' : request.status === RequestStatus.IN_PROGRESS ? 'w-1/2' : 'w-1/4'}`}></div>
                </div>
                <p className="text-[10px] font-black text-slate-500 text-right uppercase">{request.status}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailsPage;

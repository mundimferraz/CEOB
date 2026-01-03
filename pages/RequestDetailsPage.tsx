
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { MapPin, Calendar, User as UserIcon, FileText, Camera, Download, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
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

  const handleAfterPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateRequest({ ...request, photoAfter: reader.result as string, status: RequestStatus.COMPLETED });
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 30;

    doc.setFontSize(18);
    doc.text('Relatório de Visita Técnica - SGR-Vias', margin, y);
    y += 15;

    doc.setFontSize(10);
    doc.text(`Protocolo: ${request.protocol}`, margin, y);
    doc.text(`SEI: ${request.seiNumber}`, margin + 100, y);
    y += 10;
    doc.text(`Unidade: ${getZonalName(request.zonal)}`, margin, y);
    doc.text(`Status: ${request.status}`, margin + 100, y);
    y += 10;
    doc.text(`Contrato: ${request.contract}`, margin, y);
    doc.text(`Data: ${request.visitDate}`, margin + 100, y);
    y += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Descrição da Ocorrência:', margin, y);
    doc.setFont('helvetica', 'normal');
    y += 7;
    doc.setFontSize(10);
    const descLines = doc.splitTextToSize(request.description, 170);
    doc.text(descLines, margin, y);
    y += (descLines.length * 5) + 5;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Localização:', margin, y);
    doc.setFont('helvetica', 'normal');
    y += 7;
    doc.setFontSize(10);
    doc.text(`Endereço: ${request.location.address}`, margin, y);
    y += 15;

    const roleName = tech ? getRoleLabel(tech.role) : 'Técnico';
    doc.text(`Responsável: ${tech?.name} (${roleName})`, margin, y);
    y += 20;
    doc.text('-- Fotos registradas digitalmente no sistema --', margin, y, { align: 'left' });

    doc.save(`Relatorio_${request.protocol}.pdf`);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase ${STATUS_COLORS[request.status]}`}>
              {request.status}
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {request.id}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{request.protocol}</h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={generatePDF}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-xl font-bold text-sm"
          >
            <Download size={18} />
            Relatório PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-900">Detalhes da Ocorrência</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleStatusChange(RequestStatus.IN_PROGRESS)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black border transition-all ${request.status === RequestStatus.IN_PROGRESS ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-400'}`}
                >
                  OPERATIVO
                </button>
                <button 
                  onClick={() => handleStatusChange(RequestStatus.COMPLETED)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black border transition-all ${request.status === RequestStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400'}`}
                >
                  CONCLUIR
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Processo SEI</p>
                  <p className="font-bold text-slate-900">{request.seiNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contrato</p>
                  <p className="font-bold text-slate-900">{request.contract}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data Vistoria</p>
                  <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Calendar size={16} className="text-blue-500" />
                    <span>{new Date(request.visitDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unidade</p>
                  <p className="font-bold text-slate-900">{getZonalName(request.zonal)}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Descrição Técnica</p>
                <div className="bg-slate-50 p-5 rounded-2xl text-slate-700 font-medium">
                  {request.description}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Localização</p>
                <div className="flex items-start gap-4 p-5 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                     <MapPin size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-blue-900">{request.location.address}</p>
                    <p className="text-[10px] text-blue-700 font-black mt-1 uppercase">
                      LAT: {request.location.latitude.toFixed(4)} | LON: {request.location.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="font-bold text-lg text-slate-900 mb-6">Equipe Vinculada</h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl shadow-inner">
                {tech?.name.charAt(0)}
              </div>
              <div>
                <p className="font-black text-slate-900 text-lg leading-tight">{tech?.name}</p>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{tech ? getRoleLabel(tech.role) : 'Técnico'}</span>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Abertura</span>
              <span className="text-slate-900">{new Date(request.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailsPage;


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
  const { requests, updateRequest, users } = useApp();
  
  const request = requests.find(r => r.id === id);
  const tech = users.find(u => u.id === request?.technicianId);

  const [uploadingAfter, setUploadingAfter] = useState(false);

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
    doc.text(`Zonal: ${request.zonal}`, margin, y);
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
    y += 5;
    doc.text(`Coordenadas: ${request.location.latitude}, ${request.location.longitude}`, margin, y);
    y += 15;

    doc.text(`Responsável: ${tech?.name} (${tech?.role})`, margin, y);
    
    // In a real app we'd add images here using doc.addImage(request.photoBefore, ...)
    // For the demo we mention them.
    y += 20;
    doc.text('-- Fotos registradas digitalmente no sistema --', margin, y, { align: 'left' });

    doc.save(`Relatorio_${request.protocol}.pdf`);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[request.status]}`}>
              {request.status.toUpperCase()}
            </span>
            <span className="text-sm font-medium text-slate-500">#{request.id}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{request.protocol}</h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={generatePDF}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg"
          >
            <Download size={18} />
            Gerar Relatório PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-lg">Informações Detalhadas</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleStatusChange(RequestStatus.IN_PROGRESS)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border ${request.status === RequestStatus.IN_PROGRESS ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-500'}`}
                >
                  EM ANDAMENTO
                </button>
                <button 
                  onClick={() => handleStatusChange(RequestStatus.COMPLETED)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border ${request.status === RequestStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}
                >
                  CONCLUIR
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Número SEI</p>
                  <p className="font-medium text-slate-900">{request.seiNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contrato</p>
                  <p className="font-medium text-slate-900">{request.contract}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Data da Visita</p>
                  <div className="flex items-center gap-2 text-slate-900">
                    <Calendar size={16} className="text-blue-500" />
                    <span className="font-medium">{new Date(request.visitDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Zonal Atribuída</p>
                  <p className="font-medium text-slate-900">{request.zonal}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Descrição do Problema</p>
                <div className="bg-slate-50 p-4 rounded-lg text-slate-700 leading-relaxed">
                  {request.description}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Localização Geográfica</p>
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <MapPin className="text-blue-600 mt-1" size={20} />
                  <div>
                    <p className="font-semibold text-blue-900">{request.location.address}</p>
                    <p className="text-sm text-blue-700 font-mono mt-1">
                      Lat: {request.location.latitude} | Long: {request.location.longitude}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Photos Comparison */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="font-semibold text-lg">Registro Fotográfico (Antes x Depois)</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-3 text-center uppercase tracking-widest italic">Antes</p>
                  <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-inner">
                    {request.photoBefore ? (
                      <img src={request.photoBefore} alt="Antes" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Camera size={32} className="mb-2 opacity-20" />
                        <span className="text-xs">Sem foto do antes</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-500 mb-3 text-center uppercase tracking-widest italic">Depois</p>
                  <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-inner relative group">
                    {request.photoAfter ? (
                      <img src={request.photoAfter} alt="Depois" className="w-full h-full object-cover" />
                    ) : (
                      <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-slate-200 transition-colors">
                        <Camera size={32} className="mb-2 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">Registrar Conclusão</span>
                        <span className="text-xs text-slate-400 mt-1">Upload da foto do depois</span>
                        <input type="file" capture="environment" className="hidden" onChange={handleAfterPhoto} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Equipe Técnica</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                {tech?.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-900">{tech?.name}</p>
                <p className="text-xs text-slate-500 uppercase font-semibold">{tech?.role}</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
              <span>Criado em</span>
              <span className="font-medium text-slate-900">{new Date(request.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
            <div className="flex items-center gap-2 text-amber-800 font-bold mb-3">
              <AlertTriangle size={20} />
              <span>Aviso Institucional</span>
            </div>
            <p className="text-sm text-amber-700 leading-relaxed">
              Todos os registros fotográficos e de geolocalização são auditáveis e registrados no sistema central da SEOSP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailsPage;

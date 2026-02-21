
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { 
  FilePresent, Download, ChevronRight, 
  Presentation as PresentationIcon, 
  TrendingUp, Shield, Zap, Globe, 
  BarChart3, Loader2, CheckCircle2
} from 'lucide-react';
import { useApp } from '../App';

const PresentationPage: React.FC = () => {
  const { notify } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInvestorPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const addSlideBackground = () => {
        // Dark professional background
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Decorative elements
        doc.setDrawColor(30, 41, 59);
        doc.line(0, pageHeight - 20, pageWidth, pageHeight - 20);
        
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.text('SGR-VIAS | INVESTOR PRESENTATION 2026', 15, pageHeight - 10);
        doc.text('CONFIDENTIAL', pageWidth - 35, pageHeight - 10);
      };

      // --- SLIDE 1: COVER ---
      addSlideBackground();
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(42);
      doc.text('SGR-VIAS', pageWidth / 2, pageHeight / 2 - 10, { align: 'center' });
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(59, 130, 246);
      doc.text('Transformação Digital na Gestão de Infraestrutura Urbana', pageWidth / 2, pageHeight / 2 + 5, { align: 'center' });
      
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(1);
      doc.line(pageWidth / 2 - 40, pageHeight / 2 + 15, pageWidth / 2 + 40, pageHeight / 2 + 15);

      // --- SLIDE 2: O PROBLEMA ---
      doc.addPage();
      addSlideBackground();
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('O DESAFIO ATUAL', 15, 30);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      const problems = [
        '• Processos manuais e descentralizados de vistoria.',
        '• Falta de georreferenciamento preciso das ocorrências.',
        '• Dificuldade na comprovação temporal (Antes vs Depois).',
        '• Logística ineficiente e rotas de campo não otimizadas.',
        '• Ausência de dados consolidados para tomada de decisão.'
      ];
      doc.text(problems, 20, 55);

      // --- SLIDE 3: A SOLUÇÃO ---
      doc.addPage();
      addSlideBackground();
      doc.setTextColor(59, 130, 246);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('A SOLUÇÃO SGR-VIAS', 15, 30);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Uma plataforma SaaS completa para gestão do ciclo de vida de reparos urbanos.', 15, 40);

      const features = [
        { t: 'Inventário Inteligente', d: 'Captura GPS automática e geocodificação de endereços.' },
        { t: 'Auditoria Visual', d: 'Fotos com marca d\'água inviolável (Data/Hora/GPS).' },
        { t: 'Logística de Campo', d: 'Otimização de rotas e integração nativa com Google Maps.' },
        { t: 'Relatórios Executivos', d: 'Exportação em PDF, CSV e KML (Google Earth).' }
      ];

      let fy = 65;
      features.forEach(f => {
        doc.setTextColor(59, 130, 246);
        doc.setFont('helvetica', 'bold');
        doc.text(f.t, 20, fy);
        doc.setTextColor(203, 213, 225);
        doc.setFont('helvetica', 'normal');
        doc.text(f.d, 20, fy + 6);
        fy += 20;
      });

      // --- SLIDE 4: TECNOLOGIA ---
      doc.addPage();
      addSlideBackground();
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('STACK TECNOLÓGICA', 15, 30);
      
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text('Arquitetura Moderna e Escalável', 15, 40);

      const tech = [
        '• Frontend: React 19 + Tailwind CSS (Interface de alta performance)',
        '• Backend: Supabase (Real-time Database & Auth)',
        '• Geoprocessamento: Leaflet & OpenStreetMap',
        '• Mobile-First: Progressive Web App (PWA) ready',
        '• Segurança: RBAC (Controle de acesso baseado em funções)'
      ];
      doc.setTextColor(203, 213, 225);
      doc.text(tech, 20, 60);

      // --- SLIDE 5: VALOR PARA O INVESTIDOR ---
      doc.addPage();
      addSlideBackground();
      doc.setTextColor(16, 185, 129); // Emerald
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('VALOR E IMPACTO', 15, 30);
      
      const values = [
        { t: 'Redução de Custos', d: 'Otimização de rotas reduz consumo de combustível em até 30%.' },
        { t: 'Transparência Total', d: 'Trilha de auditoria completa para conformidade com órgãos públicos.' },
        { t: 'Escalabilidade', d: 'Modelo pronto para expansão em múltiplas prefeituras e estados.' },
        { t: 'Dados Estratégicos', d: 'BI integrado para identificação de gargalos na infraestrutura.' }
      ];

      let vy = 60;
      values.forEach(v => {
        doc.setTextColor(16, 185, 129);
        doc.setFont('helvetica', 'bold');
        doc.text(v.t, 20, vy);
        doc.setTextColor(203, 213, 225);
        doc.setFont('helvetica', 'normal');
        doc.text(v.d, 20, vy + 6);
        vy += 25;
      });

      // --- SLIDE 6: FINAL ---
      doc.addPage();
      addSlideBackground();
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.text('SGR-VIAS', pageWidth / 2, pageHeight / 2 - 10, { align: 'center' });
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text('O Futuro da Gestão Urbana é Digital.', pageWidth / 2, pageHeight / 2 + 5, { align: 'center' });

      doc.save(`SGR-Vias_Investor_Presentation_${Date.now()}.pdf`);
      notify("Apresentação gerada com sucesso!");
    } catch (error) {
      console.error(error);
      notify("Erro ao gerar apresentação.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 pb-24 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp size={18} className="text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Pitch Deck & Business</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Apresentação Executiva</h1>
          <p className="text-slate-500 font-medium">Material de apoio para investidores e parceiros estratégicos.</p>
        </div>
        <button 
          onClick={generateInvestorPDF}
          disabled={isGenerating}
          className="flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-2xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          Baixar PDF para Investidores
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <Zap size={24} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-tight">Eficiência Operacional</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">Demonstre como o sistema reduz o tempo de resposta e otimiza recursos públicos.</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <Shield size={24} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-tight">Transparência & Compliance</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">Foco na integridade dos dados e na trilha de auditoria para prestação de contas.</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <BarChart3 size={24} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-tight">Escalabilidade SaaS</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">Potencial de mercado para expansão em escala nacional e internacional.</p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative">
        <div className="max-w-2xl relative z-10">
          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight mb-4">O que contém no PDF?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {[
               'Análise do Problema de Mercado',
               'Value Proposition (Proposta de Valor)',
               'Arquitetura Tecnológica',
               'Recursos de Auditoria e Segurança',
               'Impacto Financeiro e Logístico',
               'Roadmap de Desenvolvimento'
             ].map((item, i) => (
               <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-blue-600" />
                  <span className="text-xs font-bold text-slate-700">{item}</span>
               </div>
             ))}
          </div>
        </div>
        <PresentationIcon size={200} className="absolute -bottom-10 -right-10 text-slate-200/50 -rotate-12" />
      </div>
    </div>
  );
};

export default PresentationPage;

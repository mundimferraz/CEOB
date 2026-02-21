
import React from 'react';
import { 
  BookOpen, ShieldCheck, MapPin, Camera, FileText, 
  Route as RouteIcon, Users, History, Download, 
  CheckCircle2, Info, ChevronRight, Globe
} from 'lucide-react';

const ManualPage: React.FC = () => {
  const sections = [
    {
      id: 'intro',
      title: 'Introdução ao SGR-Vias',
      icon: <Info className="text-blue-600" />,
      content: 'O SGR-Vias (Sistema de Gestão de Reparos em Vias) é uma plataforma técnica projetada para o monitoramento, documentação e logística de vistorias de infraestrutura urbana. O sistema permite o registro georreferenciado de ocorrências, acompanhamento fotográfico e otimização de rotas para equipes de campo.'
    },
    {
      id: 'roles',
      title: 'Níveis de Acesso (Permissões)',
      icon: <ShieldCheck className="text-emerald-600" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="font-black text-[10px] uppercase text-slate-400 mb-2">Administrador / Root</p>
              <p className="text-xs text-slate-600 font-medium">Controle total do sistema, gestão de usuários, unidades zonais, exclusão de registros e visualização de auditoria.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="font-black text-[10px] uppercase text-slate-400 mb-2">Restrito (Técnico)</p>
              <p className="text-xs text-slate-600 font-medium">Acesso limitado às vistorias de sua própria Unidade Zonal. Pode criar e editar registros, mas não gerenciar a estrutura organizacional.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="font-black text-[10px] uppercase text-slate-400 mb-2">Viewer (Consulta)</p>
              <p className="text-xs text-slate-600 font-medium">Acesso de leitura em todo o inventário e roteiros. Não possui permissão para criar, editar ou excluir dados.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'inventory',
      title: 'Inventário de Obras (Vistorias)',
      icon: <FileText className="text-blue-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">O núcleo do sistema onde são registradas as inspeções de campo.</p>
          <ul className="space-y-2">
            <li className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-blue-500 shrink-0" /> <strong>Novo Registro:</strong> Captura automática de coordenadas GPS e endereço via geocodificação reversa.</li>
            <li className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-blue-500 shrink-0" /> <strong>Evidências:</strong> Upload de fotos "Antes" e "Depois" com marca d'água automática (Data, Hora, GPS e Operador).</li>
            <li className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-blue-500 shrink-0" /> <strong>Filtros Avançados:</strong> Busca por Protocolo, Status, Unidade Zonal ou Vistoriador específico.</li>
            <li className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-blue-500 shrink-0" /> <strong>Exportação:</strong> Geração de Relatório PDF (Paisagem A4), Planilha CSV e arquivo KML para Google Earth.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'logistics',
      title: 'Logística e Roteiros',
      icon: <RouteIcon className="text-indigo-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Ferramenta para otimização do deslocamento das equipes de campo.</p>
          <ul className="space-y-2">
            <li className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-indigo-500 shrink-0" /> <strong>Planejador:</strong> Seleção de múltiplos pontos de vistoria para criar um itinerário.</li>
            <li className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-indigo-500 shrink-0" /> <strong>Sequenciamento:</strong> Reordenação de visitas via "Drag and Drop" (arrastar e soltar).</li>
            <li className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-indigo-500 shrink-0" /> <strong>Navegação:</strong> Botão "Abrir no GPS" que envia a rota completa para o Google Maps do celular.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'admin',
      title: 'Administração e Auditoria',
      icon: <History className="text-rose-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Recursos exclusivos para controle de qualidade e segurança.</p>
          <ul className="space-y-2">
            <li className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-rose-500 shrink-0" /> <strong>Equipes:</strong> Cadastro de usuários e atribuição de cargos e unidades zonais.</li>
            <li className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-rose-500 shrink-0" /> <strong>Unidades:</strong> Gestão das Unidades Zonais e seus respectivos Engenheiros Responsáveis.</li>
            <li className="flex gap-2 text-xs text-slate-600"><CheckCircle2 size={14} className="text-rose-500 shrink-0" /> <strong>Auditoria:</strong> Registro de todas as ações críticas (Criação, Edição, Exclusão) com carimbo de tempo e autor.</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8 pb-24 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen size={18} className="text-blue-600" />
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Documentação do Sistema</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Manual do Usuário</h1>
          <p className="text-slate-500 font-medium">Guia completo de funcionalidades - Versão Atual</p>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 font-black text-[10px] uppercase">v2.1.0-Stable</div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navegação Rápida */}
        <aside className="lg:col-span-3 space-y-2 sticky top-24 h-fit hidden lg:block">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Tópicos</p>
           {sections.map(s => (
             <a 
              key={s.id} 
              href={`#${s.id}`} 
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-slate-600 hover:text-blue-600 group"
             >
                <div className="opacity-50 group-hover:opacity-100 transition-opacity">{s.icon}</div>
                <span className="text-[10px] font-black uppercase tracking-tight">{s.title}</span>
             </a>
           ))}
        </aside>

        {/* Conteúdo */}
        <main className="lg:col-span-9 space-y-8">
           {sections.map(s => (
             <section key={s.id} id={s.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm scroll-mt-24">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner">
                      {s.icon}
                   </div>
                   <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">{s.title}</h2>
                </div>
                <div className="text-slate-600 leading-relaxed">
                   {typeof s.content === 'string' ? <p className="text-sm font-medium">{s.content}</p> : s.content}
                </div>
             </section>
           ))}

           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white overflow-hidden relative">
              <div className="relative z-10">
                 <h3 className="text-lg font-black uppercase italic mb-2">Suporte Técnico</h3>
                 <p className="text-slate-400 text-xs font-medium mb-6">Para dúvidas operacionais ou problemas técnicos, entre em contato com a administração do sistema.</p>
                 <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/10">
                       <Globe size={14} className="text-blue-400" />
                       <span className="text-[10px] font-black uppercase">Portal SGR-Vias</span>
                    </div>
                 </div>
              </div>
              <BookOpen size={120} className="absolute -bottom-10 -right-10 text-white/5 rotate-12" />
           </div>
        </main>
      </div>
    </div>
  );
};

export default ManualPage;

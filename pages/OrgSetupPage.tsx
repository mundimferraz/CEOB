
import React from 'react';
import { useApp } from '../App';
import { Zonal, User } from '../types';
import { ZONALS } from '../constants';
import { UserPlus, Settings, Shield, Map as MapIcon, ChevronRight } from 'lucide-react';

const OrgSetupPage: React.FC = () => {
  const { users, requests } = useApp();

  const getZonalStats = (zonal: Zonal) => {
    const zonalUsers = users.filter(u => u.zonal === zonal);
    const zonalRequests = requests.filter(r => r.zonal === zonal);
    const manager = zonalUsers.find(u => u.role === 'Manager')?.name || 'Não definido';
    
    return {
      manager,
      teamCount: zonalUsers.length,
      requestCount: zonalRequests.length
    };
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Estrutura Organizacional</h1>
          <p className="text-slate-500">Gestão das 4 zonais operativas e equipe técnica.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-lg shadow-blue-100">
          <UserPlus size={18} />
          Novo Colaborador
        </button>
      </header>

      {/* Zonais Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ZONALS.map(zonal => {
          const stats = getZonalStats(zonal);
          return (
            <div key={zonal} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <MapIcon size={18} />
                  </div>
                  <h3 className="font-bold">{zonal}</h3>
                </div>
                <button className="p-1 hover:bg-white/10 rounded transition-colors">
                  <Settings size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Gerente Responsável</span>
                  <span className="text-sm font-bold text-slate-900">{stats.manager}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Total Equipe</span>
                  <span className="text-sm font-bold text-slate-900">{stats.teamCount} membros</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Chamados Ativos</span>
                  <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{stats.requestCount}</span>
                </div>
                
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Membros Ativos</p>
                  <div className="flex flex-wrap gap-2">
                    {users.filter(u => u.zonal === zonal).map(u => (
                      <div key={u.id} className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700">
                        <div className={`w-2 h-2 rounded-full ${u.role === 'Manager' ? 'bg-indigo-500' : u.role === 'Collaborator' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {u.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline">
                  Ver Relatório Zonal <ChevronRight size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Roles Info */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Shield size={120} />
        </div>
        <div className="space-y-4 flex-1">
          <h2 className="text-2xl font-bold">Níveis de Acesso e Responsabilidades</h2>
          <p className="text-slate-400 max-w-xl">
            O sistema é segmentado por permissões baseadas em zonais. Estagiários e Colaboradores possuem foco em coleta de dados em campo, enquanto Gerentes possuem visão administrativa total.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="font-bold text-indigo-400">Gerente</p>
              <p className="text-xs text-slate-400 mt-1">Aprovação de relatórios e gestão de equipe.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="font-bold text-emerald-400">Colaborador</p>
              <p className="text-xs text-slate-400 mt-1">Execução técnica e atualização de status.</p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="font-bold text-amber-400">Estagiário</p>
              <p className="text-xs text-slate-400 mt-1">Auxílio em campo e coleta de dados (GPS/Fotos).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgSetupPage;

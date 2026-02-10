
import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useApp } from '../App';
import { RequestStatus } from '../types';
import { ZONALS_LIST } from '../constants';
import { ClipboardCheck, Clock, Map as MapIcon, AlertCircle, TrendingUp, ChevronRight, Navigation, LayoutGrid } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { requests, getZonalName } = useApp();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const counts = {
      total: requests.length,
      [RequestStatus.OPEN]: requests.filter(r => r.status === RequestStatus.OPEN).length,
      [RequestStatus.IN_PROGRESS]: requests.filter(r => r.status === RequestStatus.IN_PROGRESS).length,
      [RequestStatus.COMPLETED]: requests.filter(r => r.status === RequestStatus.COMPLETED).length,
      [RequestStatus.CANCELED]: requests.filter(r => r.status === RequestStatus.CANCELED).length,
    };
    return counts;
  }, [requests]);

  const chartDataByStatus = useMemo(() => [
    { name: 'Em Aberto', value: stats[RequestStatus.OPEN], color: '#3b82f6' },
    { name: 'Em Andamento', value: stats[RequestStatus.IN_PROGRESS], color: '#f59e0b' },
    { name: 'Concluído', value: stats[RequestStatus.COMPLETED], color: '#10b981' },
    { name: 'Cancelado', value: stats[RequestStatus.CANCELED], color: '#f43f5e' },
  ], [stats]);

  const chartDataByZonal = useMemo(() => {
    return ZONALS_LIST.map(z => ({
      name: getZonalName(z),
      total: requests.filter(r => r.zonal === z).length
    }));
  }, [requests, getZonalName]);

  const StatCard = ({ label, value, icon: Icon, colorClass }: any) => (
    <div className={`relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-lg`}>
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-black text-slate-900 leading-none">{value}</p>
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClass} shadow-inner`}>
          <Icon size={28} strokeWidth={2.5} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-500">
        <TrendingUp size={12} className="text-emerald-500" />
        Sincronizado via satélite
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 pb-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Monitoramento de Zeladoria</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">Consolidado de Vistorias</h1>
        </div>
        
        <Link 
          to="/map"
          className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95 group"
        >
          <Navigation size={16} className="text-emerald-400 group-hover:rotate-12 transition-transform" />
          Geo-Visualização
          <ChevronRight size={14} className="opacity-50" />
        </Link>
      </header>

      {/* Grid de Estatísticas Padronizado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Total Geral" value={stats.total} icon={LayoutGrid} colorClass="bg-slate-50 text-slate-600" />
        <StatCard label="Em Aberto" value={stats[RequestStatus.OPEN]} icon={AlertCircle} colorClass="bg-blue-50 text-blue-600" />
        <StatCard label="Em Andamento" value={stats[RequestStatus.IN_PROGRESS]} icon={Clock} colorClass="bg-amber-50 text-amber-600" />
        <StatCard label="Concluídos" value={stats[RequestStatus.COMPLETED]} icon={ClipboardCheck} colorClass="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Distribuição por Status */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <h2 className="text-sm font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tight">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            Distribuição por Status
          </h2>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {chartDataByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demandas por Zonal */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
           <h2 className="text-sm font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tight">
            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
            Demandas por Unidade
          </h2>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataByZonal}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  style={{ fontSize: '9px', fontWeight: '900', fill: '#94a3b8', textTransform: 'uppercase' }}
                />
                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px', fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 12 }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="total" 
                  fill="#3b82f6" 
                  radius={[12, 12, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;


import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useApp } from '../App';
import { RequestStatus, ZonalType } from '../types';
import { STATUS_COLORS, ZONALS_LIST } from '../constants';
import { ClipboardCheck, Clock, Map, AlertCircle, TrendingUp } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { requests, getZonalName } = useApp();

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
    { name: 'Aberta', value: stats[RequestStatus.OPEN], color: '#3b82f6' },
    { name: 'Em Andamento', value: stats[RequestStatus.IN_PROGRESS], color: '#f59e0b' },
    { name: 'Concluída', value: stats[RequestStatus.COMPLETED], color: '#10b981' },
    { name: 'Cancelada', value: stats[RequestStatus.CANCELED], color: '#f43f5e' },
  ], [stats]);

  const chartDataByZonal = useMemo(() => {
    return ZONALS_LIST.map(z => ({
      name: getZonalName(z),
      total: requests.filter(r => r.zonal === z).length
    }));
  }, [requests, getZonalName]);

  const StatCard = ({ label, value, icon: Icon, colorClass, gradient }: any) => (
    <div className={`relative overflow-hidden bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-lg`}>
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-black text-slate-900">{value}</p>
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClass} shadow-inner`}>
          <Icon size={28} strokeWidth={2.5} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-500">
        <TrendingUp size={12} className="text-emerald-500" />
        Sincronizado agora
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 pb-12">
      <header>
        <div className="flex items-center gap-2 mb-1">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Painel Operativo Realtime</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Estatísticas de Obras</h1>
      </header>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Solicitações" value={stats.total} icon={Map} colorClass="bg-indigo-50 text-indigo-600" />
        <StatCard label="Aguardando" value={stats[RequestStatus.OPEN]} icon={AlertCircle} colorClass="bg-amber-50 text-amber-600" />
        <StatCard label="Operativas" value={stats[RequestStatus.IN_PROGRESS]} icon={Clock} colorClass="bg-blue-50 text-blue-600" />
        <StatCard label="Finalizadas" value={stats[RequestStatus.COMPLETED]} icon={ClipboardCheck} colorClass="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Chart Status */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
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
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart Zonal */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
           <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
            Demandas por Zonal
          </h2>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataByZonal}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  style={{ fontSize: '10px', fontWeight: 'bold', fill: '#94a3b8' }}
                />
                <YAxis axisLine={false} tickLine={false} style={{ fontSize: '12px', fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 10 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="total" 
                  fill="#3b82f6" 
                  radius={[10, 10, 0, 0]} 
                  barSize={40}
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

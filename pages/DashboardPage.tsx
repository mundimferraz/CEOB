
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useApp } from '../App';
import { RequestStatus, Zonal } from '../types';
import { STATUS_COLORS, ZONALS } from '../constants';
import { ClipboardCheck, Clock, Map, AlertCircle } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { requests } = useApp();

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
    return ZONALS.map(z => ({
      name: z,
      total: requests.filter(r => r.zonal === z).length
    }));
  }, [requests]);

  const StatCard = ({ label, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard de Gestão</h1>
        <p className="text-slate-500">Visão geral do sistema de reparos em vias públicas.</p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Geral" value={stats.total} icon={Map} colorClass="bg-blue-50 text-blue-600" />
        <StatCard label="Em Aberto" value={stats[RequestStatus.OPEN]} icon={AlertCircle} colorClass="bg-amber-50 text-amber-600" />
        <StatCard label="Em Andamento" value={stats[RequestStatus.IN_PROGRESS]} icon={Clock} colorClass="bg-blue-50 text-blue-600" />
        <StatCard label="Concluídas" value={stats[RequestStatus.COMPLETED]} icon={ClipboardCheck} colorClass="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart Status */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">Status das Solicitações</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDataByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartDataByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart Zonal */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">Solicitações por Zonal</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataByZonal}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

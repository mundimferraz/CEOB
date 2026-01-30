
import React, { useState } from 'react';
import { useApp } from '../App';
import { ZonalType, User, UserRole, ZonalMetadata, AppRole } from '../types';
import { ZONALS_LIST, ROLE_CONFIG } from '../constants';
import { UserPlus, Settings, Shield, Map as MapIcon, Edit2, Trash2, X, Save, Search, UserCheck, Briefcase, Plus, AlertCircle, Users, Hash, ShieldCheck, Eye, UserCog, UserPen, ShieldAlert } from 'lucide-react';

const OrgSetupPage: React.FC = () => {
  const { 
    users, requests, zonals, currentUser, canDo,
    addUser, updateUser, deleteUser, updateZonal,
    getZonalName, notify 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'zonals' | 'personnel'>('personnel');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [isZonalModalOpen, setIsZonalModalOpen] = useState(false);
  const [editingZonal, setEditingZonal] = useState<ZonalMetadata | null>(null);

  if (!canDo('manage_users')) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-8 text-center">
        <ShieldAlert size={64} className="text-rose-500 mb-4" />
        <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Acesso Bloqueado</h1>
        <p className="text-slate-500 max-w-sm">Você não possui permissão de <strong>Administrador</strong> para acessar o módulo de gestão de usuários.</p>
      </div>
    );
  }

  const handleSaveUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const userData: User = {
      id: editingUser?.id || `u_${Date.now()}`,
      name: formData.get('name') as string,
      role: formData.get('role') as AppRole,
      zonal: formData.get('zonal') as ZonalType,
      registrationNumber: formData.get('registrationNumber') as string,
      email: formData.get('email') as string,
    };

    if (editingUser) {
      updateUser(userData);
    } else {
      addUser(userData);
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveZonal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const zonalData: ZonalMetadata = {
      ...editingZonal!,
      name: formData.get('name') as string,
      managerId: formData.get('managerId') as string,
      assistantId: formData.get('assistantId') as string,
    };

    updateZonal(zonalData);
    setIsZonalModalOpen(false);
    setEditingZonal(null);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.registrationNumber?.includes(searchTerm)
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={16} className="text-purple-600" />
            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Módulo de Administração Central</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Usuários</h1>
          <p className="text-slate-500 font-medium">Controle de níveis de acesso e lotação por Zonal.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => setActiveTab('personnel')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'personnel' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Colaboradores</button>
          <button onClick={() => setActiveTab('zonals')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'zonals' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Unidades</button>
        </div>
      </header>

      {activeTab === 'personnel' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar técnico por nome ou matrícula..." 
                className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-0 outline-none transition-all font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
              className="flex items-center justify-center gap-2 h-12 px-6 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-black uppercase tracking-widest text-[10px]"
            >
              <UserPlus size={18} />
              Adicionar Usuário
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível de Acesso</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Zonal / Unidade</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{user.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">ID: {user.registrationNumber || user.id.slice(0,8)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${ROLE_CONFIG[user.role].color}`}>
                        {user.role === AppRole.ADMIN && <ShieldAlert size={12} />}
                        {user.role === AppRole.VIEWER && <Eye size={12} />}
                        {ROLE_CONFIG[user.role].label}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-slate-600">{getZonalName(user.zonal)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-1">
                      <button onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => { if (window.confirm(`Remover ${user.name}?`)) deleteUser(user.id); }} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ZONALS_LIST.map(zId => {
            const zMeta = zonals.find(z => z.id === zId);
            const manager = users.find(u => u.id === zMeta?.managerId);
            return (
              <div key={zId} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-300 transition-all">
                <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3 text-blue-400">
                    <MapIcon size={20} />
                    <h3 className="font-black text-lg text-white">{zMeta?.name || zId}</h3>
                  </div>
                  <button onClick={() => { setEditingZonal(zMeta!); setIsZonalModalOpen(true); }} className="p-2 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all"><Settings size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-widest">Responsável Titular</span>
                    <span className="text-slate-900">{manager?.name || '---'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold pt-4 border-t border-slate-50">
                    <span className="text-slate-400 uppercase tracking-widest">Efetivo Operacional</span>
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-black uppercase text-[10px]">{users.filter(u => u.zonal === zId).length} Técnicos</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingUser ? 'Editar Técnico' : 'Novo Cadastro'}</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Gestão de Privilégios</p>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded-full shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveUser} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
                <input name="name" defaultValue={editingUser?.name} required placeholder="Nome do servidor" className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Cargo / Acesso</label>
                  <select name="role" defaultValue={editingUser?.role || AppRole.OPERATOR} className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 appearance-none bg-slate-50">
                    {Object.values(AppRole).map(role => (
                      <option key={role} value={role}>{ROLE_CONFIG[role].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Unidade Lotação</label>
                  <select name="zonal" defaultValue={editingUser?.zonal || ZonalType.NORTH} className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 appearance-none bg-slate-50">
                    {ZONALS_LIST.map(z => <option key={z} value={z}>{getZonalName(z)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Matrícula Funcional</label>
                <input name="registrationNumber" defaultValue={editingUser?.registrationNumber} placeholder="Ex: 12345-6" className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 h-14 bg-white border border-slate-200 text-slate-700 font-black uppercase text-xs rounded-2xl">Cancelar</button>
                <button type="submit" className="flex-1 h-14 bg-blue-600 text-white font-black uppercase text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-200"><Save size={18} /> Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zonal Modal */}
      {isZonalModalOpen && editingZonal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight leading-none">Editar Unidade</h2>
                <p className="text-[10px] text-blue-400 font-black tracking-widest uppercase mt-2">ID: {editingZonal.id}</p>
              </div>
              <button onClick={() => setIsZonalModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveZonal} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome da Unidade Regional</label>
                <input name="name" defaultValue={editingZonal.name} required className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 bg-slate-50" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Responsável Técnico (Titular)</label>
                <select name="managerId" defaultValue={editingZonal.managerId} className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900 appearance-none bg-slate-50">
                  <option value="">Selecione um Admin/Editor...</option>
                  {users.filter(u => u.role === AppRole.ADMIN || u.role === AppRole.EDITOR).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsZonalModalOpen(false)} className="flex-1 h-14 bg-white border border-slate-200 text-slate-700 font-black uppercase text-xs rounded-2xl">Cancelar</button>
                <button type="submit" className="flex-1 h-14 bg-slate-900 text-white font-black uppercase text-xs rounded-2xl flex items-center justify-center gap-2"><Save size={18} /> Atualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgSetupPage;


import React, { useState } from 'react';
import { useApp } from '../App';
import { ZonalType, User, ZonalMetadata, AppRole } from '../types';
import { ZONALS_LIST, ROLE_CONFIG } from '../constants';
import { UserPlus, Settings, Shield, Map as MapIcon, Edit2, Trash2, X, Save, Search, UserCog, ShieldCheck, ShieldAlert, ArrowLeft, ChevronDown, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrgSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    users, zonals, currentUser, canDo,
    addUser, updateUser, deleteUser,
    getZonalName, notify 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'zonals' | 'personnel'>('personnel');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [isZonalModalOpen, setIsZonalModalOpen] = useState(false);
  const [editingZonal, setEditingZonal] = useState<ZonalMetadata | null>(null);

  // REGRA DE OURO: Somente Admins acessam este módulo
  if (currentUser?.role !== AppRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center bg-white m-4 md:m-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 border border-rose-100">
           <ShieldAlert size={48} strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Acesso Negado</h1>
        <p className="text-slate-500 max-w-sm mb-8 font-medium">Este módulo de <strong>Gestão de Permissões</strong> é restrito à Administração Central.</p>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl"
        >
          <ArrowLeft size={16} />
          Voltar ao Início
        </button>
      </div>
    );
  }

  const handleSaveUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const userData: User = {
      id: editingUser?.id || `u_${Date.now()}`,
      name: formData.get('name') as string,
      role: formData.get('role') as AppRole, // Mapeia para a regra no banco
      zonal: formData.get('zonal') as ZonalType,
      registrationNumber: formData.get('registrationNumber') as string,
      email: formData.get('email') as string,
      password: editingUser?.password // Mantém a senha se for edição
    };

    if (editingUser) {
      updateUser(userData);
      notify("Servidor atualizado com sucesso!");
    } else {
      addUser(userData);
      notify("Novo servidor cadastrado com senha padrão 123456.");
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.registrationNumber?.includes(searchTerm)
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck size={18} className="text-blue-600" />
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Administração Governamental</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Controle de Usuários</h1>
          <p className="text-slate-500 font-medium">Gestão de identidades e níveis de privilégio no sistema SGR.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => setActiveTab('personnel')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'personnel' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Recursos Humanos</button>
          <button onClick={() => setActiveTab('zonals')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'zonals' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>Unidades (Zonais)</button>
        </div>
      </header>

      {activeTab === 'personnel' ? (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden border-b-4 border-b-blue-600">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Pesquisar por nome ou matrícula..." 
                className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
              className="flex items-center justify-center gap-2 h-12 px-8 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 font-black uppercase tracking-widest text-[10px]"
            >
              <UserPlus size={18} />
              Cadastrar Servidor
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Servidor</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nível de Permissão (Regra)</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lotação</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => {
                  const roleCfg = ROLE_CONFIG[user.role] || { color: 'bg-slate-100 text-slate-400', label: user.role };
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-sm group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                             {user.name?.charAt(0) || '?'}
                           </div>
                           <div>
                             <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                             <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Matrícula: {user.registrationNumber || 'N/A'}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider ${roleCfg.color}`}>
                          {user.role === AppRole.ADMIN ? <ShieldAlert size={12} /> : <UserCog size={12} />}
                          {roleCfg.label}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="text-xs font-bold text-slate-600">{getZonalName(user.zonal)}</span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-right space-x-1">
                        <button onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }} className="w-10 h-10 inline-flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Editar"><Edit2 size={16} /></button>
                        <button onClick={() => { if (window.confirm(`Remover permanentemente o acesso de ${user.name}?`)) deleteUser(user.id); }} className="w-10 h-10 inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Excluir"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ZONALS_LIST.map(zId => {
            const zMeta = zonals.find(z => z.id === zId);
            const manager = users.find(u => u.id === zMeta?.managerId);
            return (
              <div key={zId} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-300 transition-all">
                <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><MapIcon size={20} /></div>
                    <h3 className="font-black text-sm uppercase tracking-tight">{zMeta?.name || zId}</h3>
                  </div>
                  <button onClick={() => { setEditingZonal(zMeta!); setIsZonalModalOpen(true); }} className="text-white/40 hover:text-white transition-colors"><Settings size={20} /></button>
                </div>
                <div className="p-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Titular da Unidade</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs">{manager?.name.charAt(0) || '?'}</div>
                    <span className="text-sm font-bold text-slate-800">{manager?.name || 'Não designado'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE USUÁRIO COM FOCO NAS PERMISSÕES (REGRAS) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                   <UserCog size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingUser ? 'Ajustar Cadastro' : 'Novo Servidor'}</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Gestão de Identidades Governamentais</p>
                </div>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-rose-500 rounded-full shadow-sm hover:border-rose-100 transition-all"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
                <input name="name" defaultValue={editingUser?.name} required placeholder="Ex: Eng. Roberto Silva" className="w-full h-14 px-5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-900 bg-slate-50/50 transition-all" />
              </div>

              {/* DROPDOWN DE PERMISSÕES (REGRA NO BANCO) */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Regra de Acesso / Permissões</label>
                <div className="relative">
                  <select 
                    name="role" 
                    defaultValue={editingUser?.role || AppRole.OPERATOR} 
                    className="w-full h-14 px-5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-900 appearance-none bg-white transition-all cursor-pointer"
                  >
                    {Object.values(AppRole).map(role => (
                      <option key={role} value={role}>{ROLE_CONFIG[role]?.label || role}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
                <p className="mt-2 px-1 text-[9px] text-slate-400 font-medium">A regra de acesso define quais módulos o servidor poderá visualizar e editar.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Lotação Zonal</label>
                  <div className="relative">
                    <select name="zonal" defaultValue={editingUser?.zonal || ZonalType.NORTH} className="w-full h-14 px-5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-900 appearance-none bg-white transition-all">
                      {ZONALS_LIST.map(z => <option key={z} value={z}>{getZonalName(z)}</option>)}
                    </select>
                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Matrícula (RF)</label>
                  <input name="registrationNumber" defaultValue={editingUser?.registrationNumber} placeholder="Matrícula" className="w-full h-14 px-5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-slate-900 bg-slate-50/50 transition-all" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 h-16 bg-white border border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-[2] h-16 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all">
                  <Save size={20} />
                  Salvar Servidor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgSetupPage;

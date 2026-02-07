
import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { ZonalType, User, ZonalMetadata, AppRole } from '../types';
import { ZONALS_LIST, ROLE_CONFIG } from '../constants';
import { 
  UserPlus, Settings, Shield, Map as MapIcon, Edit2, Trash2, X, 
  Save, Search, UserCog, ShieldCheck, ShieldAlert, ArrowLeft, 
  ChevronDown, Lock, Users as UsersIcon, Database
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const OrgSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Sincroniza a aba com o parâmetro da URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'zonals' || tab === 'personnel') {
      setActiveTab(tab as any);
    }
  }, [location.search]);

  if (currentUser?.role !== AppRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center bg-white m-4 md:m-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 border border-rose-100">
           <ShieldAlert size={48} strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Acesso Negado</h1>
        <p className="text-slate-500 max-w-sm mb-8 font-medium">Este módulo administrativo é restrito à Administração Central.</p>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl">
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
      role: formData.get('role') as AppRole,
      zonal: formData.get('zonal') as ZonalType,
      registrationNumber: formData.get('registrationNumber') as string,
      email: formData.get('email') as string,
      password: editingUser?.password
    };
    if (editingUser) {
      updateUser(userData);
      notify("Registro atualizado.");
    } else {
      addUser(userData);
      notify("Servidor cadastrado (Senha: 123456).");
    }
    setIsUserModalOpen(false);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.registrationNumber && u.registrationNumber.includes(searchTerm))
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck size={18} className="text-blue-600" />
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Recursos Humanos e Organização</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Gestão Governamental</h1>
          <p className="text-slate-500 font-medium">Administração de unidades operacionais e pessoal de campo.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button onClick={() => setActiveTab('personnel')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'personnel' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
            <UsersIcon size={16} />
            Equipe
          </button>
          <button onClick={() => setActiveTab('zonals')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'zonals' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
            <Database size={16} />
            Unidades
          </button>
        </div>
      </header>

      {activeTab === 'personnel' ? (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden border-b-4 border-b-blue-600">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" placeholder="Buscar por nome ou RF..." 
                className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl focus:border-blue-500 outline-none font-medium text-sm"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }} className="flex items-center justify-center gap-2 h-12 px-8 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 hover:bg-blue-700">
              <UserPlus size={18} />
              Novo Servidor
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Servidor</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Regra de Acesso</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => {
                  const isRoot = user.name === 'claudioasousa' || user.id === 'root_master_id';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${isRoot ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                             {user.name?.charAt(0)}
                           </div>
                           <div>
                             <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                               {user.name}
                               {isRoot && <ShieldCheck size={14} className="text-amber-600" />}
                             </div>
                             <div className="text-[10px] text-slate-400 font-bold">RF: {user.registrationNumber || 'N/A'}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase ${ROLE_CONFIG[user.role]?.color}`}>
                          {ROLE_CONFIG[user.role]?.label}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                          {!isRoot && (
                            <button onClick={() => deleteUser(user.id)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                          )}
                        </div>
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
              <div key={zId} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-400 transition-all">
                <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><MapIcon size={20} /></div>
                    <h3 className="font-black text-sm uppercase tracking-tight">{zMeta?.name || zId}</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Engenheiro Titular</p>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs">{manager?.name.charAt(0) || '?'}</div>
                      <span className="text-xs font-bold text-slate-800">{manager?.name || 'Não designado'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL SIMPLIFICADO */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingUser ? 'Ajustar Servidor' : 'Novo Servidor'}</h2>
              <button onClick={() => setIsUserModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveUser} className="p-8 space-y-6">
              <div className="space-y-4">
                <input name="name" defaultValue={editingUser?.name} required placeholder="Nome Completo" className="w-full h-14 px-5 border border-slate-200 rounded-2xl font-bold" />
                <select name="role" defaultValue={editingUser?.role || AppRole.OPERATOR} disabled={editingUser?.name === 'claudioasousa'} className="w-full h-14 px-5 border border-slate-200 rounded-2xl font-bold appearance-none">
                  {Object.values(AppRole).map(role => <option key={role} value={role}>{ROLE_CONFIG[role]?.label}</option>)}
                </select>
                <select name="zonal" defaultValue={editingUser?.zonal || ZonalType.NORTH} className="w-full h-14 px-5 border border-slate-200 rounded-2xl font-bold appearance-none">
                  {ZONALS_LIST.map(z => <option key={z} value={z}>{getZonalName(z)}</option>)}
                </select>
                <input name="registrationNumber" defaultValue={editingUser?.registrationNumber} placeholder="Matrícula RF" className="w-full h-14 px-5 border border-slate-200 rounded-2xl font-bold" />
              </div>
              <button type="submit" className="w-full h-16 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl hover:bg-blue-700">Finalizar Cadastro</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgSetupPage;

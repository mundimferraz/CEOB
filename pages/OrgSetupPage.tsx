
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../App';
import { ZonalType, User, ZonalMetadata, AppRole } from '../types';
import { ROLE_CONFIG } from '../constants';
import { 
  UserPlus, Settings, Shield, Map as MapIcon, Edit2, Trash2, X, 
  Save, Search, UserCog, ShieldCheck, ShieldAlert, ArrowLeft, 
  Lock, Users as UsersIcon, Database, Plus, Briefcase, Info,
  Loader2, Radio, Clock, UserCheck, Crown, Fingerprint
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const OrgSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    users, zonals, currentUser, isAdmin, isRoot,
    addUser, updateUser, deleteUser,
    updateZonal, notify 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'zonals' | 'personnel'>('personnel');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [isZonalModalOpen, setIsZonalModalOpen] = useState(false);
  const [editingZonal, setEditingZonal] = useState<ZonalMetadata | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'zonals' || tab === 'personnel') setActiveTab(tab as any);
  }, [location.search]);

  // Bloqueio robusto de acesso
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center bg-white m-4 md:m-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 border border-rose-100 animate-pulse">
           <ShieldAlert size={48} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Acesso Negado</h1>
        <p className="text-slate-500 max-w-sm mb-8 font-medium">Você não possui nível de acesso <strong>Administrativo</strong> para gerenciar equipes ou unidades zonais.</p>
        <button onClick={() => navigate('/')} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Voltar ao Início</button>
      </div>
    );
  }

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const isTargetRoot = editingUser?.name === 'claudioasousa';

      const userData: User = {
        id: editingUser?.id || `u_${Date.now()}`,
        name: formData.get('name') as string,
        role: (isTargetRoot && !isRoot) ? AppRole.ADMIN : (formData.get('role') as AppRole), // Impede mudança de cargo do root por outros
        zonal: (formData.get('zonal') as string) || '',
        registrationNumber: formData.get('registrationNumber') as string,
        position: formData.get('position') as string,
        function: formData.get('function') as string,
        email: formData.get('email') as string,
        password: editingUser?.password || '123456'
      };

      if (!userData.name || !userData.registrationNumber) {
        notify("Nome e RF são obrigatórios para usuários.", "error");
        setIsSubmitting(false);
        return;
      }

      if (editingUser) await updateUser(userData); else await addUser(userData);
      notify("Usuário gravado com sucesso.");
      setIsUserModalOpen(false);
    } catch (error) {
      notify("Erro ao salvar usuário.", "error");
    } finally { setIsSubmitting(false); }
  };

  const handleSaveZonal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const zonalData: ZonalMetadata = {
        id: editingZonal?.id || `zonal_${Date.now()}`,
        name: formData.get('name') as string,
        managerId: formData.get('managerId') as string,
        assistantId: formData.get('assistantId') as string,
        description: formData.get('description') as string,
      };
      await updateZonal(zonalData);
      notify("Unidade zonal atualizada.");
      setIsZonalModalOpen(false);
    } catch (error) {
      notify("Erro ao salvar unidade.", "error");
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (name === 'claudioasousa' && !isRoot) {
      notify("Erro: Somente o Root pode remover sua própria conta.", "error");
      return;
    }

    if (window.confirm(`Excluir colaborador "${name}" permanentemente?`)) {
      await deleteUser(id);
      notify("Colaborador removido.");
    }
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 pb-24 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Gestão Organizacional</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Controle de estrutura e pessoal</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button onClick={() => setActiveTab('personnel')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'personnel' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Equipe</button>
          <button onClick={() => setActiveTab('zonals')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'zonals' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Unidades</button>
        </div>
      </header>

      {activeTab === 'personnel' ? (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50">
             <input type="text" placeholder="Filtrar por nome..." className="w-full max-w-sm h-11 px-4 bg-white border border-slate-200 rounded-xl outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             <button onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }} className="px-6 h-11 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all"><UserPlus size={16}/> Novo Usuário</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Permissão</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => {
                  const isUserRoot = user.name === 'claudioasousa';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                           <div className={`w-9 h-9 ${isUserRoot ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'} rounded-lg flex items-center justify-center font-black`}>
                              {isUserRoot ? <Crown size={16}/> : user.name.charAt(0)}
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                {user.name}
                                {isUserRoot && <span className="bg-amber-600 text-white text-[7px] px-1.5 py-0.5 rounded-full font-black uppercase">Root</span>}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">RF: {user.registrationNumber || '---'}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${isUserRoot ? 'bg-amber-50 text-amber-700 border-amber-200' : (ROLE_CONFIG[user.role]?.color || 'bg-slate-100 text-slate-500')}`}>
                           {isUserRoot ? 'Superusuário / Root' : (ROLE_CONFIG[user.role]?.label || 'Usuário')}
                         </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                         <button onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={16}/></button>
                         {(!isUserRoot || isRoot) && (
                            <button onClick={() => handleDeleteUser(user.id, user.name)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                              <Trash2 size={16}/>
                            </button>
                         )}
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
           {zonals.map(z => (
             <div key={z.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4 hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between">
                   <h3 className="font-black text-sm uppercase italic">{z.name}</h3>
                   <button onClick={() => { setEditingZonal(z); setIsZonalModalOpen(true); }} className="text-slate-400 hover:text-blue-600"><Edit2 size={16}/></button>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                   <p className="text-[8px] font-black text-slate-400 uppercase mb-2">Responsável Técnico</p>
                   <p className="text-xs font-bold text-slate-900">{users.find(u => u.id === z.managerId)?.name || 'Nenhum'}</p>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* MODAL USUÁRIO */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black uppercase italic">
                {editingUser?.name === 'claudioasousa' ? 'Editar Root' : (editingUser ? 'Editar Usuário' : 'Novo Usuário')}
              </h2>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handleSaveUser} className="p-8 space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Nome Completo *</label>
                <input 
                  required 
                  name="name" 
                  defaultValue={editingUser?.name} 
                  disabled={editingUser?.name === 'claudioasousa'} // Impede renomear root
                  className="w-full h-11 px-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-600/10 disabled:bg-slate-100" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">RF / Matrícula *</label>
                  <input required name="registrationNumber" defaultValue={editingUser?.registrationNumber} className="w-full h-11 px-4 border border-slate-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Nível de Acesso *</label>
                  <select 
                    required 
                    name="role" 
                    defaultValue={editingUser?.role || AppRole.OPERATOR} 
                    disabled={editingUser?.name === 'claudioasousa' && !isRoot} // Só o root altera seu próprio cargo
                    className="w-full h-11 px-4 border border-slate-200 rounded-xl outline-none font-bold text-xs disabled:bg-slate-100"
                  >
                    {Object.values(AppRole).map(role => <option key={role} value={role}>{ROLE_CONFIG[role]?.label || role}</option>)}
                  </select>
                </div>
              </div>
              <div>
                 <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">Lotação Zonal</label>
                 <select name="zonal" defaultValue={editingUser?.zonal} className="w-full h-11 px-4 border border-slate-200 rounded-xl outline-none font-bold text-xs">
                    <option value="">Sem Unidade</option>
                    {zonals.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                 </select>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-xl hover:bg-blue-700 active:scale-95 transition-all">
                 {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                 Salvar Cadastro
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgSetupPage;

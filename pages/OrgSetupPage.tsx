
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../App';
import { ZonalType, User, ZonalMetadata, AppRole } from '../types';
import { ROLE_CONFIG } from '../constants';
import { 
  UserPlus, Settings, Shield, Map as MapIcon, Edit2, Trash2, X, 
  Save, Search, UserCog, ShieldCheck, ShieldAlert, ArrowLeft, 
  ChevronDown, Lock, Users as UsersIcon, Database, Plus, Briefcase, Info,
  Loader2, Radio, Clock, UserCheck, Crown, Fingerprint
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const OrgSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    users, zonals, currentUser,
    addUser, updateUser, deleteUser,
    updateZonal, notify 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'zonals' | 'personnel'>('personnel');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modais de Usuário
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Modais de Zonal
  const [isZonalModalOpen, setIsZonalModalOpen] = useState(false);
  const [editingZonal, setEditingZonal] = useState<ZonalMetadata | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'zonals' || tab === 'personnel') setActiveTab(tab as any);
  }, [location.search]);

  // Lógica de Atividade em Tempo Real
  const isUserOnline = (lastActive: string | undefined) => {
    if (!lastActive) return false;
    const diff = Date.now() - new Date(lastActive).getTime();
    return diff < 5 * 60 * 1000; // 5 minutos threshold
  };

  const getRelativeTime = (lastActive: string | undefined) => {
    if (!lastActive) return 'Nenhuma atividade';
    const diff = Math.floor((Date.now() - new Date(lastActive).getTime()) / 1000 / 60);
    if (diff < 1) return 'Agora mesmo';
    if (diff < 60) return `Há ${diff} min`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `Há ${hours}h`;
    return new Date(lastActive).toLocaleDateString('pt-BR');
  };

  const onlineCount = useMemo(() => users.filter(u => isUserOnline(u.lastActiveAt)).length, [users]);

  if (currentUser?.role !== AppRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center bg-white m-4 md:m-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 border border-rose-100">
           <ShieldAlert size={48} strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Acesso Negado</h1>
        <p className="text-slate-500 max-w-sm mb-8 font-medium">Este módulo administrativo é restrito à Administração Central.</p>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl">
          <ArrowLeft size={16} /> Voltar ao Início
        </button>
      </div>
    );
  }

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // REGRA ROOT: Apenas o próprio Root edita o Root
    const isEditingRoot = editingUser?.name === 'claudioasousa' || editingUser?.id === 'root_master_id';
    const isSelfEdit = currentUser?.id === editingUser?.id;
    if (isEditingRoot && !isSelfEdit) {
      notify("Proteção Ativa: Apenas o usuário Root pode alterar seus próprios dados.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const userData: User = {
        id: editingUser?.id || `u_${Date.now()}`,
        name: (formData.get('name') as string) || 'Sem Nome',
        role: (formData.get('role') as AppRole) || AppRole.OPERATOR,
        zonal: (formData.get('zonal') as string) || '',
        registrationNumber: formData.get('registrationNumber') as string,
        position: formData.get('position') as string,
        function: formData.get('function') as string,
        email: formData.get('email') as string,
        password: editingUser?.password
      };

      if (editingUser) {
        await updateUser(userData);
        notify("Registro atualizado com sucesso.");
      } else {
        await addUser(userData);
        notify("Colaborador cadastrado.");
      }
      setIsUserModalOpen(false);
    } catch (error) {
      notify("Erro ao persistir dados.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveZonal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const zonalData: ZonalMetadata = {
        id: editingZonal?.id || `zonal_${Date.now()}`,
        name: (formData.get('name') as string) || 'Unidade sem Nome',
        managerId: formData.get('managerId') as string,
        assistantId: formData.get('assistantId') as string,
        description: formData.get('description') as string,
      };
      await updateZonal(zonalData);
      notify(editingZonal ? "Unidade atualizada." : "Nova unidade zonal criada.");
      setIsZonalModalOpen(false);
    } catch (error) {
      notify("Erro ao salvar unidade.", "error");
    } finally {
      setIsSubmitting(false);
    }
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
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Administração e Monitoramento Live</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Configurações do Sistema</h1>
          <p className="text-slate-500 font-medium">Gestão de estrutura organizacional, permissões e sessões ativas.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button onClick={() => setActiveTab('personnel')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'personnel' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
            <UsersIcon size={16} /> Equipe
          </button>
          <button onClick={() => setActiveTab('zonals')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'zonals' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
            <Database size={16} /> Unidades
          </button>
        </div>
      </header>

      {activeTab === 'personnel' ? (
        <div className="space-y-6">
          {/* Dashboard de Atividade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-emerald-600 p-6 rounded-[2rem] text-white shadow-xl shadow-emerald-100 relative overflow-hidden group">
                <Radio className="absolute right-[-10px] top-[-10px] w-24 h-24 opacity-10 group-hover:scale-110 transition-transform" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Usuários Online Agora</p>
                <div className="flex items-end gap-2">
                   <h2 className="text-4xl font-black">{onlineCount}</h2>
                   <span className="text-xs font-bold mb-1.5">Sessões Ativas</span>
                </div>
             </div>
             <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm col-span-1 md:col-span-2 flex items-center gap-6">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                   <Info size={24} />
                </div>
                <p className="text-[11px] font-bold text-slate-500 leading-tight">
                  O monitor de atividade exibe usuários que interagiram com o SGR-Vias nos últimos 5 minutos.
                  Isso ajuda a identificar quem está operando em campo em tempo real.
                </p>
             </div>
          </div>

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
              <button onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }} className="flex items-center justify-center gap-2 h-12 px-8 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">
                <UserPlus size={18} /> Novo Colaborador
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Atividade</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Permissão</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => {
                    const isRoot = user.name === 'claudioasousa' || user.id === 'root_master_id';
                    const isSelf = currentUser?.id === user.id;
                    const online = isUserOnline(user.lastActiveAt);
                    
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                             <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${isRoot ? 'bg-slate-900 text-amber-500 border-2 border-amber-500/30' : 'bg-slate-100 text-slate-400'}`}>
                               {isRoot ? <Crown size={18} /> : user.name?.charAt(0)}
                               {online && (
                                 <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
                               )}
                             </div>
                             <div>
                               <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                 {user.name} 
                                 {isRoot && (
                                   <span title="Super Usuário Root">
                                     <ShieldCheck size={14} className="text-amber-600" />
                                   </span>
                                 )}
                               </div>
                               <div className="text-[10px] text-slate-400 font-bold uppercase">RF: {user.registrationNumber || '---'}</div>
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            {online ? (
                              <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                                <Radio size={12} /> Online Agora
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                <Clock size={12} /> {getRelativeTime(user.lastActiveAt)}
                              </div>
                            )}
                            <p className="text-[8px] text-slate-400 mt-1 uppercase">{user.position}</p>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest ${ROLE_CONFIG[user.role]?.color}`}>
                            {ROLE_CONFIG[user.role]?.label}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-1">
                            {/* REGRA ROOT: Apenas o Root edita a si mesmo */}
                            {isRoot && !isSelf ? (
                              <div className="w-9 h-9 flex items-center justify-center text-slate-300 cursor-not-allowed" title="Proteção Root Ativa">
                                <Lock size={14} />
                              </div>
                            ) : (
                              <button onClick={() => { setEditingUser(user); setIsUserModalOpen(true); }} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={14} /></button>
                            )}
                            
                            {!isRoot && (
                              <button onClick={() => { if(window.confirm(`Excluir ${user.name}?`)) deleteUser(user.id); }} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
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
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={() => { setEditingZonal(null); setIsZonalModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-slate-800 transition-all">
              <Plus size={18} /> Criar Nova Unidade Zonal
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zonals.map(z => {
              const manager = users.find(u => u.id === z.managerId);
              const assistant = users.find(u => u.id === z.assistantId);
              return (
                <div key={z.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden group hover:border-blue-400 transition-all flex flex-col">
                  <div className="bg-slate-950 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><MapIcon size={20} /></div>
                      <div>
                        <h3 className="font-black text-sm uppercase tracking-tight">{z.name}</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">ID: {z.id.slice(-8)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingZonal(z); setIsZonalModalOpen(true); }} className="p-2 text-slate-400 hover:text-white transition-colors"><Edit2 size={16} /></button>
                    </div>
                  </div>
                  <div className="p-6 space-y-4 flex-1">
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Shield size={12}/> Responsável Técnico</p>
                        <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-[10px] shadow-sm">{manager?.name.charAt(0) || '?'}</div>
                          <span className="text-xs font-bold text-slate-800 truncate">{manager?.name || 'Não designado'}</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><UserCheck size={12}/> Técnico de Campo</p>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white font-black text-[10px] shadow-sm">{assistant?.name.charAt(0) || '?'}</div>
                          <span className="text-xs font-bold text-slate-800 truncate">{assistant?.name || 'Não designado'}</span>
                        </div>
                      </div>
                    </div>

                    {z.description && (
                      <div className="pt-2 border-t border-slate-50">
                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium line-clamp-2 italic">"{z.description}"</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL USUÁRIO */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${editingUser?.name === 'claudioasousa' ? 'bg-amber-600' : 'bg-blue-600'} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                  {editingUser?.name === 'claudioasousa' ? <Crown size={24} /> : <UserCog size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {editingUser?.name === 'claudioasousa' ? 'Perfil Soberano (Root)' : (editingUser ? 'Ajustar Cadastro' : 'Novo Colaborador')}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {editingUser?.name === 'claudioasousa' ? 'Acesso ao Núcleo do Sistema' : 'Gestão de Equipe Governamental'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-rose-500 transition-all"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-8 space-y-5">
              {editingUser?.name === 'claudioasousa' && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-4 items-start mb-2">
                   <Fingerprint className="text-amber-600 flex-shrink-0" size={20} />
                   <p className="text-[10px] font-bold text-amber-900 leading-tight">
                     <strong>REDE DE SEGURANÇA:</strong> Os dados deste usuário não são imutáveis para ele mesmo, mas estão protegidos contra alterações por terceiros. Apenas você pode alterar sua própria identidade técnica e senha de núcleo.
                   </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Nome Completo</label>
                  <input name="name" defaultValue={editingUser?.name} placeholder="Nome do Servidor" className="w-full h-12 px-4 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Cargo (Título)</label>
                  <input name="position" defaultValue={editingUser?.position} placeholder="Ex: Engenheiro III" className="w-full h-12 px-4 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Função (Atividade)</label>
                  <input name="function" defaultValue={editingUser?.function} placeholder="Ex: Fiscal de Campo" className="w-full h-12 px-4 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Permissão de Acesso</label>
                  <select 
                    name="role" 
                    defaultValue={editingUser?.role || AppRole.OPERATOR} 
                    disabled={editingUser?.name === 'claudioasousa'}
                    className="w-full h-12 px-4 border border-slate-200 rounded-xl font-bold text-sm appearance-none bg-white outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    {Object.values(AppRole).map(role => <option key={role} value={role}>{ROLE_CONFIG[role]?.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Lotação Atual</label>
                  <select name="zonal" defaultValue={editingUser?.zonal} className="w-full h-12 px-4 border border-slate-200 rounded-xl font-bold text-sm appearance-none bg-white outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="">Sem Unidade Fixa</option>
                    {zonals.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Matrícula (RF)</label>
                  <input name="registrationNumber" defaultValue={editingUser?.registrationNumber} placeholder="Registro Funcional" className="w-full h-12 px-4 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 h-14 bg-white border border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`flex-[2] h-14 ${editingUser?.name === 'claudioasousa' ? 'bg-amber-600' : 'bg-blue-600'} text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-70`}
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSubmitting ? 'Gravando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UNIDADE */}
      {isZonalModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-md overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg"><Database size={24} /></div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingZonal ? 'Editar Unidade' : 'Nova Unidade'}</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Divisão Territorial Administrativa</p>
                </div>
              </div>
              <button onClick={() => setIsZonalModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-rose-500 transition-all"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveZonal} className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Nome da Unidade Zonal</label>
                <input name="name" defaultValue={editingZonal?.name} placeholder="Ex: Zonal Centro-Sul" className="w-full h-12 px-4 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block flex items-center gap-2">
                    <Shield size={10} className="text-blue-600" />
                    Engenheiro Responsável (RT)
                  </label>
                  <select name="managerId" defaultValue={editingZonal?.managerId} className="w-full h-12 px-4 border border-slate-200 rounded-xl font-bold text-sm appearance-none bg-white outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="">Aguardando Designação</option>
                    {users.filter(u => u.role === AppRole.ADMIN || u.role === AppRole.EDITOR).map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({ROLE_CONFIG[u.role]?.label})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block flex items-center gap-2">
                    <UserCheck size={10} className="text-slate-900" />
                    Técnico de Campo (Assistente)
                  </label>
                  <select name="assistantId" defaultValue={editingZonal?.assistantId} className="w-full h-12 px-4 border border-slate-200 rounded-xl font-bold text-sm appearance-none bg-white outline-none focus:ring-2 focus:ring-blue-500/20">
                    <option value="">Nenhum Técnico Vinculado</option>
                    {users.filter(u => u.role !== AppRole.ADMIN).map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({ROLE_CONFIG[u.role]?.label})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Observações / Jurisdição</label>
                <textarea name="description" defaultValue={editingZonal?.description} rows={3} placeholder="Descrição da abrangência territorial..." className="w-full p-4 border border-slate-200 rounded-xl font-medium text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 shadow-inner" />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsZonalModalOpen(false)} className="flex-1 h-14 bg-white border border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-[2] h-14 bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSubmitting ? 'Salvando...' : 'Confirmar Unidade'}
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

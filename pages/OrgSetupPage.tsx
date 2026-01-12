
import React, { useState } from 'react';
import { useApp } from '../App';
import { ZonalType, User, UserRole, ZonalMetadata } from '../types';
import { ZONALS_LIST } from '../constants';
import { UserPlus, Settings, Shield, Map as MapIcon, Edit2, Trash2, X, Save, Search, UserCheck, Briefcase, Plus, AlertCircle, Users, Hash } from 'lucide-react';

const OrgSetupPage: React.FC = () => {
  const { 
    users, requests, zonals, roleLabels, 
    addUser, updateUser, deleteUser, updateZonal, updateRoleLabel, addRole, removeRole,
    getZonalName, getRoleLabel, notify 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'zonals' | 'personnel'>('zonals');
  const [searchTerm, setSearchTerm] = useState('');
  const [newRoleInput, setNewRoleInput] = useState('');
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [isZonalModalOpen, setIsZonalModalOpen] = useState(false);
  const [editingZonal, setEditingZonal] = useState<ZonalMetadata | null>(null);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const getZonalStats = (zonalId: ZonalType) => {
    const zonalUsers = users.filter(u => u.zonal === zonalId);
    const zonalRequests = requests.filter(r => r.zonal === zonalId);
    const zonalMeta = zonals.find(z => z.id === zonalId);
    const manager = users.find(u => u.id === zonalMeta?.managerId);
    const assistant = users.find(u => u.id === zonalMeta?.assistantId);
    
    return {
      displayName: zonalMeta?.name || zonalId,
      managerName: manager?.name || 'Não definido',
      assistantName: assistant?.name || 'Não definido',
      teamCount: zonalUsers.length,
      requestCount: zonalRequests.length
    };
  };

  const handleSaveUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedRole = formData.get('role') as UserRole;
    const selectedZonal = formData.get('zonal') as ZonalType;

    if (selectedRole === 'Manager') {
      const existingManager = users.find(u => 
        u.zonal === selectedZonal && 
        u.role === 'Manager' && 
        u.id !== editingUser?.id
      );

      if (existingManager) {
        notify(`A ${selectedZonal} já possui um Engenheiro Titular: ${existingManager.name}.`, 'error');
        return;
      }
    }

    const userData: User = {
      id: editingUser?.id || `u_${Date.now()}`,
      name: formData.get('name') as string,
      role: selectedRole,
      zonal: selectedZonal,
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

  const handleAddRole = () => {
    if (!newRoleInput.trim()) return;
    addRole(newRoleInput.trim());
    setNewRoleInput('');
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.registrationNumber?.includes(searchTerm)
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configuração</h1>
          <p className="text-slate-500 font-medium">Estrutura organizacional e equipe.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('zonals')}
            className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'zonals' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Unidades
          </button>
          <button 
            onClick={() => setActiveTab('personnel')}
            className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'personnel' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Técnicos
          </button>
        </div>
      </header>

      {activeTab === 'zonals' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ZONALS_LIST.map(zId => {
            const stats = getZonalStats(zId);
            return (
              <div key={zId} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-blue-300 transition-all">
                <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <MapIcon size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-lg leading-none">{stats.displayName}</h3>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingZonal(zonals.find(z => z.id === zId)!);
                      setIsZonalModalOpen(true);
                    }}
                    className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <Settings size={20} />
                  </button>
                </div>
                <div className="p-6 space-y-4 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{getRoleLabel('Manager')} Responsável</span>
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <UserCheck size={16} className="text-blue-500" />
                      {stats.managerName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Estagiário/Responsável</span>
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Users size={16} className="text-indigo-500" />
                      {stats.assistantName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Equipe / Demandas</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{stats.teamCount} Técnicos</span>
                      <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{stats.requestCount} Chamados</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome ou matrícula..." 
                className="w-full h-12 pl-12 pr-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-0 outline-none transition-all font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsRoleModalOpen(true)}
                className="flex items-center justify-center gap-2 h-12 px-5 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 transition-all font-black uppercase tracking-widest text-[10px]"
              >
                <Briefcase size={16} />
                Gerenciar Cargos
              </button>
              <button 
                onClick={() => {
                  setEditingUser(null);
                  setIsUserModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 h-12 px-6 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-black uppercase tracking-widest text-[10px]"
              >
                <UserPlus size={18} />
                Novo Cadastro
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identificação</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cargo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lotação</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Controles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length > 0 ? filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-black text-slate-900">{user.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Hash size={10} className="text-slate-400" />
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Matrícula: {user.registrationNumber || '---'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${
                        user.role === 'Manager' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                        user.role === 'Collaborator' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        'bg-blue-50 border-blue-200 text-blue-700'
                      }`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-600">
                      {getZonalName(user.zonal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-1">
                      <button 
                        onClick={() => {
                          setEditingUser(user);
                          setIsUserModalOpen(true);
                        }}
                        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Excluir o registro de ${user.name}?`)) {
                            deleteUser(user.id);
                          }
                        }}
                        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-400 font-medium">Nenhum técnico cadastrado com este critério.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Labels Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cargos do Sistema</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gestão de Títulos e Hierarquia</p>
              </div>
              <button onClick={() => setIsRoleModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargos Existentes</p>
                {Object.entries(roleLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div className="flex-1">
                      <input 
                        value={label}
                        onChange={(e) => updateRoleLabel(key, e.target.value)}
                        className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
                      />
                    </div>
                    {!['Manager', 'Collaborator', 'Intern'].includes(key) && (
                      <button 
                        onClick={() => removeRole(key)}
                        className="w-12 h-12 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">Adicionar Novo Cargo</p>
                <div className="flex gap-3">
                  <input 
                    placeholder="Ex: Supervisor, Fiscal..."
                    className="flex-1 h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
                    value={newRoleInput}
                    onChange={(e) => setNewRoleInput(e.target.value)}
                  />
                  <button 
                    onClick={handleAddRole}
                    className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 flex gap-3">
              <button onClick={() => setIsRoleModalOpen(false)} className="w-full h-14 bg-slate-900 text-white font-black uppercase text-xs rounded-2xl flex items-center justify-center gap-2">
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User CRUD Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {editingUser ? 'Editar Registro' : 'Novo Cadastro'}
                </h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Setor de Engenharia</p>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded-full shadow-sm transition-all active:scale-90">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-8 space-y-5">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-start gap-3 mb-2">
                <AlertCircle className="text-amber-600 flex-shrink-0" size={18} />
                <p className="text-[10px] text-amber-900 font-bold leading-relaxed uppercase tracking-tight">
                  Atenção: Apenas um Engenheiro (Responsável Técnico) é permitido por Zonal conforme diretriz do SGR-Vias.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
                <input 
                  name="name"
                  defaultValue={editingUser?.name}
                  required
                  placeholder="Nome do profissional"
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Cargo</label>
                  <select 
                    name="role"
                    defaultValue={editingUser?.role || 'Collaborator'}
                    className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none bg-slate-50"
                  >
                    {Object.entries(roleLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Unidade</label>
                  <select 
                    name="zonal"
                    defaultValue={editingUser?.zonal || ZonalType.NORTH}
                    className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none bg-slate-50"
                  >
                    {ZONALS_LIST.map(z => <option key={z} value={z}>{getZonalName(z)}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Matrícula (Opcional)</label>
                <input 
                  name="registrationNumber"
                  defaultValue={editingUser?.registrationNumber}
                  placeholder="Ex: 12345-6"
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">E-mail</label>
                <input 
                  name="email"
                  type="email"
                  defaultValue={editingUser?.email}
                  placeholder="exemplo@prefeitura.gov.br"
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900"
                />
              </div>

              <div className="flex gap-3 pt-6">
                <button 
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 h-14 bg-white border border-slate-200 text-slate-700 font-black uppercase tracking-widest text-xs rounded-2xl active:scale-95 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 h-14 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl active:scale-95 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zonal Settings Modal */}
      {isZonalModalOpen && editingZonal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight leading-none">Configurar Unidade</h2>
                <p className="text-[10px] text-blue-400 font-black tracking-[0.2em] uppercase mt-2">Internal ID: {editingZonal.id}</p>
              </div>
              <button onClick={() => setIsZonalModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all active:scale-90">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveZonal} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Nome de Exibição</label>
                <input 
                  name="name"
                  defaultValue={editingZonal.name}
                  required
                  placeholder="Ex: Distrito Norte, Setor Alfa..."
                  className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900 mb-6"
                />
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Engenheiro Responsável</label>
                    <select 
                      name="managerId"
                      defaultValue={editingZonal.managerId}
                      className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none bg-slate-50"
                    >
                      <option value="">Nenhum atribuído</option>
                      {users.filter(u => u.role === 'Manager').map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Estagiário / Responsável</label>
                    <select 
                      name="assistantId"
                      defaultValue={editingZonal.assistantId}
                      className="w-full h-12 px-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none bg-slate-50"
                    >
                      <option value="">Nenhum atribuído</option>
                      {users.filter(u => u.role !== 'Manager').map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({getRoleLabel(u.role)})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-[9px] text-slate-400 mt-4 font-bold uppercase tracking-tight">
                  Nota: Apenas usuários cadastrados na gestão de pessoal aparecerão nestas listas.
                </p>
              </div>

              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-2 text-blue-800 font-black uppercase text-[10px] tracking-widest mb-1">
                   <Shield size={14} />
                   Diretriz Institucional
                </div>
                <p className="text-xs text-blue-900 font-medium leading-relaxed">As alterações afetarão todos os cabeçalhos de relatórios emitidos sob este ID.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsZonalModalOpen(false)} className="flex-1 h-14 bg-white border border-slate-200 text-slate-700 font-black uppercase text-xs rounded-2xl">Cancelar</button>
                <button type="submit" className="flex-1 h-14 bg-slate-900 text-white font-black uppercase text-xs rounded-2xl flex items-center justify-center gap-2">
                  <Save size={18} />
                  Atualizar
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


import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, PlusCircle, Users, Menu, X, ChevronRight, Plus, CheckCircle, Info, AlertCircle, Loader2 } from 'lucide-react';
import { RepairRequest, User, ZonalType, RequestStatus, ZonalMetadata, UserRole } from './types';
import { MOCK_REQUESTS, MOCK_USERS, INITIAL_ZONAL_METADATA } from './constants';
import DashboardPage from './pages/DashboardPage';
import RequestListPage from './pages/RequestListPage';
import NewRequestPage from './pages/NewRequestPage';
import RequestDetailsPage from './pages/RequestDetailsPage';
import OrgSetupPage from './pages/OrgSetupPage';
import { dbApi } from './services/api';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  requests: RepairRequest[];
  users: User[];
  zonals: ZonalMetadata[];
  roleLabels: Record<string, string>;
  loading: boolean;
  addRequest: (req: RepairRequest) => Promise<void>;
  updateRequest: (req: RepairRequest) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateZonal: (zonal: ZonalMetadata) => Promise<void>;
  updateRoleLabel: (roleKey: string, label: string) => void;
  addRole: (label: string) => void;
  removeRole: (roleKey: string) => void;
  getZonalName: (id: ZonalType) => string;
  getRoleLabel: (role: UserRole) => string;
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Início', icon: LayoutDashboard },
    { path: '/requests', label: 'Lista', icon: ClipboardList },
    { path: '/new', label: 'Novo', icon: PlusCircle, highlight: true },
    { path: '/org', label: 'Gestão', icon: Users },
  ];

  return (
    <>
      <header className="md:hidden flex items-center justify-center p-4 bg-white border-b border-slate-200 sticky top-0 z-40 h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">S</div>
          <span className="font-extrabold tracking-tight text-slate-900">SGR-VIAS</span>
        </div>
      </header>

      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex-col border-r border-slate-800">
        <div className="p-8 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg">S</div>
          <div>
            <h1 className="font-black text-white tracking-tight leading-none text-lg">SGR-Vias</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Obras & Serviços</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200
                  ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="font-semibold text-sm">{item.label}</span>
                {isActive && <ChevronRight className="ml-auto opacity-50" size={16} />}
              </Link>
            );
          })}
        </nav>

        <div className="p-6">
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Ambiente de Operação</p>
            <p className="text-xs font-medium text-white">Supabase Cloud SQL</p>
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-bottom z-50 px-4 h-20 flex items-center justify-around shadow-[0_-8px_20px_-15px_rgba(0,0,0,0.1)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          if (item.highlight) {
            return (
              <Link key={item.path} to={item.path} className="relative -top-6">
                <div className={`
                  w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-90
                  ${isActive ? 'bg-blue-700' : 'bg-blue-600'}
                `}>
                  <Plus size={28} className="text-white" strokeWidth={3} />
                </div>
              </Link>
            )
          }
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 transition-colors active:opacity-60 px-2 py-2`}
            >
              <Icon size={22} className={isActive ? 'text-blue-600' : 'text-slate-400'} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-bold ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

const App: React.FC = () => {
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [zonals, setZonals] = useState<ZonalMetadata[]>(INITIAL_ZONAL_METADATA);
  const [loading, setLoading] = useState(true);
  
  const [roleLabels, setRoleLabels] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('sgr_role_labels');
    return saved ? JSON.parse(saved) : {
      Manager: 'Engenheiro',
      Collaborator: 'Colaborador',
      Intern: 'Estagiário'
    };
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000); // Aumentado para 5s para leitura de erros
  }, []);

  const initData = async () => {
    try {
      setLoading(true);
      const [dbRequests, dbUsers, dbZonals] = await Promise.all([
        dbApi.getRequests(),
        dbApi.getUsers(),
        dbApi.getZonals()
      ]);
      
      setRequests(dbRequests);
      setUsers(dbUsers);
      if (dbZonals.length > 0) setZonals(dbZonals);
    } catch (error: any) {
      console.error(error);
      notify(`Erro de sincronização: ${error.message || 'Verifique o console.'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => localStorage.setItem('sgr_role_labels', JSON.stringify(roleLabels)), [roleLabels]);

  const addRequest = async (req: RepairRequest) => {
    try {
      await dbApi.createRequest(req);
      setRequests(prev => [req, ...prev]);
      notify('Solicitação gravada com sucesso!');
    } catch (e: any) {
      notify(`Erro ao gravar: ${e.message}`, 'error');
    }
  };

  const updateRequest = async (req: RepairRequest) => {
    try {
      await dbApi.updateRequest(req);
      setRequests(prev => prev.map(r => r.id === req.id ? { ...req } : r));
      notify('Registro atualizado.');
    } catch (e: any) {
      notify(`Erro ao atualizar: ${e.message}`, 'error');
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      await dbApi.deleteRequest(id);
      setRequests(prev => prev.filter(r => r.id !== id));
      notify('Excluído com sucesso.', 'info');
    } catch (e: any) {
      notify(`Erro ao excluir: ${e.message}`, 'error');
    }
  };
  
  const addUser = async (user: User) => {
    try {
      await dbApi.saveUser(user);
      setUsers(prev => [...prev, user]);
      notify('Usuário cadastrado!');
    } catch (e: any) {
      notify(`Erro no cadastro: ${e.message}`, 'error');
    }
  };

  const updateUser = async (user: User) => {
    try {
      await dbApi.saveUser(user);
      setUsers(prev => prev.map(u => u.id === user.id ? user : u));
      notify('Perfil atualizado.');
    } catch (e: any) {
      notify(`Erro na atualização: ${e.message}`, 'error');
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await dbApi.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      notify('Usuário removido.', 'info');
    } catch (e: any) {
      notify(`Erro ao remover: ${e.message}`, 'error');
    }
  };
  
  const updateZonal = async (zonal: ZonalMetadata) => {
    try {
      await dbApi.saveZonal(zonal);
      setZonals(prev => prev.map(z => z.id === zonal.id ? zonal : z));
      notify('Configurações da Unidade salvas!');
    } catch (e: any) {
      notify(`Erro ao salvar Unidade: ${e.message}. Verifique se rodou o script SQL no Supabase.`, 'error');
    }
  };

  const updateRoleLabel = (roleKey: string, label: string) => {
    setRoleLabels(prev => ({ ...prev, [roleKey]: label }));
  };

  const addRole = (label: string) => {
    const key = `role_${Date.now()}`;
    setRoleLabels(prev => ({ ...prev, [key]: label }));
    notify(`Cargo "${label}" adicionado.`);
  };

  const removeRole = (roleKey: string) => {
    if (['Manager', 'Collaborator', 'Intern'].includes(roleKey)) {
      notify('Este cargo base não pode ser removido.', 'error');
      return;
    }
    const inUse = users.some(u => u.role === roleKey);
    if (inUse) {
      notify('Cargo em uso por técnicos.', 'error');
      return;
    }
    setRoleLabels(prev => {
      const newLabels = { ...prev };
      delete newLabels[roleKey];
      return newLabels;
    });
    notify('Cargo removido.', 'info');
  };

  const getZonalName = (id: ZonalType) => {
    const zonal = zonals.find(z => z.id === id);
    return zonal?.name || id;
  };

  const getRoleLabel = (role: UserRole) => {
    return roleLabels[role] || role;
  };

  return (
    <AppContext.Provider value={{ 
      requests, users, zonals, roleLabels, loading,
      addRequest, updateRequest, deleteRequest,
      addUser, updateUser, deleteUser,
      updateZonal, updateRoleLabel, addRole, removeRole,
      getZonalName, getRoleLabel, notify
    }}>
      <HashRouter>
        <div className="flex flex-col md:flex-row min-h-screen">
          <Navigation />
          <main className="flex-1 pb-24 md:pb-0 md:pl-64 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto w-full">
               {loading ? (
                 <div className="flex flex-col items-center justify-center h-screen">
                    <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Conectando ao Supabase SQL...</p>
                 </div>
               ) : (
                 <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/requests" element={<RequestListPage />} />
                  <Route path="/requests/:id" element={<RequestDetailsPage />} />
                  <Route path="/new" element={<NewRequestPage />} />
                  <Route path="/org" element={<OrgSetupPage />} />
                 </Routes>
               )}
            </div>
          </main>

          <div className="fixed top-4 md:top-auto md:bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
            {toasts.map(toast => (
              <div 
                key={toast.id}
                className={`
                  p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 md:slide-in-from-bottom-4 duration-300 pointer-events-auto
                  ${toast.type === 'success' ? 'bg-emerald-600 text-white' : toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white'}
                `}
              >
                <div className="mt-0.5">
                  {toast.type === 'success' ? <CheckCircle size={20} /> : toast.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{toast.message}</p>
                  {toast.type === 'error' && <p className="text-[10px] mt-1 opacity-80 uppercase font-black">Verifique se as tabelas estão atualizadas no Supabase.</p>}
                </div>
                <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="opacity-50 hover:opacity-100">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;

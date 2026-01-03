
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, PlusCircle, Users, Menu, X, ChevronRight, Plus, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { RepairRequest, User, ZonalType, RequestStatus, ZonalMetadata, UserRole } from './types';
import { MOCK_REQUESTS, MOCK_USERS, INITIAL_ZONAL_METADATA } from './constants';
import DashboardPage from './pages/DashboardPage';
import RequestListPage from './pages/RequestListPage';
import NewRequestPage from './pages/NewRequestPage';
import RequestDetailsPage from './pages/RequestDetailsPage';
import OrgSetupPage from './pages/OrgSetupPage';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  requests: RepairRequest[];
  users: User[];
  zonals: ZonalMetadata[];
  roleLabels: Record<UserRole, string>;
  addRequest: (req: RepairRequest) => void;
  updateRequest: (req: RepairRequest) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  updateZonal: (zonal: ZonalMetadata) => void;
  updateRoleLabel: (role: UserRole, label: string) => void;
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
            <p className="text-xs font-medium text-white">Prefeitura Municipal</p>
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
  const [requests, setRequests] = useState<RepairRequest[]>(() => {
    const saved = localStorage.getItem('sgr_requests');
    return saved ? JSON.parse(saved) : MOCK_REQUESTS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sgr_users');
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });

  const [zonals, setZonals] = useState<ZonalMetadata[]>(() => {
    const saved = localStorage.getItem('sgr_zonals');
    return saved ? JSON.parse(saved) : INITIAL_ZONAL_METADATA;
  });

  const [roleLabels, setRoleLabels] = useState<Record<UserRole, string>>(() => {
    const saved = localStorage.getItem('sgr_role_labels');
    return saved ? JSON.parse(saved) : {
      Manager: 'Engenheiro',
      Collaborator: 'Colaborador',
      Intern: 'Estagiário'
    };
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => localStorage.setItem('sgr_requests', JSON.stringify(requests)), [requests]);
  useEffect(() => localStorage.setItem('sgr_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('sgr_zonals', JSON.stringify(zonals)), [zonals]);
  useEffect(() => localStorage.setItem('sgr_role_labels', JSON.stringify(roleLabels)), [roleLabels]);

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const addRequest = (req: RepairRequest) => {
    setRequests(prev => [req, ...prev]);
    notify('Solicitação registrada com sucesso!');
  };

  const updateRequest = (req: RepairRequest) => {
    setRequests(prev => prev.map(r => r.id === req.id ? req : r));
    notify('Registro atualizado.');
  };
  
  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
    notify('Cadastro de pessoal realizado!');
  };

  const updateUser = (user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    notify('Cadastro atualizado.');
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    notify('Registro removido.', 'info');
  };
  
  const updateZonal = (zonal: ZonalMetadata) => {
    setZonals(prev => prev.map(z => z.id === zonal.id ? zonal : z));
    notify('Unidade atualizada!');
  };

  const updateRoleLabel = (role: UserRole, label: string) => {
    setRoleLabels(prev => ({ ...prev, [role]: label }));
    notify('Título do cargo atualizado!');
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
      requests, users, zonals, roleLabels,
      addRequest, updateRequest, 
      addUser, updateUser, deleteUser,
      updateZonal, updateRoleLabel, 
      getZonalName, getRoleLabel, notify
    }}>
      <HashRouter>
        <div className="flex flex-col md:flex-row min-h-screen">
          <Navigation />
          <main className="flex-1 pb-24 md:pb-0 md:pl-64 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto w-full">
               <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/requests" element={<RequestListPage />} />
                <Route path="/requests/:id" element={<RequestDetailsPage />} />
                <Route path="/new" element={<NewRequestPage />} />
                <Route path="/org" element={<OrgSetupPage />} />
               </Routes>
            </div>
          </main>

          {/* Toast Container */}
          <div className="fixed top-4 md:top-auto md:bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
            {toasts.map(toast => (
              <div 
                key={toast.id}
                className={`
                  p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 md:slide-in-from-bottom-4 duration-300 pointer-events-auto
                  ${toast.type === 'success' ? 'bg-emerald-600 text-white' : toast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white'}
                `}
              >
                {toast.type === 'success' ? <CheckCircle size={20} /> : toast.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
                <p className="text-sm font-bold flex-1">{toast.message}</p>
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

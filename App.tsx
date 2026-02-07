
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, PlusCircle, Users, Menu, X, ChevronRight, Plus, CheckCircle, Info, AlertCircle, Loader2, LogOut, UserCircle, ShieldCheck, ShieldAlert, Map as MapIcon, History, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { RepairRequest, User, ZonalType, RequestStatus, ZonalMetadata, UserRole, AppRole, AuditAction, AuditEntity } from './types';
import { ROLE_CONFIG, DEFAULT_ROLE_CONFIG, INITIAL_ZONAL_METADATA, MOCK_USERS } from './constants';
import DashboardPage from './pages/DashboardPage';
import RequestListPage from './pages/RequestListPage';
import NewRequestPage from './pages/NewRequestPage';
import RequestDetailsPage from './pages/RequestDetailsPage';
import OrgSetupPage from './pages/OrgSetupPage';
import MapOverviewPage from './pages/MapOverviewPage';
import AuditLogPage from './pages/AuditLogPage';
import { dbApi } from './services/api';
import { supabase } from './services/supabase';

// --- COMPONENTE DE LOGIN ---
const LoginPage = () => {
  const { handleLogin, notify } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      notify("Preencha todos os campos", "error");
      return;
    }
    setLoading(true);
    const success = await handleLogin(username, password);
    setLoading(false);
    if (!success) {
      notify("Credenciais inválidas. Tente admin/admin", "error");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-10 text-center">
             <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-blue-500/20">
                <ShieldCheck size={32} className="text-white" />
             </div>
             <h1 className="text-2xl font-black text-white tracking-tight uppercase italic">SGR-Vias</h1>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Gestão de Zeladoria Urbana</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuário ou Matrícula</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Ex: admin"
                  className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Privada</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 pl-12 pr-12 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 mt-8"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Autenticar no Sistema"}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
             <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Acesso restrito a servidores autorizados</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- CONTEXTO E PROVEDOR ---
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  requests: RepairRequest[];
  users: User[];
  zonals: ZonalMetadata[];
  currentUser: User | null;
  loading: boolean;
  canDo: (action: string) => boolean;
  handleLogin: (u: string, p: string) => Promise<boolean>;
  logout: () => void;
  addRequest: (req: RepairRequest) => Promise<void>;
  updateRequest: (req: RepairRequest) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  refreshRequests: () => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateZonal: (zonal: ZonalMetadata) => Promise<void>;
  getZonalName: (id: ZonalType) => string;
  getRoleLabel: (role: AppRole) => string;
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp deve ser usado dentro de um AppProvider");
  return context;
};

// --- PROTEÇÃO DE ROTAS ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useApp();
  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Fix: Navigation component doesn't take props but React.FC or similar typing might be expecting it. 
// Adding explicit React.FC type or props interface to ensure type safety.
const Navigation: React.FC = () => {
  const location = useLocation();
  const { currentUser, canDo, logout } = useApp();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, visible: true },
    { path: '/map', label: 'Mapa Operativo', icon: MapIcon, visible: true },
    { path: '/requests', label: 'Vistorias', icon: ClipboardList, visible: true },
    { path: '/new', label: 'Nova Vistoria', icon: PlusCircle, highlight: true, visible: canDo('create_request') },
    { path: '/org', label: 'Gestão de Usuários', icon: Users, visible: canDo('manage_users') },
    { path: '/audit', label: 'Auditoria', icon: History, visible: canDo('view_audit') },
  ];

  const currentRoleConfig = (currentUser && currentUser.role && ROLE_CONFIG[currentUser.role]) 
    ? ROLE_CONFIG[currentUser.role] 
    : DEFAULT_ROLE_CONFIG;

  return (
    <>
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-40 h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center font-bold text-white">S</div>
          <span className="font-extrabold tracking-tight text-slate-900 uppercase">SGR-VIAS</span>
        </div>
        <button onClick={logout} className="p-2 text-rose-500"><LogOut size={20} /></button>
      </header>

      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex-col border-r border-slate-800">
        <div className="p-8 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg">S</div>
          <div>
            <h1 className="font-black text-white tracking-tight leading-none text-lg">SGR-Vias</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 font-bold">Zeladoria Urbana</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.filter(i => i.visible).map((item) => {
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
                <Icon size={20} />
                <span className="font-semibold text-sm">{item.label}</span>
                {isActive && <ChevronRight className="ml-auto opacity-50" size={16} />}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800 border border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm">
              {currentUser?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-xs font-black text-white truncate">{currentUser?.name}</p>
               <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{currentRoleConfig.label}</p>
            </div>
            <button onClick={logout} className="p-2 text-slate-500 hover:text-rose-400 transition-colors"><LogOut size={18} /></button>
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-bottom z-50 px-4 h-20 flex items-center justify-around shadow-2xl">
        {navItems.filter(i => i.visible).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          if (item.highlight) {
            return (
              <Link key={item.path} to={item.path} className="relative -top-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl bg-blue-600">
                  <Plus size={28} className="text-white" strokeWidth={3} />
                </div>
              </Link>
            )
          }
          return (
            <Link key={item.path} to={item.path} className="flex flex-col items-center justify-center gap-1">
              <Icon size={22} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
              <span className={`text-[10px] font-bold ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>{item.label}</span>
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
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const handleLogin = async (u: string, p: string) => {
    try {
      const user = await dbApi.login(u, p);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('sgr_vias_session', JSON.stringify(user));
        notify(`Bem-vindo, ${user.name}!`);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sgr_vias_session');
    notify("Sessão encerrada.");
  };

  const canDo = useCallback((action: string) => {
    if (!currentUser) return false;
    const role = currentUser.role;
    const isAdmin = role === AppRole.ADMIN;
    const isEditor = role === AppRole.EDITOR || isAdmin;
    const isOperator = role === AppRole.OPERATOR || isEditor;

    switch (action) {
      case 'manage_users': return isAdmin;
      case 'view_audit': return isAdmin;
      case 'create_request': return isOperator;
      case 'edit_request': return isOperator;
      case 'delete_request': return isAdmin;
      case 'view_all_zonals': return role !== AppRole.VIEWER;
      default: return false;
    }
  }, [currentUser]);

  const initData = async () => {
    try {
      setLoading(true);
      const saved = localStorage.getItem('sgr_vias_session');
      if (saved) setCurrentUser(JSON.parse(saved));

      const [dbReqs, dbUsers, dbZonals] = await Promise.all([
        dbApi.getRequests(),
        dbApi.getUsers(),
        dbApi.getZonals()
      ]);
      setRequests(dbReqs);
      setUsers(dbUsers);
      setZonals(dbZonals.length > 0 ? dbZonals : INITIAL_ZONAL_METADATA);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { initData(); }, []);

  const refreshRequests = async () => { setRequests(await dbApi.getRequests()); };
  
  const addRequest = async (req: RepairRequest) => {
    await dbApi.createRequest(req);
    await refreshRequests();
    await dbApi.createAuditLog({ user_id: currentUser!.id, user_name: currentUser!.name, action: AuditAction.CREATE, entity_type: AuditEntity.REQUEST, entity_id: req.id, details: { protocol: req.protocol } });
  };

  const updateRequest = async (req: RepairRequest) => {
    await dbApi.updateRequest(req);
    await refreshRequests();
    await dbApi.createAuditLog({ user_id: currentUser!.id, user_name: currentUser!.name, action: AuditAction.UPDATE, entity_type: AuditEntity.REQUEST, entity_id: req.id, details: { status: req.status } });
  };

  const deleteRequest = async (id: string) => {
    await dbApi.deleteRequest(id);
    await refreshRequests();
    await dbApi.createAuditLog({ user_id: currentUser!.id, user_name: currentUser!.name, action: AuditAction.DELETE, entity_type: AuditEntity.REQUEST, entity_id: id, details: {} });
  };

  const addUser = async (u: User) => { await dbApi.saveUser(u); setUsers(await dbApi.getUsers()); };
  const updateUser = async (u: User) => { await dbApi.saveUser(u); setUsers(await dbApi.getUsers()); };
  const deleteUser = async (id: string) => { await dbApi.deleteUser(id); setUsers(await dbApi.getUsers()); };
  const updateZonal = async (z: ZonalMetadata) => { await dbApi.saveZonal(z); setZonals(await dbApi.getZonals()); };
  const getZonalName = (id: ZonalType) => zonals.find(z => z.id === id)?.name || id;
  const getRoleLabel = (role: AppRole) => ROLE_CONFIG[role]?.label || role;

  return (
    <AppContext.Provider value={{ 
      requests, users, zonals, currentUser, loading, canDo, handleLogin, logout,
      addRequest, updateRequest, deleteRequest, refreshRequests,
      addUser, updateUser, deleteUser, updateZonal, getZonalName, getRoleLabel, notify
    }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={currentUser ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
                <Navigation />
                <main className="flex-1 md:pl-64 h-full">
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/map" element={<MapOverviewPage />} />
                    <Route path="/requests" element={<RequestListPage />} />
                    <Route path="/requests/:id" element={<RequestDetailsPage />} />
                    <Route path="/new" element={<NewRequestPage />} />
                    <Route path="/org" element={<OrgSetupPage />} />
                    <Route path="/audit" element={<AuditLogPage />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          } />
        </Routes>

        {/* Toasts */}
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-sm pointer-events-none flex flex-col gap-3">
          {toasts.map(t => (
            <div key={t.id} className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 border pointer-events-auto animate-in slide-in-from-bottom-4 duration-300 ${t.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'}`}>
              {t.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="text-xs font-bold flex-1">{t.message}</span>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}><X size={16} /></button>
            </div>
          ))}
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;


import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, ClipboardList, PlusCircle, Users, Menu, X, 
  ChevronRight, ChevronDown, Plus, CheckCircle, AlertCircle, 
  Loader2, LogOut, ShieldCheck, Map as MapIcon, History, 
  Lock, User as UserIcon, Eye, EyeOff, Settings, 
  Briefcase, FileText, Navigation as NavIcon, Route as RouteIcon,
  Database, UserCog, UserCheck, MapPinned, ListChecks, RefreshCw
} from 'lucide-react';
import { RepairRequest, User, ZonalType, RequestStatus, ZonalMetadata, AppRole, AuditAction, AuditEntity, VisitRoute } from './types';
import { ROLE_CONFIG, DEFAULT_ROLE_CONFIG, INITIAL_ZONAL_METADATA, MOCK_USERS, MOCK_REQUESTS } from './constants';
import DashboardPage from './pages/DashboardPage';
import RequestListPage from './pages/RequestListPage';
import NewRequestPage from './pages/NewRequestPage';
import RequestDetailsPage from './pages/RequestDetailsPage';
import OrgSetupPage from './pages/OrgSetupPage';
import MapOverviewPage from './pages/MapOverviewPage';
import AuditLogPage from './pages/AuditLogPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import RouteListPage from './pages/RouteListPage';
import RoutePlannerPage from './pages/RoutePlannerPage';
import { dbApi } from './services/api';

// --- CONTEXTO DA APLICAÇÃO ---
const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

interface AppContextType {
  requests: RepairRequest[];
  users: User[];
  zonals: ZonalMetadata[];
  routes: VisitRoute[];
  currentUser: User | null;
  loading: boolean;
  syncing: boolean;
  canDo: (action: string) => boolean;
  handleLogin: (u: string, p: string) => Promise<boolean>;
  logout: () => void;
  addRequest: (req: RepairRequest) => Promise<void>;
  updateRequest: (req: RepairRequest) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  refreshRequests: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshRoutes: () => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addRoute: (route: VisitRoute) => Promise<void>;
  deleteRoute: (id: string) => Promise<void>;
  updateZonal: (zonal: ZonalMetadata) => Promise<void>;
  getZonalName: (id: ZonalType | string) => string;
  getRoleLabel: (role: AppRole) => string;
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

// --- COMPONENTE DE LOGIN ---
const LoginPage = () => {
  const { handleLogin, notify } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      notify("Informe usuário e senha", "error");
      return;
    }
    setLoading(true);
    try {
      const success = await handleLogin(username.trim(), password.trim());
      if (!success) {
        notify("Credenciais inválidas. Tente admin / admin", "error");
      }
    } catch (err) {
      notify("Erro de conexão com o banco", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-10 text-center">
             <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-blue-500/20">
                <ShieldCheck size={32} className="text-white" />
             </div>
             <h1 className="text-2xl font-black text-white tracking-tight uppercase italic">SGR-Vias</h1>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Portal de Autenticação</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuário / Matrícula</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Seu usuário"
                  className="w-full h-14 pl-12 pr-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
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
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Acessar Sistema"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTES DE NAVEGAÇÃO ---
const NavGroup = ({ label, icon: Icon, children, defaultOpen = false, visible = true }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  if (!visible) return null;

  return (
    <div className="space-y-1">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-all group"
      >
        <Icon size={18} className="text-slate-500 group-hover:text-blue-400" />
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white flex-1 text-left">{label}</span>
        <ChevronDown size={14} className={`text-slate-600 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="pl-11 pr-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

const NavSubItem = ({ to, label, icon: Icon }: any) => {
  const location = useLocation();
  const isActive = location.pathname + location.search === to;
  
  return (
    <Link
      to={to}
      onClick={() => { if(window.innerWidth < 768) closeMobileMenu(); }}
      className={`
        flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all text-[11px] font-bold uppercase tracking-tight
        ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-white hover:bg-slate-800'}
      `}
    >
      <Icon size={14} className={isActive ? 'text-white' : 'text-slate-600'} />
      {label}
    </Link>
  );
};

let closeMobileMenu: () => void;

const Navigation = () => {
  const location = useLocation();
  const { currentUser, logout, syncing } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentRoleConfig = (currentUser && currentUser.role && ROLE_CONFIG[currentUser.role]) 
    ? ROLE_CONFIG[currentUser.role] 
    : DEFAULT_ROLE_CONFIG;

  const isAdmin = currentUser?.role === AppRole.ADMIN;

  closeMobileMenu = () => setIsMobileMenuOpen(false);

  const NavLinks = () => (
    <>
      <Link 
        to="/" 
        onClick={() => { if(window.innerWidth < 768) closeMobileMenu(); }}
        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${location.pathname === '/' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'hover:bg-slate-800 hover:text-white'}`}
      >
        <LayoutDashboard size={18} />
        <span className="font-black uppercase text-[11px] tracking-widest">Dashboard</span>
      </Link>

      <NavGroup label="Vistorias" icon={ClipboardList} defaultOpen={location.pathname.startsWith('/new') || location.pathname.startsWith('/map') || location.pathname.startsWith('/requests') || location.pathname.startsWith('/routes')}>
        <NavSubItem to="/new" label="Nova Vistoria" icon={PlusCircle} />
        <NavSubItem to="/map" label="Mapa Interativo" icon={MapIcon} />
        <NavSubItem to="/requests" label="Relatórios" icon={FileText} />
        <NavSubItem to="/routes" label="Roteiro de Visitas" icon={RouteIcon} />
      </NavGroup>

      {isAdmin && (
        <NavGroup label="Configurações" icon={Settings} defaultOpen={location.pathname.startsWith('/org') || location.pathname.startsWith('/audit')}>
          <NavSubItem to="/org?tab=personnel" label="Gestão Equipe" icon={UserCog} />
          <NavSubItem to="/org?tab=zonals" label="Gestão Unidades" icon={Database} />
          <NavSubItem to="/audit" label="Auditoria" icon={History} />
        </NavGroup>
      )}
    </>
  );

  return (
    <>
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-[60] h-16 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-900 bg-slate-100 rounded-xl active:scale-95 transition-all">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-200">S</div>
            <span className="font-black tracking-tight text-slate-900 uppercase text-sm">SGR-VIAS</span>
          </div>
        </div>
        {syncing && <RefreshCw size={14} className="text-blue-500 animate-spin" />}
      </header>

      {isMobileMenuOpen && <div className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[55] animate-in fade-in duration-300" onClick={closeMobileMenu} />}

      <aside className={`md:hidden fixed inset-y-0 left-0 w-[280px] bg-slate-950 text-slate-300 flex flex-col z-[58] shadow-2xl transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl text-white">S</div>
          <div><h1 className="font-black text-white text-lg">SGR-Vias</h1></div>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-4 overflow-y-auto"><NavLinks /></nav>
        <div className="p-6 border-t border-slate-900"><button onClick={logout} className="w-full flex items-center justify-center gap-3 h-14 bg-rose-900/20 text-rose-500 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-rose-900/30">Encerrar Sessão</button></div>
      </aside>

      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-slate-950 text-slate-300 flex-col border-r border-slate-800 z-50 shadow-2xl">
        <div className="p-8 border-b border-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-900/20">S</div>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-white text-lg">SGR-Vias</h1>
            {syncing && <div className="flex items-center gap-2 text-[8px] font-bold text-blue-400 uppercase animate-pulse"><RefreshCw size={8} className="animate-spin" /> Sincronizando Cloud...</div>}
          </div>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-4 overflow-y-auto"><NavLinks /></nav>
        <div className="p-6 border-t border-slate-900 bg-slate-950/80">
          <div className="flex flex-col gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm">{currentUser?.name?.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                 <p className="text-xs font-black text-white truncate">{currentUser?.name}</p>
                 <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{currentRoleConfig.label}</p>
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-800 pt-3">
              <Link to="/profile/password" className="flex-1 flex items-center justify-center gap-2 h-10 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-all text-[10px] font-black uppercase tracking-widest"><Lock size={14} /> Segurança</Link>
              <button onClick={logout} className="w-10 h-10 flex items-center justify-center bg-rose-900/20 text-rose-500 rounded-xl hover:bg-rose-900/40 transition-all"><LogOut size={16} /></button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

// --- COMPONENTE APP ---
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { currentUser, loading } = useApp();
  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => {
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [routes, setRoutes] = useState<VisitRoute[]>([]);
  const [zonals, setZonals] = useState<ZonalMetadata[]>(INITIAL_ZONAL_METADATA);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // Hydration Instantânea do Cache
  useEffect(() => {
    const hydrate = () => {
      console.time("Hydration");
      const savedUser = localStorage.getItem('sgr_vias_session');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));

      const cachedRequests = localStorage.getItem('sgr_vias_cache_requests');
      if (cachedRequests) setRequests(JSON.parse(cachedRequests));
      
      const cachedUsers = localStorage.getItem('sgr_vias_cache_users');
      if (cachedUsers) setUsers(JSON.parse(cachedUsers));

      const cachedZonals = localStorage.getItem('sgr_vias_cache_zonals');
      if (cachedZonals) setZonals(JSON.parse(cachedZonals));

      const cachedRoutes = localStorage.getItem('sgr_vias_cache_routes');
      if (cachedRoutes) setRoutes(JSON.parse(cachedRoutes));

      // Se temos dados em cache, liberamos a tela imediatamente
      if (cachedRequests || cachedUsers) setLoading(false);
      console.timeEnd("Hydration");
    };
    hydrate();
  }, []);

  const initData = async () => {
    try {
      setSyncing(true);
      console.log("Iniciando sincronização Cloud em background...");

      const results = await Promise.allSettled([
        dbApi.getRequests(),
        dbApi.getUsers(),
        dbApi.getZonals(),
        dbApi.getRoutes()
      ]);

      const [reqsRes, usersRes, zonalsRes, routesRes] = results;

      if (reqsRes.status === 'fulfilled') {
        const data = reqsRes.value.length > 0 ? reqsRes.value : MOCK_REQUESTS;
        setRequests(data);
        localStorage.setItem('sgr_vias_cache_requests', JSON.stringify(data));
      }
      if (usersRes.status === 'fulfilled') {
        const data = usersRes.value.length > 0 ? usersRes.value : MOCK_USERS;
        setUsers(data);
        localStorage.setItem('sgr_vias_cache_users', JSON.stringify(data));
      }
      if (zonalsRes.status === 'fulfilled') {
        const data = zonalsRes.value.length > 0 ? zonalsRes.value : INITIAL_ZONAL_METADATA;
        setZonals(data);
        localStorage.setItem('sgr_vias_cache_zonals', JSON.stringify(data));
      }
      if (routesRes.status === 'fulfilled') {
        setRoutes(routesRes.value);
        localStorage.setItem('sgr_vias_cache_routes', JSON.stringify(routesRes.value));
      }

    } catch (e) { 
      console.error("Erro na sincronização Cloud:", e);
    } finally { 
      setLoading(false); 
      setSyncing(false);
    }
  };

  useEffect(() => { initData(); }, []);

  const refreshRequests = async () => { 
    setSyncing(true);
    try {
      const data = await dbApi.getRequests();
      const finalData = data.length > 0 ? data : MOCK_REQUESTS;
      setRequests(finalData);
      localStorage.setItem('sgr_vias_cache_requests', JSON.stringify(finalData));
    } finally { setSyncing(false); }
  };
  
  const refreshUsers = async () => {
    setSyncing(true);
    try {
      const data = await dbApi.getUsers();
      setUsers(data);
      localStorage.setItem('sgr_vias_cache_users', JSON.stringify(data));
    } finally { setSyncing(false); }
  };

  const refreshRoutes = async () => {
    setSyncing(true);
    try {
      const data = await dbApi.getRoutes();
      setRoutes(data);
      localStorage.setItem('sgr_vias_cache_routes', JSON.stringify(data));
    } finally { setSyncing(false); }
  };

  const handleLogin = async (u: string, p: string) => {
    try {
      const user = await dbApi.login(u, p);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('sgr_vias_session', JSON.stringify(user));
        return true;
      }
      if (u === 'admin' && p === 'admin') {
        const mockAdmin = MOCK_USERS[0];
        setCurrentUser(mockAdmin);
        localStorage.setItem('sgr_vias_session', JSON.stringify(mockAdmin));
        return true;
      }
      return false;
    } catch (e) { return false; }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sgr_vias_session');
    notify("Sessão encerrada.");
  };

  const canDo = useCallback((action: string) => {
    if (!currentUser) return false;
    const isAdmin = currentUser.role === AppRole.ADMIN;
    switch (action) {
      case 'manage_users': return isAdmin;
      case 'view_audit': return isAdmin;
      case 'create_request': return isAdmin || currentUser.role === AppRole.OPERATOR || currentUser.role === AppRole.EDITOR;
      case 'edit_request': return isAdmin || currentUser.role === AppRole.OPERATOR || currentUser.role === AppRole.EDITOR;
      case 'delete_request': return isAdmin;
      case 'manage_routes': return isAdmin || currentUser.role === AppRole.EDITOR;
      default: return false;
    }
  }, [currentUser]);

  const addRequest = async (req: RepairRequest) => { 
    setSyncing(true);
    await dbApi.createRequest(req); 
    refreshRequests(); 
  };

  const updateRequest = async (req: RepairRequest) => { 
    setSyncing(true);
    await dbApi.updateRequest(req); 
    refreshRequests(); 
  };

  const deleteRequest = async (id: string) => { 
    setSyncing(true);
    await dbApi.deleteRequest(id); 
    refreshRequests(); 
  };

  const addUser = async (u: User) => { 
    setSyncing(true);
    await dbApi.saveUser(u); 
    refreshUsers(); 
  };

  const updateUser = async (u: User) => { 
    setSyncing(true);
    await dbApi.saveUser(u); 
    refreshUsers(); 
  };
  
  const deleteUser = async (id: string) => { 
    setSyncing(true);
    await dbApi.deleteUser(id); 
    refreshUsers(); 
  };

  const addRoute = async (route: VisitRoute) => {
    setSyncing(true);
    await dbApi.saveRoute(route);
    refreshRoutes();
  };

  const deleteRoute = async (id: string) => {
    setSyncing(true);
    await dbApi.deleteRoute(id);
    refreshRoutes();
  };

  const updateZonal = async (z: ZonalMetadata) => { 
    setSyncing(true);
    await dbApi.saveZonal(z); 
    const data = await dbApi.getZonals();
    setZonals(data);
    localStorage.setItem('sgr_vias_cache_zonals', JSON.stringify(data));
    setSyncing(false);
  };

  const getZonalName = (id: ZonalType | string) => zonals.find(z => z.id === id)?.name || id;
  const getRoleLabel = (role: AppRole) => ROLE_CONFIG[role]?.label || role;

  return (
    <AppContext.Provider value={{ 
      requests, users, zonals, routes, currentUser, loading, syncing, canDo, handleLogin, logout,
      addRequest, updateRequest, deleteRequest, refreshRequests, refreshUsers, refreshRoutes,
      addUser, updateUser, deleteUser, addRoute, deleteRoute, updateZonal, getZonalName, getRoleLabel, notify
    }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={currentUser ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
                <Navigation />
                <main className="flex-1 md:pl-64 h-full relative">
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/map" element={<MapOverviewPage />} />
                    <Route path="/requests" element={<RequestListPage />} />
                    <Route path="/requests/:id" element={<RequestDetailsPage />} />
                    <Route path="/new" element={<NewRequestPage />} />
                    <Route path="/routes" element={<RouteListPage />} />
                    <Route path="/routes/planner" element={<RoutePlannerPage />} />
                    <Route path="/org" element={<OrgSetupPage />} />
                    <Route path="/audit" element={<AuditLogPage />} />
                    <Route path="/profile/password" element={<ChangePasswordPage />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          } />
        </Routes>

        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-sm pointer-events-none flex flex-col gap-3">
          {toasts.map(t => (
            <div key={t.id} className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 border pointer-events-auto animate-in slide-in-from-bottom-4 duration-300 ${t.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'}`}>
              {t.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="text-[11px] font-black uppercase tracking-tight flex-1">{t.message}</span>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}><X size={16} /></button>
            </div>
          ))}
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;
interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; }

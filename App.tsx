
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, ClipboardList, PlusCircle, Users, Menu, X, 
  ChevronRight, ChevronDown, Plus, CheckCircle, AlertCircle, 
  Loader2, LogOut, ShieldCheck, Map as MapIcon, History, 
  Lock, User as UserIcon, Eye, EyeOff, Settings, 
  Briefcase, FileText, Navigation as NavIcon, Route as RouteIcon,
  Database, UserCog, UserCheck, MapPinned, ListChecks, RefreshCw,
  Globe, Server, Shield, Activity, HardDrive
} from 'lucide-react';
import { RepairRequest, User, ZonalType, RequestStatus, ZonalMetadata, AppRole, AuditAction, AuditEntity, VisitRoute } from './types';
import { ROLE_CONFIG, DEFAULT_ROLE_CONFIG, INITIAL_ZONAL_METADATA } from './constants';
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

// --- COMPONENTE DE LOADING MODERNO ---
const LoadingScreen = ({ progress, status }: { progress: number, status: string }) => (
  <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950">
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse"></div>
    
    <div className="w-full max-w-sm px-8 text-center space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="relative mx-auto w-24 h-24">
        <div className="absolute inset-0 bg-blue-600/20 rounded-3xl blur-xl animate-pulse"></div>
        <div className="relative bg-blue-600 rounded-3xl w-24 h-24 flex items-center justify-center shadow-2xl border border-white/10">
          <ShieldCheck size={48} className="text-white" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Iniciando SGR-Vias</h2>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">{status}</p>
      </div>

      <div className="space-y-4">
        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(37,99,235,0.5)]" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  </div>
);

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
      if (!success) notify("Credenciais inválidas.", "error");
    } catch (err) {
      notify("Erro de conexão.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
      <div className="w-full max-w-md p-6 relative z-10 animate-in fade-in duration-700">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
          <div className="flex flex-col items-center mb-10 text-center">
             <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                <ShieldCheck size={32} className="text-white" />
             </div>
             <h1 className="text-2xl font-black text-white tracking-tight uppercase italic">SGR-Vias</h1>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Plataforma de Zeladoria Urbana</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-5">
            <input 
              type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Usuário / RF"
              className="w-full h-14 px-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha"
                className="w-full h-14 px-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button disabled={loading} className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl transition-all">
              {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Acessar Sistema"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { currentUser, loading } = useApp();
  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const Navigation = () => {
  const location = useLocation();
  const { currentUser, logout, syncing } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  
  // VERIFICAÇÃO ROOT/ADMIN COMPLETA
  const isRootOrAdmin = currentUser?.role === AppRole.ADMIN || currentUser?.name === 'claudioasousa';

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <Link 
      to={to} 
      onClick={closeMobileMenu} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === to ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
    >
      <Icon size={18} /> 
      <span className="font-black uppercase text-[11px] tracking-widest">{label}</span>
    </Link>
  );

  return (
    <>
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-[60] h-16">
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-900 bg-slate-100 rounded-xl">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="font-black tracking-tight text-slate-900 uppercase text-sm italic">SGR-VIAS</span>
        {syncing && <RefreshCw size={14} className="text-blue-500 animate-spin" />}
      </header>

      <aside className={`md:flex fixed inset-y-0 left-0 w-64 bg-slate-950 text-slate-300 flex-col border-r border-slate-800 z-50 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 border-b border-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-lg">S</div>
          <h1 className="font-black text-white text-lg tracking-tight uppercase italic">SGR-Vias</h1>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
          <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-3">Principal</p>
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          
          <div className="pt-6 pb-2">
            <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-3">Operações</p>
            <NavItem to="/new" icon={PlusCircle} label="Nova Vistoria" />
            <NavItem to="/requests" icon={ClipboardList} label="Inventário PDF" />
            <NavItem to="/map" icon={MapIcon} label="Mapa Interativo" />
            <NavItem to="/routes" icon={RouteIcon} label="Roteiros de Visita" />
          </div>

          {isRootOrAdmin && (
            <div className="pt-6 pb-2">
              <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-3">Gestão de Equipe</p>
              <NavItem to="/org" icon={UserCog} label="Equipe & Unidades" />
              <NavItem to="/audit" icon={Activity} label="Trilha de Auditoria" />
            </div>
          )}
        </nav>

        <div className="p-6 border-t border-slate-900 space-y-3">
           <div className="px-4 py-3 bg-white/5 rounded-xl border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Operador Logado:</p>
              <p className="text-[11px] font-black text-white uppercase truncate">{currentUser?.name}</p>
              {isRootOrAdmin && <p className="text-[8px] font-black text-emerald-500 uppercase mt-1">Acesso Total</p>}
           </div>
           <button onClick={logout} className="w-full flex items-center justify-center gap-3 h-12 bg-rose-900/10 text-rose-500 rounded-xl font-black uppercase text-[10px] hover:bg-rose-900/20 transition-all">Sair do Sistema</button>
        </div>
      </aside>
    </>
  );
};

const App = () => {
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [routes, setRoutes] = useState<VisitRoute[]>([]);
  const [zonals, setZonals] = useState<ZonalMetadata[]>(INITIAL_ZONAL_METADATA);
  
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadStatus, setLoadStatus] = useState('Iniciando...');
  
  const [syncing, setSyncing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const notify = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  useEffect(() => {
    const session = localStorage.getItem('sgr_vias_session');
    if (session) setCurrentUser(JSON.parse(session));
    initData();
  }, []);

  const initData = async () => {
    setLoading(true);
    try {
      setLoadStatus('Sincronizando registros...');
      setLoadProgress(30);
      
      const [reqs, usrs, zns, rts] = await Promise.all([
        dbApi.getRequests(),
        dbApi.getUsers(),
        dbApi.getZonals(),
        dbApi.getRoutes()
      ]);
      
      setLoadProgress(70);
      setRequests(reqs);
      setUsers(usrs);
      setZonals(zns.length > 0 ? zns : INITIAL_ZONAL_METADATA);
      setRoutes(rts);
      
      setLoadProgress(100);
      setTimeout(() => setLoading(false), 500);
    } catch (e) {
      setLoadStatus('Erro na sincronização remota');
      setTimeout(() => setLoading(false), 1500);
    }
  };

  const handleLogin = async (u: string, p: string) => {
    const user = await dbApi.login(u, p);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('sgr_vias_session', JSON.stringify(user));
      setLoading(true);
      await initData();
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sgr_vias_session');
    notify("Sessão encerrada.");
  };

  const canDo = useCallback((action: string) => {
    if (!currentUser) return false;
    // BYPASS ROOT PARA TUDO
    const isRootOrAdmin = currentUser.role === AppRole.ADMIN || currentUser.name === 'claudioasousa';
    if (isRootOrAdmin) return true;

    switch (action) {
      case 'create_request': return currentUser.role !== AppRole.VIEWER;
      case 'edit_request': return currentUser.role !== AppRole.VIEWER;
      case 'view_audit': return isRootOrAdmin;
      case 'manage_routes': return currentUser.role !== AppRole.VIEWER;
      default: return false;
    }
  }, [currentUser]);

  const addRequest = async (req: RepairRequest) => {
    setRequests(prev => [req, ...prev]);
    try { await dbApi.createRequest(req); notify("Vistoria salva."); } catch (e) { notify("Erro ao salvar no servidor.", "error"); }
  };

  const updateRequest = async (req: RepairRequest) => {
    setRequests(prev => prev.map(r => r.id === req.id ? req : r));
    try { await dbApi.updateRequest(req); notify("Registro atualizado."); } catch (e) { notify("Erro no servidor.", "error"); }
  };

  const deleteRequest = async (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    try { await dbApi.deleteRequest(id); notify("Removido."); } catch (e) { notify("Erro no servidor.", "error"); }
  };

  const refreshRequests = async () => { setSyncing(true); const data = await dbApi.getRequests(); setRequests(data); setSyncing(false); };
  const refreshUsers = async () => { setSyncing(true); const data = await dbApi.getUsers(); setUsers(data); setSyncing(false); };
  const refreshRoutes = async () => { setSyncing(true); const data = await dbApi.getRoutes(); setRoutes(data); setSyncing(false); };

  const addUser = async (u: User) => { setUsers(prev => [...prev, u]); await dbApi.saveUser(u); };
  const updateUser = async (u: User) => { setUsers(prev => prev.map(x => x.id === u.id ? u : x)); await dbApi.saveUser(u); };
  const deleteUser = async (id: string) => { setUsers(prev => prev.filter(x => x.id !== id)); await dbApi.deleteUser(id); };
  const addRoute = async (r: VisitRoute) => { setRoutes(prev => [r, ...prev]); await dbApi.saveRoute(r); };
  const deleteRoute = async (id: string) => { setRoutes(prev => prev.filter(x => x.id !== id)); await dbApi.deleteRoute(id); };
  const updateZonal = async (z: ZonalMetadata) => { setZonals(prev => prev.map(x => x.id === z.id ? z : x)); await dbApi.saveZonal(z); };
  const getZonalName = (id: ZonalType | string) => zonals.find(z => z.id === id)?.name || id;
  const getRoleLabel = (role: AppRole) => ROLE_CONFIG[role]?.label || role;

  return (
    <AppContext.Provider value={{ 
      requests, users, zonals, routes, currentUser, loading, syncing, canDo, handleLogin, logout,
      addRequest, updateRequest, deleteRequest, refreshRequests, refreshUsers, refreshRoutes,
      addUser, updateUser, deleteUser, addRoute, deleteRoute, updateZonal, getZonalName, getRoleLabel, notify
    }}>
      {loading && <LoadingScreen progress={loadProgress} status={loadStatus} />}
      <HashRouter>
        <Routes>
          <Route path="/login" element={currentUser ? <Navigate to="/" /> : <LoginPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              {!loading && (
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
              )}
            </ProtectedRoute>
          } />
        </Routes>
        
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] w-[90%] max-w-xs space-y-2 pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className={`p-4 rounded-2xl shadow-2xl border text-white flex items-center gap-3 animate-in slide-in-from-bottom-2 ${t.type === 'error' ? 'bg-rose-600 border-rose-500' : 'bg-slate-900 border-slate-800'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest flex-1">{t.message}</span>
            </div>
          ))}
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;
interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; }

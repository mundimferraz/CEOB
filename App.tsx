
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, MapPin, PlusCircle, Users, Menu, X, ChevronRight, FileText, Download } from 'lucide-react';
import { RepairRequest, User, Zonal, RequestStatus } from './types';
import { MOCK_REQUESTS, MOCK_USERS } from './constants';
import DashboardPage from './pages/DashboardPage';
import RequestListPage from './pages/RequestListPage';
import NewRequestPage from './pages/NewRequestPage';
import RequestDetailsPage from './pages/RequestDetailsPage';
import OrgSetupPage from './pages/OrgSetupPage';

// Simple Context for Global State
interface AppContextType {
  requests: RepairRequest[];
  users: User[];
  addRequest: (req: RepairRequest) => void;
  updateRequest: (req: RepairRequest) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/requests', label: 'Solicitações', icon: ClipboardList },
    { path: '/new', label: 'Nova Visita', icon: PlusCircle },
    { path: '/org', label: 'Organização', icon: Users },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold">S</div>
          <span className="font-bold tracking-tight">SGR-Vias</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Sidebar (Desktop) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:inset-auto
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 hidden md:block border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl text-white">S</div>
              <div>
                <h1 className="font-bold text-white tracking-tight">SGR-Vias</h1>
                <p className="text-xs text-slate-400">Setor de Engenharia</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && <ChevronRight className="ml-auto" size={16} />}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Prefeitura Municipal</p>
              <p className="text-sm font-medium text-white">Gestão Obras v1.0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
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

  useEffect(() => {
    localStorage.setItem('sgr_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('sgr_users', JSON.stringify(users));
  }, [users]);

  const addRequest = (req: RepairRequest) => setRequests(prev => [req, ...prev]);
  
  const updateRequest = (req: RepairRequest) => {
    setRequests(prev => prev.map(r => r.id === req.id ? req : r));
  };

  return (
    <AppContext.Provider value={{ requests, users, addRequest, updateRequest }}>
      <HashRouter>
        <div className="flex min-h-screen">
          <Navigation />
          <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/requests" element={<RequestListPage />} />
              <Route path="/requests/:id" element={<RequestDetailsPage />} />
              <Route path="/new" element={<NewRequestPage />} />
              <Route path="/org" element={<OrgSetupPage />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;


import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ListFilter, FileText, Zap, UploadCloud, Menu, X, Settings, Trello, LogOut, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Layout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pipeline', icon: Trello, label: 'Pipeline', highlight: true },
    { to: '/leads', icon: Users, label: 'Leads' },
    { to: '/finance', icon: DollarSign, label: 'Financeiro' },
    { to: '/prospect', icon: Zap, label: 'Sessão Foco' },
    { to: '/lists', icon: ListFilter, label: 'Listas' },
    { to: '/import', icon: UploadCloud, label: 'Importar' },
    { to: '/scripts', icon: FileText, label: 'Scripts' },
    { to: '/settings', icon: Settings, label: 'Config' },
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-dark-card border-b border-gray-800 p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          Axium
        </h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-300">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-dark-bg/95 backdrop-blur-sm pt-20 px-6 flex flex-col h-full">
          <div className="space-y-4 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-4 rounded-xl text-lg font-medium transition-colors ${
                    isActive ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-gray-800'
                  }`
                }
              >
                <item.icon size={24} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
          <div className="pb-10 pt-4 border-t border-gray-800">
             <button onClick={handleSignOut} className="flex items-center space-x-3 p-4 rounded-xl text-lg font-medium text-red-400 w-full hover:bg-gray-800">
                <LogOut size={24} />
                <span>Sair</span>
             </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-dark-card border-r border-gray-800 sticky top-0 h-screen">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Axium
          </h1>
          <p className="text-xs text-gray-500 tracking-widest uppercase mt-1">Creative CRM</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                } ${item.highlight && !isActive ? 'text-brand-400' : ''}`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
           <button onClick={handleSignOut} className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 w-full transition-colors">
              <LogOut size={20} />
              <span className="font-medium">Sair</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-card border-t border-gray-800 flex justify-around p-2 pb-safe z-30">
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-1 rounded-lg ${
                isActive ? 'text-brand-500' : 'text-gray-500'
              }`
            }
          >
            <item.icon size={20} className={item.to === '/pipeline' ? 'mb-1 text-brand-400' : ''} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

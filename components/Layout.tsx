
import React, { ReactNode } from 'react';
import { BookOpen, Heart, Info, Menu, Settings, LayoutDashboard, Lightbulb } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, onNavigate, currentPage }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavItem = ({ page, icon: Icon, label }: { page: string; icon: any; label: string }) => (
    <button
      onClick={() => {
        onNavigate(page);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-all duration-200 ${currentPage === page
          ? 'bg-pink-100 text-pink-700 font-bold shadow-sm'
          : 'text-gray-600 hover:bg-pink-50 hover:text-pink-600'
        }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="bg-pink-500 p-2 rounded-full">
            <Heart className="text-white" size={20} fill="white" />
          </div>
          <span className="font-bold text-xl text-gray-800">MamNonAI</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="text-gray-600" />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 transition duration-200 ease-in-out
        w-64 bg-white shadow-xl z-40 flex flex-col h-screen
      `}>
        <div className="p-6 flex items-center space-x-3 border-b border-gray-100">
          <div className="bg-pink-500 p-2 rounded-full shadow-lg shadow-pink-200">
            <Heart className="text-white" size={24} fill="white" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl text-gray-800 tracking-tight">MamNonAI</h1>
            <p className="text-xs text-pink-500 font-semibold">Trợ lý cô giáo</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem page="dashboard" icon={LayoutDashboard} label="Trang Chủ" />
          <NavItem page="create" icon={BookOpen} label="Soạn Giáo Án" />
          <NavItem page="skkn" icon={Lightbulb} label="Sáng kiến" />
          <NavItem page="settings" icon={Settings} label="Cài Đặt" />
          <NavItem page="about" icon={Info} label="Hướng Dẫn" />
        </nav>

        <div className="p-6 border-t border-gray-100">
          <div className="bg-indigo-50 p-4 rounded-xl">
            <p className="text-xs text-indigo-800 font-medium">
              "Trẻ em như búp trên cành<br />Biết ăn ngủ, biết học hành là ngoan"
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen scroll-smooth">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

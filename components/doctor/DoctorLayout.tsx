'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isDoctorLoggedIn, logoutDoctor, getDoctorSession } from '@/lib/doctor-auth';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  LogOut,
  Menu,
  X,
  Bell,
  Pill,
  TestTube,
  Search,
  UserPlus,
  FileEdit,
  BookOpen,
  FileText,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface DoctorLayoutProps {
  children: React.ReactNode;
}

export default function DoctorLayout({ children }: DoctorLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightMenuOpen, setRightMenuOpen] = useState(false);

  useEffect(() => {
    if (!isDoctorLoggedIn()) {
      router.push('/doctor/login');
    } else {
      setIsAuthenticated(true);
      const session = getDoctorSession();
      if (session) {
        setDoctorName(session.name);
      }
    }
  }, [router]);

  const handleLogout = () => {
    logoutDoctor();
    router.push('/doctor/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  const menuItems = [
    { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/doctor/patients', label: 'จัดการผู้ป่วย', icon: Users },
    { href: '/doctor/alerts', label: 'แจ้งเตือน', icon: Bell },
  ];

  const rightMenuItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/guidelines', label: 'แนวทางปฏิบัติ', icon: BookOpen },
    { href: '/research', label: 'งานวิจัย', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-gray-900" />
          ) : (
            <Menu className="w-6 h-6 text-gray-900" />
          )}
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1 text-center px-2">
          ระบบจัดการผู้ป่วย CML
        </h1>
        <div className="w-10 flex-shrink-0" /> {/* Spacer for centering */}
      </header>

      {/* Desktop Header Bar */}
      <header className={`hidden md:flex fixed top-0 h-16 bg-white shadow-md z-[100] items-center justify-between px-6 transition-all duration-300 ${sidebarOpen ? 'left-64 right-0' : 'left-0 right-0'}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6 text-gray-900" />
          </button>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0" />
            <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">
              ระบบจัดการผู้ป่วย CML
            </h1>
          </div>
        </div>
        <div className="flex-shrink-0 ml-4 relative">
          <button
            onClick={() => setRightMenuOpen(!rightMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-300 bg-white shadow-sm"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-900" />
          </button>
          
          {/* Right Menu Dropdown */}
          {rightMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-[99]"
                onClick={() => setRightMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-[101] py-2"
              >
                {rightMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setRightMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </motion.div>
            </>
          )}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-40 flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            Doctor Panel
          </h1>
          <p className="text-sm text-gray-600 mt-1">{doctorName}</p>
        </div>
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-green-50 text-green-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: 0 }}
          exit={{ x: -300 }}
          className="fixed inset-y-0 left-0 w-64 bg-white shadow-2xl z-50 md:hidden flex flex-col"
        >
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  Doctor Panel
                </h1>
                <p className="text-sm text-gray-600 mt-1">{doctorName}</p>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-green-50 text-green-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">ออกจากระบบ</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className={`ml-0 pt-16 md:pt-16 p-4 md:p-6 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        {children}
      </main>
    </div>
  );
}


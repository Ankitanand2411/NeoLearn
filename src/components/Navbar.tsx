import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Home, User, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';

interface NavbarProps {
  onSidebarWidthChange?: (width: number) => void;
}

const SIDEBAR_WIDTH = 260;

const Navbar = ({ onSidebarWidthChange }: NavbarProps) => {
  const { user, signOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // --- NEW: Sidebar toggle state for mobile ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Set mobile if window less than 768px
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Communicate sidebar width to parent
  useEffect(() => {
    if (onSidebarWidthChange && !isMobile && isSidebarOpen) {
      onSidebarWidthChange(SIDEBAR_WIDTH);
    } else if (onSidebarWidthChange && (!isSidebarOpen || isMobile)) {
      onSidebarWidthChange(0);
    }
  }, [onSidebarWidthChange, isMobile, isSidebarOpen]);

  // Close sidebar when navigating in mobile
  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) setIsSidebarOpen(false);
  };
  const handleToggleSidebar = () => setIsSidebarOpen((open) => !open);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully!');
      navigate('/login');
      if (isMobile) setIsSidebarOpen(false);
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const handleToggleDarkMode = () => {
    toggleDarkMode();
    if (isMobile) setIsSidebarOpen(false);
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Sidebar toggle button for mobile (top left) */}
      {isMobile && (
        <button
          aria-label={isSidebarOpen ? "Close Menu" : "Open Menu"}
          onClick={handleToggleSidebar}
          className="fixed top-4 left-4 z-[100] rounded-full p-2 bg-blue-600 text-white shadow-lg md:hidden focus:outline-none transition-all"
        >
          <span className="sr-only">{isSidebarOpen ? "Close" : "Open"} Menu</span>
          <svg
            width={28}
            height={28}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            className="block"
            viewBox="0 0 24 24"
          >
            {isSidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
            )}
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <motion.nav
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: isSidebarOpen ? 0 : -300, opacity: isSidebarOpen ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        className={`
          fixed top-0 left-0 h-full z-50 bg-[#151a38] dark:bg-gray-900/95 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-700/50
          transition-all duration-200 shadow-lg
          ${isMobile ? (isSidebarOpen ? 'block' : 'hidden') : ''}
        `}
        style={{
          minHeight: '100vh',
          width: isMobile ? (isSidebarOpen ? '65vw' : 0) : SIDEBAR_WIDTH,
          maxWidth: isMobile ? 270 : SIDEBAR_WIDTH,
        }}
      >
        {/* Brand */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`
            flex flex-row items-center
            md:flex-col md:items-start
            gap-3 mb-10 py-4 pl-6 pr-2
            border-b border-white/5
          `}
        >
          <div className="text-3xl mb-0 md:mb-1">🧠</div>
          <h1 
            className="text-xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-pulse leading-tight md:mb-0"
            style={{ lineHeight: 1.1 }}
          >
            NeoLearn
          </h1>
        </motion.div>

        {/* Navigation Items */}
        <nav className="flex-0 flex flex-col gap-1 mb-7 pl-2 pr-2 md:pl-3 md:pr-4">
          {navItems.map((item, idx) => (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>
                <Button
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center
                    pl-3 pr-2 py-2 rounded-lg
                    justify-start gap-3
                    transition-all
                    ${location.pathname === item.path 
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                      : ""}
                  `}
                >
                  <item.icon size={20} className="min-w-[20px]" />
                  <span className="hidden md:inline text-base">{item.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {/* Logout at same spacing level as toggles */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="
                  w-full flex items-center
                  pl-3 pr-2 py-2 rounded-lg
                  justify-start gap-3
                  transition-all
                  text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500
                  font-semibold
                "
                aria-label="Logout"
              >
                <LogOut size={20} className="min-w-[20px]" />
                <span className="hidden md:inline text-base">Logout</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        </nav>
        {/* Spacer */}
        <div className="flex-1" />

        {/* (No user info block here anymore) */}
      </motion.nav>
    </>
  );
};

export default Navbar;

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  LayoutGrid, 
  Settings, 
  LogOut, 
  Moon, 
  Sun, 
  Laptop,
  Plus,
  Menu,
  X
} from "lucide-react";
import * as motion from "motion/react-client";
import { AnimatePresence } from "motion/react";

const SidebarItem = ({ 
  icon: Icon, 
  href, 
  isActive, 
  onClick 
}: { 
  icon: any, 
  href?: string, 
  isActive?: boolean, 
  onClick?: () => void 
}) => {
  const Content = (
    <div 
      className={`
        w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer
        ${isActive 
          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-lg scale-105" 
          : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
        }
      `}
    >
      <Icon className="w-5 h-5" />
    </div>
  );

  if (href) {
    return <Link href={href} onClick={onClick}>{Content}</Link>;
  }

  return <button onClick={onClick}>{Content}</button>;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("system");
    else setTheme("dark");
  };

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 transition-colors duration-300 font-sans">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-6 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/80 backdrop-blur-xl z-50">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/dashboard" className="block hover:scale-110 transition-transform duration-300">
             <div className="w-10 h-10 bg-neutral-900 dark:bg-white rounded-full flex items-center justify-center shadow-sm">
               <div className="w-3 h-3 bg-white dark:bg-neutral-950 rounded-full" />
             </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-3 w-full items-center">
          <SidebarItem icon={LayoutGrid} href="/dashboard" isActive={pathname === "/dashboard"} />
          <SidebarItem icon={Plus} onClick={() => {}} /> 
          <SidebarItem icon={Settings} href="/dashboard/settings" isActive={pathname === "/dashboard/settings"} />
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-3 mt-auto w-full items-center pb-4">
          <SidebarItem 
            icon={theme === 'dark' ? Moon : theme === 'light' ? Sun : Laptop} 
            onClick={toggleTheme} 
          />
          <form action="/auth/signout" method="post">
             <button type="submit" className="hidden" id="signout-btn-desktop"></button>
             <label htmlFor="signout-btn-desktop" className="cursor-pointer group">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-500/10 transition-all duration-300">
                   <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </div>
             </label>
          </form>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full h-16 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-950/90 backdrop-blur-xl z-50 flex items-center justify-between px-4">
          <Link href="/dashboard">
             <div className="w-8 h-8 bg-neutral-900 dark:bg-white rounded-full flex items-center justify-center">
               <div className="w-2 h-2 bg-white dark:bg-neutral-950 rounded-full" />
             </div>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-16 bg-neutral-50 dark:bg-neutral-950 z-40 md:hidden flex flex-col p-4 gap-4 overflow-y-auto"
          >
            <div className="grid grid-cols-2 gap-4">
                <Link href="/dashboard" className="flex flex-col items-center justify-center gap-2 p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <LayoutGrid className="w-6 h-6" />
                    <span className="font-medium">Home</span>
                </Link>
                <div className="flex flex-col items-center justify-center gap-2 p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm cursor-pointer">
                    <Plus className="w-6 h-6" />
                    <span className="font-medium">Add New</span>
                </div>
                <Link href="/dashboard/settings" className="flex flex-col items-center justify-center gap-2 p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <Settings className="w-6 h-6" />
                    <span className="font-medium">Settings</span>
                </Link>
                 <div className="flex flex-col items-center justify-center gap-2 p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm cursor-pointer" onClick={toggleTheme}>
                    {theme === 'dark' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                    <span className="font-medium">{theme === 'dark' ? 'Dark' : 'Light'}</span>
                </div>
            </div>

            <form action="/auth/signout" method="post" className="mt-auto">
                <button type="submit" className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 text-red-600 rounded-2xl font-bold hover:bg-red-500/20 transition-colors">
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:pl-20 pt-16 md:pt-0 w-full min-h-screen">
        <div className="max-w-[1800px] mx-auto h-full">
            {children}
        </div>
      </main>

    </div>
  );
}
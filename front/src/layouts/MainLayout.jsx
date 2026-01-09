import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import AuroraBackground from '@/components/Aurora';
import StarField from '@/components/StarField';

const MainLayout = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  return (
    <div className="relative min-h-screen w-full font-sans selection:bg-cyan-500/30 overflow-hidden">
      
      <div className="fixed inset-0 -z-10 bg-[#0b1021]">
        <AuroraBackground />
        <StarField />
      </div>

      { !isLoginPage &&  <Navbar />}

      <div className={`
        relative z-10 h-full overflow-y-auto transition-all duration-300
        ${isLoginPage 
          ? 'h-screen w-full flex items-center justify-center p-0'
          : 'pt-28 px-6'
        }
      `}>
        <Outlet />
      </div>

    </div>
  );
};

export default MainLayout;
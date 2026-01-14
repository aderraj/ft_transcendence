import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AuroraBackground from '@/components/background/Aurora';
import StarField from '@/components/background/StarField';
import TopBar from '@/components/TopBar';
import SideBar from '@/components/SideBar';

const MainLayout = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  return (
    <div className="relative min-h-screen w-full font-sans selection:bg-cyan-500/30 overflow-hidden text-white">
      
      <div className="fixed inset-0 -z-10 bg-[#0b1021]">
        <AuroraBackground />
        <StarField />
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      </div>

      { isLoginPage ? (
        <div className='h-screen w-full flex items-center justify-center'>
          <Outlet/>
        </div>
      ) : (
        <div className='flex h-screen overflow-hidden'>
            <SideBar />
            
            <main className='flex-1 flex flex-col relative pl-24 h-full overflow-hidden'>
                <TopBar/>
                <div className='flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide'>
                  <Outlet/>
                </div>
            </main>
        </div>
      )
      }
    </div>
  );
};

export default MainLayout;
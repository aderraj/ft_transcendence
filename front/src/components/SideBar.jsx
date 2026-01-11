import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Gamepad2, MessageSquare, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const SideBar = () => {
    const location = useLocation();
    const navigate  = useNavigate();
    const { logout } = useAuth();

    const isActive = (path) => location.pathname === path;

    const NavItem = ( { path, icon: Icon, label } ) => {
        const active = isActive(path);

        return (
            <button
                onClick={ () => navigate(path)}
                className={`relative group flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300
                ${active ?
                    'text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }
                `}
            >
                <div className={`
                    absolute -right-6 top-1/2 -translate-y-1/2 w-1 h-8 rounded-l-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] transition-all duration-300
                    ${active ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}
                    `}
                />

                <Icon className="w-6 h-6" />

                <span className="absolute left-16 px-2 py-1 rounded bg-black/90 border border-white/10 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {label}
                </span>
            </button>
        );
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-24 flex flex-col items-center py-8 z-50 bg-[#0bc1021]/60 backdrop-blur-xl border-r border-white/5">
            <div className="mb-8">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <span className="font-bold text-white text-xl">N</span>
                </div>
            </div>

            <nav className="flex-1 flex justify-center flex-col gap-8 w-full items-center">
                <NavItem path="/" icon={LayoutDashboard} label="Dashboard" />
                <NavItem path="/game" icon={Gamepad2} label="Game" />
                <NavItem path="/chat" icon={MessageSquare} label="Chat" />
                <NavItem path="/profile" icon={User} label="Profile" />
            </nav>

            <div className="mt-auto w-full flex justify-center">
                <button
                    onClick={logout}
                    className="group relative flex items-center justify-center w-12 h-12 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
                >
                    <LogOut className="w-6 h-6"/>
                    <span className="absolute left-16 px-2 py-1 rounded bg-red-950/90 border border-red-500/20 text-xs text-red-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        Disconnect
                    </span>
                </button>
            </div>
        </aside>
    );
};

export default SideBar;
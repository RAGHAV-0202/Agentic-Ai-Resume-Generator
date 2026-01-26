import React from 'react';
import { LayoutDashboard, Settings, FileText } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: FileText, label: 'Templates', path: '/templates' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <React.Fragment>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar Content */}
            <aside className={`
                fixed md:sticky top-[64px] left-0 h-[calc(100vh-64px)] w-64 bg-white border-r border-slate-200 
                flex flex-col transition-transform duration-300 ease-in-out z-40
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6">
                    <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">Main Menu</h2>
                    <div className="space-y-2">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    to={item.path}
                                    key={item.label}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group font-medium text-sm
                                        ${isActive
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                        }`}
                                >
                                    <item.icon size={20} className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>

                <div className="mt-auto p-6 border-t border-slate-100">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
                        <p className="text-xs font-medium text-blue-100 mb-1">Pro Plan</p>
                        <h4 className="text-sm font-bold mb-3">Upgrade to Premium</h4>
                        <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold transition-colors">
                            View Plans
                        </button>
                    </div>
                </div>
            </aside>
        </React.Fragment>
    )
}

export default Sidebar;

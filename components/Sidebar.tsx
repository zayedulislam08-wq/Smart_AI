import React from 'react';
import { SERVICES, ServiceId } from '../constants';
import { HomeIcon, WorkflowIcon, SettingsIcon } from './icons/Icons';
import type { View } from '../App';

interface SidebarProps {
    currentView: View;
    onNavigate: (view: View) => void;
    className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, className = '' }) => {
    const NavItem: React.FC<{
        view: View;
        icon: React.ReactNode;
        label: string;
    }> = ({ view, icon, label }) => {
        const isActive = currentView === view;
        return (
            <button
                onClick={() => onNavigate(view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
            >
                <span className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : ''}`}>
                    {icon}
                </span>
                <span className="truncate">{label}</span>
            </button>
        );
    };

    return (
        <div className={`w-60 h-full bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-white/5 flex flex-col ${className}`}>
            {/* Logo */}
            <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-3 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
                    <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                </div>
                <div>
                    <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Gemini AI</h1>
                    <p className="text-[10px] text-gray-400">Showcase Platform</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest px-3 py-2">Navigation</p>
                <NavItem view="home" icon={<HomeIcon className="w-4 h-4" />} label="Home" />
                <NavItem view="workflow" icon={<WorkflowIcon className="w-4 h-4" />} label="Workflow Builder" />

                <div className="my-3 border-t border-gray-100 dark:border-white/5" />

                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest px-3 py-2">AI Services</p>
                {SERVICES.map((service) => (
                    <button
                        key={service.id}
                        onClick={() => onNavigate('service')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-150 group"
                    >
                        <service.Icon className="w-3.5 h-3.5 shrink-0 text-blue-400 group-hover:scale-110 transition-transform" />
                        <span className="truncate">{service.name}</span>
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 dark:border-white/5 shrink-0">
                <NavItem view="settings" icon={<SettingsIcon className="w-4 h-4" />} label="Settings" />
            </div>
        </div>
    );
};

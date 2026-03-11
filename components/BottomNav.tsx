import React from 'react';
import type { View } from '../App';
import { HomeIcon, WorkflowIcon, SettingsIcon } from './icons/Icons';

interface BottomNavProps {
    currentView: View;
    onNavigate: (view: View) => void;
    className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate, className = '' }) => {
    const NavItem = ({ view, icon, label }: { view: View; icon: React.ReactNode; label: string }) => {
        // Highlighting 'home' if we are currently looking at a service
        const isActive = currentView === view || (currentView === 'service' && view === 'home');
        return (
            <button
                onClick={() => onNavigate(view)}
                className={`flex flex-col items-center justify-center w-full py-2 space-y-1 transition-colors ${
                    isActive
                        ? 'text-cyan-600 dark:text-cyan-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
                <div className={`p-1.5 rounded-full ${isActive ? 'bg-cyan-100 dark:bg-cyan-900/30' : 'bg-transparent'}`}>
                    {icon}
                </div>
                <span className="text-[10px] font-medium">{label}</span>
            </button>
        );
    };

    return (
        <nav className={`bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe ${className}`}>
            <div className="flex justify-around items-center h-16 px-2">
                <NavItem view="home" icon={<HomeIcon className="w-6 h-6" />} label="Home" />
                <NavItem view="workflow" icon={<WorkflowIcon className="w-6 h-6" />} label="Workflows" />
                <NavItem view="settings" icon={<SettingsIcon className="w-6 h-6" />} label="Settings" />
            </div>
        </nav>
    );
};

import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { HomeIcon, WorkflowIcon, BotIcon } from './icons/Icons';
import type { View } from '../App';

interface HeaderProps {
    currentView: View;
    onNavigate: (view: View) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
    const NavButton: React.FC<{
        view: View,
        icon: React.ReactNode,
        label: string
    }> = ({ view, icon, label }) => {
        const isActive = currentView === view;
        return (
            <button
                onClick={() => onNavigate(view)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                        ? 'bg-cyan-600 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
            >
                {icon}
                {label}
            </button>
        );
    };

    return (
        <header className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-20 shadow-md dark:shadow-lg">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-3">
                        <BotIcon className="w-8 h-8 text-cyan-500" />
                        <h1 className="text-xl font-bold tracking-tight text-gray-800 dark:text-white">Smart AI Service</h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <nav className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg">
                            <NavButton view="home" icon={<HomeIcon className="w-5 h-5" />} label="Home" />
                            <NavButton view="workflow" icon={<WorkflowIcon className="w-5 h-5" />} label="Workflow" />
                        </nav>
                        <ThemeToggle />
                    </div>
                </div>
                <nav className="sm:hidden flex items-center gap-2 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg mb-4">
                    <NavButton view="home" icon={<HomeIcon className="w-5 h-5" />} label="Home" />
                    <NavButton view="workflow" icon={<WorkflowIcon className="w-5 h-5" />} label="Workflow" />
                </nav>
            </div>
        </header>
    );
};
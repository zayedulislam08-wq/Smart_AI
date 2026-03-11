import React, { useState, useMemo } from 'react';
import { SERVICES, ServiceId } from './constants';
import { HomePage } from './components/HomePage';
import { WorkflowBuilder } from './components/WorkflowBuilder';
import { Header } from './components/Header';
import { Settings } from './components/Settings';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { FloatingChat } from './components/FloatingChat';
import { FloatingAudio } from './components/FloatingAudio';
import { FloatingTools } from './components/FloatingTools';


export type View = 'home' | 'workflow' | 'service' | 'settings';

const App: React.FC = () => {
    const [view, setView] = useState<View>('home');
    const [currentServiceId, setCurrentServiceId] = useState<ServiceId | null>(null);

    const handleSelectService = (serviceId: ServiceId) => {
        setCurrentServiceId(serviceId);
        setView('service');
    };

    const navigate = (newView: View) => {
        setView(newView);
        if (newView !== 'service') {
            setCurrentServiceId(null);
        }
    }

    const CurrentComponent = useMemo(() => {
        if (view === 'home') {
            return <HomePage onSelectService={handleSelectService} />;
        }
        if (view === 'workflow') {
            return <WorkflowBuilder />;
        }
        if (view === 'settings') {
            return <Settings />;
        }
        if (view === 'service' && currentServiceId) {
            const service = SERVICES.find(s => s.id === currentServiceId);
            return service ? <service.Component /> : <HomePage onSelectService={handleSelectService} />;
        }
        return <HomePage onSelectService={handleSelectService} />;
    }, [view, currentServiceId]);
    
    return (
        <div className="flex h-[100dvh] bg-gray-50 dark:bg-black font-sans overflow-hidden">
            {/* Desktop Sidebar */}
            <Sidebar currentView={view} onNavigate={navigate} className="hidden md:flex flex-shrink-0" />

            <div className="flex flex-col flex-1 min-w-0 h-full relative">
                {/* Mobile Top Header */}
                <Header currentView={view} onNavigate={navigate} />
                
                {/* Scrollable Main Area */}
                <main className="flex-1 overflow-y-auto w-full h-full relative scroll-smooth focus:outline-none bg-white dark:bg-[#050505] md:bg-gray-50 md:dark:bg-[#0a0a0a] md:rounded-tl-2xl border-t border-l border-transparent md:border-gray-200 md:dark:border-white/5 shadow-inner">
                    <div key={view + (currentServiceId || '')} className="h-full w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-300">
                        {CurrentComponent}
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <BottomNav 
                    currentView={view} 
                    onNavigate={navigate} 
                    className="md:hidden mt-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)] z-40" 
                />
            </div>
            
            {/* Global Floating AI Assistants */}
            <FloatingChat />
            <FloatingAudio />
            <FloatingTools onLaunchService={handleSelectService} />
        </div>
    );
};

export default App;
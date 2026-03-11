import React from 'react';
import type { Service } from '../types';

interface ServiceCardProps {
    service: Service;
    onClick: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onClick }) => {
    return (
        <button 
            onClick={onClick}
            className="group relative text-left w-full focus:outline-none"
        >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 dark:from-cyan-500/10 dark:to-blue-600/10 rounded-2xl blur-xl transition-all duration-300 group-hover:-inset-1 group-hover:blur-2xl opacity-70 group-hover:opacity-100"></div>
            
            {/* Main Content Area */}
            <div className="relative h-full p-6 md:p-8 rounded-2xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-white/50 dark:border-gray-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 group-hover:bg-white/90 dark:group-hover:bg-gray-900/90 group-hover:-translate-y-1">
                <div className="flex flex-col h-full">
                    <div className="mb-5 flex justify-between items-start">
                        <div className="p-3.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 text-white transform group-hover:scale-110 transition-transform duration-300">
                            <service.Icon className="w-7 h-7" />
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </div>
                    </div>
                    
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 leading-tight">
                        {service.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow leading-relaxed">
                        {service.description}
                    </p>
                </div>
            </div>
        </button>
    );
};
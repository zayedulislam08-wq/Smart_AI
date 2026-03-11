import React from 'react';
import { SERVICES, ServiceId } from '../constants';
import { ServiceCard } from './ServiceCard';

interface HomePageProps {
    onSelectService: (serviceId: ServiceId) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectService }) => {
    return (
        <div className="pb-8 animate-fade-in">
            <div className="mb-10 mt-4 md:mt-8">
                <div className="inline-block px-3 py-1 mb-4 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs font-semibold tracking-wider uppercase">
                    AI Toolkit
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                    Explore Smart Services
                </h1>
                <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
                    Leverage the power of Google's Gemini AI to perform a wide range of tasks, from creative generation to complex problem-solving.
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
                {SERVICES.map((service, index) => (
                    <div 
                        key={service.id} 
                        className="animate-slide-up"
                        style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                    >
                        <ServiceCard 
                            service={service}
                            onClick={() => onSelectService(service.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
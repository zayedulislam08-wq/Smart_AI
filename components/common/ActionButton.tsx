import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
    children,
    isLoading = false,
    icon,
    className,
    ...props
}) => {
    return (
        <button
            className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200 ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <>
                    {icon && <span className="mr-2 -ml-1">{icon}</span>}
                    {children}
                </>
            )}
        </button>
    );
};
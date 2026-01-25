import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    to,
    onClick,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none rounded-lg";

    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20",
        secondary: "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 focus:ring-slate-500 shadow-sm",
        ghost: "bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white focus:ring-slate-500",
        outline: "bg-transparent border border-blue-500/50 text-blue-400 hover:bg-blue-950 focus:ring-blue-500",
    };

    const sizes = {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 py-2 text-sm",
        lg: "h-12 px-6 text-base",
    };

    const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    if (to) {
        return (
            <Link to={to} className={combinedClassName} {...props}>
                {children}
            </Link>
        );
    }

    return (
        <button className={combinedClassName} onClick={onClick} {...props}>
            {children}
        </button>
    );
};

export default Button;

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  const baseClasses = 'bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden relative backdrop-blur-sm';
  const hoverClasses = hover 
    ? 'hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-500 hover:-translate-y-2 hover:border-blue-300 group' 
    : '';
  
  if (hover) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className={`${baseClasses} ${hoverClasses} ${className}`}
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500 pointer-events-none"></div>
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    );
  }
  
  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`px-8 py-6 border-b border-gray-100/80 bg-gradient-to-br from-gray-50/50 via-white to-gray-50/30 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: CardProps) {
  return (
    <h3 className={`text-2xl font-extrabold text-gray-900 tracking-tight ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }: CardProps) {
  return (
    <p className={`text-base text-gray-600 mt-3 leading-relaxed ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }: CardProps) {
  return (
    <div className={`px-8 py-6 ${className}`}>
      {children}
    </div>
  );
}

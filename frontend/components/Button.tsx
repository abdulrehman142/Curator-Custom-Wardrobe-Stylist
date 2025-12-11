'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

export default function Button({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseClasses = 'rounded-md border-2 transition-all duration-smooth px-3 py-2 md:px-4 md:py-3 font-medium dark:bg-black dark:text-white';
  
  const variantClasses = {
    primary: 'btn-primary dark:border-white',
    secondary: 'btn-secondary dark:border-white',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}


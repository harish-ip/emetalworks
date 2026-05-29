import React from 'react';
import { motion } from 'framer-motion';

const buttonVariants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-medium hover:shadow-hard',
  secondary: 'bg-steel-100 hover:bg-steel-200 text-steel-800 border border-steel-300',
  accent: 'bg-accent-500 hover:bg-accent-600 text-white shadow-medium hover:shadow-hard',
  outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white',
  ghost: 'text-steel-600 hover:bg-steel-100 hover:text-steel-900',
  danger: 'bg-danger-600 hover:bg-danger-700 text-white shadow-medium hover:shadow-hard',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg',
  xl: 'px-6 sm:px-8 py-3 sm:py-4 text-lg sm:text-xl',
};

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  animate = true,
  href,
  ...props
}, ref) => {
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-xl
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    transform hover:scale-[1.02] active:scale-[0.98]
    ${fullWidth ? 'w-full' : ''}
    ${buttonVariants[variant]}
    ${buttonSizes[size]}
    ${className}
  `;

  const content = (
    <>
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2">{icon}</span>
      )}
    </>
  );

  // If href is provided, render as a link
  if (href) {
    if (animate) {
      return (
        <motion.a
          ref={ref}
          href={href}
          className={baseClasses}
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          {...props}
        >
          {content}
        </motion.a>
      );
    }

    return (
      <a
        ref={ref}
        href={href}
        className={baseClasses}
        {...props}
      >
        {content}
      </a>
    );
  }

  if (animate) {
    return (
      <motion.button
        ref={ref}
        className={baseClasses}
        disabled={disabled || loading}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...props}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <button
      ref={ref}
      className={baseClasses}
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </button>
  );
});

Button.displayName = 'Button';
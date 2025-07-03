import React from 'react';
import { motion } from 'framer-motion';

const cardVariants = {
  default: 'bg-white border border-steel-200 shadow-soft hover:shadow-medium',
  elevated: 'bg-white shadow-medium hover:shadow-hard',
  outlined: 'bg-white border-2 border-steel-300 hover:border-primary-300',
  filled: 'bg-steel-50 border border-steel-200 hover:bg-steel-100',
  glass: 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-soft',
};

export const Card = React.forwardRef(({
  children,
  variant = 'default',
  className = '',
  hover = true,
  animate = true,
  padding = true,
  ...props
}, ref) => {
  const baseClasses = `
    rounded-2xl transition-all duration-300 ease-in-out
    ${hover ? 'hover:scale-[1.02] cursor-pointer' : ''}
    ${cardVariants[variant]}
    ${className}
  `;

  if (animate) {
    return (
      <motion.div
        ref={ref}
        className={baseClasses}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={hover ? { scale: 1.02, y: -2 } : {}}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        {...props}
      >
        <div className={padding ? 'p-6' : ''}>
          {children}
        </div>
      </motion.div>
    );
  }

  return (
    <div ref={ref} className={baseClasses} {...props}>
      <div className={padding ? 'p-6' : ''}>
        {children}
      </div>
    </div>
  );
});

Card.displayName = 'Card';

export const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardContent = ({ children, className = '', ...props }) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`mt-4 pt-4 border-t border-steel-200 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-xl font-bold text-steel-900 mb-2 ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-steel-600 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);
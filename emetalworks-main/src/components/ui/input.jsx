import React from 'react';
import { motion } from 'framer-motion';

const inputVariants = {
  default: 'border-steel-300 focus:border-primary-500 focus:ring-primary-500',
  error: 'border-danger-300 focus:border-danger-500 focus:ring-danger-500',
  success: 'border-success-300 focus:border-success-500 focus:ring-success-500',
  warning: 'border-warning-300 focus:border-warning-500 focus:ring-warning-500',
};

const inputSizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg',
};

export const Input = React.forwardRef(({
  type = 'text',
  variant = 'default',
  size = 'md',
  className = '',
  error,
  success,
  warning,
  label,
  placeholder,
  icon,
  iconPosition = 'left',
  animate = true,
  fullWidth = true,
  ...props
}, ref) => {
  const currentVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant;
  
  const baseClasses = `
    w-full rounded-xl border bg-white
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:opacity-50 disabled:cursor-not-allowed
    placeholder:text-steel-400
    ${inputVariants[currentVariant]}
    ${inputSizes[size]}
    ${icon ? (iconPosition === 'left' ? 'pl-12' : 'pr-12') : ''}
    ${!fullWidth ? 'w-auto' : ''}
    ${className}
  `;

  const inputElement = (
    <div className="relative">
      {icon && iconPosition === 'left' && (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-steel-400">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        type={type}
        className={baseClasses}
        placeholder={placeholder}
        {...props}
      />
      {icon && iconPosition === 'right' && (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-steel-400">
          {icon}
        </div>
      )}
    </div>
  );

  if (label) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-steel-700">
          {label}
        </label>
        {animate ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {inputElement}
          </motion.div>
        ) : (
          inputElement
        )}
        {error && (
          <p className="text-sm text-danger-600">{error}</p>
        )}
        {success && (
          <p className="text-sm text-success-600">{success}</p>
        )}
        {warning && (
          <p className="text-sm text-warning-600">{warning}</p>
        )}
      </div>
    );
  }

  return animate ? (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {inputElement}
      {error && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
      {success && (
        <p className="mt-1 text-sm text-success-600">{success}</p>
      )}
      {warning && (
        <p className="mt-1 text-sm text-warning-600">{warning}</p>
      )}
    </motion.div>
  ) : (
    <div>
      {inputElement}
      {error && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
      {success && (
        <p className="mt-1 text-sm text-success-600">{success}</p>
      )}
      {warning && (
        <p className="mt-1 text-sm text-warning-600">{warning}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export const Textarea = React.forwardRef(({
  variant = 'default',
  className = '',
  error,
  success,
  warning,
  label,
  rows = 4,
  animate = true,
  ...props
}, ref) => {
  const currentVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant;
  
  const baseClasses = `
    w-full rounded-xl border bg-white px-4 py-3
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:opacity-50 disabled:cursor-not-allowed
    placeholder:text-steel-400 resize-none
    ${inputVariants[currentVariant]}
    ${className}
  `;

  const textareaElement = (
    <textarea
      ref={ref}
      rows={rows}
      className={baseClasses}
      {...props}
    />
  );

  if (label) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-steel-700">
          {label}
        </label>
        {animate ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {textareaElement}
          </motion.div>
        ) : (
          textareaElement
        )}
        {error && (
          <p className="text-sm text-danger-600">{error}</p>
        )}
        {success && (
          <p className="text-sm text-success-600">{success}</p>
        )}
        {warning && (
          <p className="text-sm text-warning-600">{warning}</p>
        )}
      </div>
    );
  }

  return animate ? (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {textareaElement}
      {error && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
      {success && (
        <p className="mt-1 text-sm text-success-600">{success}</p>
      )}
      {warning && (
        <p className="mt-1 text-sm text-warning-600">{warning}</p>
      )}
    </motion.div>
  ) : (
    <div>
      {textareaElement}
      {error && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
      {success && (
        <p className="mt-1 text-sm text-success-600">{success}</p>
      )}
      {warning && (
        <p className="mt-1 text-sm text-warning-600">{warning}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

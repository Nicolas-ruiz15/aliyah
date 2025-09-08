import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Eye, EyeOff } from 'lucide-react';

const inputVariants = cva(
  'flex w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-gray-200 focus-visible:ring-tekhelet-500',
        error: 'border-red-300 focus-visible:ring-red-500 bg-red-50/50',
        success: 'border-green-300 focus-visible:ring-green-500 bg-green-50/50',
        orthodox: 'border-tekhelet-200 focus-visible:ring-tekhelet-600 bg-gradient-to-r from-white to-blue-50/30',
      },
      inputSize: { // ✅ Cambiado de 'size' a 'inputSize' para evitar conflicto
        default: 'h-12',
        sm: 'h-9 px-3 py-2 text-xs',
        lg: 'h-14 px-6 py-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, // ✅ Excluir 'size' del HTMLAttributes
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    variant, 
    inputSize, // ✅ Usar inputSize en lugar de size
    label,
    error,
    success,
    leftIcon,
    rightIcon,
    showPasswordToggle = false,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [inputType, setInputType] = React.useState(type);

    React.useEffect(() => {
      if (showPasswordToggle && type === 'password') {
        setInputType(showPassword ? 'text' : 'password');
      }
    }, [showPassword, showPasswordToggle, type]);

    const finalVariant = error ? 'error' : success ? 'success' : variant;

    const inputElement = (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {leftIcon}
          </div>
        )}
        
        <input
          type={inputType}
          className={cn(
            inputVariants({ variant: finalVariant, inputSize, className }), // ✅ Usar inputSize
            leftIcon && 'pl-10',
            (rightIcon || showPasswordToggle) && 'pr-10'
          )}
          ref={ref}
          {...props}
        />

        {(rightIcon || showPasswordToggle) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {showPasswordToggle && type === 'password' ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            ) : (
              rightIcon && <span className="text-gray-500">{rightIcon}</span>
            )}
          </div>
        )}
      </div>
    );

    if (label || error || success) {
      return (
        <div className="space-y-2">
          {label && (
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          {inputElement}
          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-600 font-medium">{success}</p>
          )}
        </div>
      );
    }

    return inputElement;
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
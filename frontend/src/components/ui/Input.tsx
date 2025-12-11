import React, { useState, forwardRef } from "react";
import { cn } from "../../utils/cn";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, required, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value);
    const [showPassword, setShowPassword] = useState(false);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    const labelActive = isFocused || hasValue;

    return (
      <div className="relative mb-4">
        <div className="relative">
          <input
            type={type === "password" ? (showPassword ? "text" : "password") : type}
            className={cn(
              "peer w-full rounded-lg border px-4 pt-6 pb-2 text-sm outline-none transition-all",
              "placeholder:text-transparent focus:ring-2",
              labelActive
                ? "border-brand-orange"
                : "border-gray-300 dark:border-gray-600",
              error
                ? "border-brand-red focus:border-brand-red focus:ring-brand-red/20"
                : "focus:border-brand-orange focus:ring-brand-orange/20",
              "bg-brand-light dark:bg-brand-dark-light",
              "text-gray-900 dark:text-gray-100",
              className
            )}
            placeholder={label}
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />
          <label
            className={cn(
              "absolute left-4 top-4 z-10 origin-[0] transform text-sm transition-all duration-200 pointer-events-none",
              labelActive
                ? "-translate-y-2 scale-75 text-brand-orange"
                : "text-gray-500 dark:text-gray-400",
              error && labelActive && "text-brand-red"
            )}
          >
            {label}
            {required && <span className="text-brand-red ml-1">*</span>}
          </label>

          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          )}
        </div>
        {error && (
          <div className="mt-1 flex items-center text-xs text-brand-red">
            <AlertCircle size={12} className="mr-1" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;

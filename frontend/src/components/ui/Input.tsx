import React, { useState, useEffect, forwardRef } from "react";
import { cn } from "../../utils/cn";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, required, value, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!value);
    const [showPassword, setShowPassword] = useState(false);

    // ✅ Sync label state with controlled values
    useEffect(() => {
      setHasValue(!!value);
    }, [value]);

    const labelActive = isFocused || hasValue;

    return (
      <div className="relative mb-4">
        <div className="relative">
          <input
            ref={ref}
            type={
              type === "password" ? (showPassword ? "text" : "password") : type
            }
            value={value}
            className={cn(
              "peer w-full rounded-xl border px-4 pt-7 pb-2 text-sm transition-all outline-none",
              "placeholder:text-transparent",
              "focus:ring-2 focus:ring-brand-orange/20",
              labelActive
                ? "border-brand-orange"
                : "border-gray-300 dark:border-gray-600",
              error &&
                "border-brand-red focus:border-brand-red focus:ring-brand-red/20",
              "bg-white dark:bg-brand-dark-lighter",
              "text-gray-900 dark:text-gray-100",
              "disabled:bg-gray-50 disabled:text-gray-700 disabled:cursor-not-allowed",
              "dark:disabled:bg-brand-dark dark:disabled:text-gray-300",
              className
            )}
            placeholder={label}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            onChange={(e) => {
              setHasValue(!!e.target.value);
              props.onChange?.(e);
            }}
            {...props}
          />

          {/* Floating Label */}
          <label
            className={cn(
              "absolute left-4 top-2.5 z-10 origin-left select-none text-xs font-medium transition-all duration-200 pointer-events-none",
              labelActive
                ? "text-brand-orange"
                : "text-gray-500 dark:text-gray-400",
              error && labelActive && "text-brand-red"
            )}
          >
            {label}
            {required && <span className="ml-1 text-brand-red">*</span>}
          </label>

          {/* Password Toggle */}
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-1 flex items-center text-xs text-brand-red">
            <AlertCircle size={12} className="mr-1" />
            {error}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;

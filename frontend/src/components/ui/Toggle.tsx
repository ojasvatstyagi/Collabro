import React from "react";
import { Moon, Sun } from "lucide-react";

type ToggleProps = {
  enabled: boolean;
  setEnabled: React.Dispatch<React.SetStateAction<boolean>>;
};

const Toggle: React.FC<ToggleProps> = ({ enabled, setEnabled }) => (
  <button
    onClick={() => setEnabled(!enabled)}
    className={`relative flex h-8 w-14 items-center rounded-full bg-brand-light p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 ${
      enabled ? "bg-brand-yellow" : "bg-brand-light dark:bg-brand-dark"
    }`}
    aria-pressed={enabled}
    type="button"
  >
    <span
      className={`flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ${
        enabled ? "translate-x-6" : "translate-x-0"
      }`}
    >
      <span className="sr-only">Toggle theme</span>
      {enabled ? (
        <Moon className="h-4 w-4 text-brand-orange" />
      ) : (
        <Sun className="h-4 w-4 text-brand-orange" />
      )}
    </span>
  </button>
);

export default Toggle;

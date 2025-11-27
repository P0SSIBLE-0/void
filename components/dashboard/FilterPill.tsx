import React from "react";

type FilterPillProps = {
  icon: any;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
};

export const FilterPill = ({ icon: Icon, label, isActive, onClick }: FilterPillProps) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap select-none
      ${isActive 
        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-sm" 
        : "bg-white dark:bg-neutral-900 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800"
      }
    `}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

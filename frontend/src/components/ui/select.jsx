import React from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";

const Select = React.forwardRef(
  ({ className, children, onChange, value, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 input-gradient text-foreground",
            className
          )}
          ref={ref}
          onChange={onChange}
          value={value}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50" />
      </div>
    );
  }
);
Select.displayName = "Select";

const SelectOption = React.forwardRef(
  ({ className, children, value, ...props }, ref) => {
    return (
      <option
        className={cn("relative cursor-default select-none py-1.5 pl-8 pr-2 bg-background text-foreground", className)}
        ref={ref}
        value={value}
        {...props}
      >
        {children}
      </option>
    );
  }
);
SelectOption.displayName = "SelectOption";

export { Select, SelectOption };
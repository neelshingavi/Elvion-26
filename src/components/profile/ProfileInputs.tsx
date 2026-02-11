"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputFieldProps {
    label: string;
    icon?: LucideIcon;
    value: string | number;
    onChange: (val: string) => void;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    maxLength?: number;
}

export function ProfileInput({
    label,
    icon: Icon,
    value,
    onChange,
    type = "text",
    placeholder,
    disabled,
    className,
    maxLength
}: InputFieldProps) {
    return (
        <div className={cn("space-y-1.5 flex-1 min-w-[200px]", className)}>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-subtle pl-1">{label}</label>
            <div className="relative group">
                {Icon && (
                    <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle group-focus-within:text-primary transition-colors" />
                )}
                <input
                    type={type}
                    value={value ?? ""}
                    disabled={disabled}
                    maxLength={maxLength}
                    onChange={(e) => onChange(e.target.value)}
                    className={cn(
                        "input transition-all",
                        Icon && "pl-11",
                        disabled && "bg-surface-alt text-subtle border-transparent cursor-not-allowed"
                    )}
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
}

interface TextAreaFieldProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
    maxLength?: number;
}

export function ProfileTextArea({
    label,
    value,
    onChange,
    placeholder,
    rows = 4,
    className,
    maxLength
}: TextAreaFieldProps) {
    return (
        <div className={cn("space-y-1.5", className)}>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-subtle pl-1">{label}</label>
            <textarea
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                maxLength={maxLength}
                className="input min-h-[100px] resize-none py-3 leading-relaxed"
                placeholder={placeholder}
            />
            {maxLength && (
                <div className="text-[10px] text-right text-subtle mt-1 font-bold">
                    {(value?.length || 0)} / {maxLength}
                </div>
            )}
        </div>
    );
}

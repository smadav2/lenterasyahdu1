"use client";

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Printer } from "lucide-react";

export function SubmitButton({
  children,
  className,
  pendingText = "Memproses...",
  confirmText,
  name,
  value,
}: {
  children: ReactNode;
  className?: string;
  pendingText?: string;
  confirmText?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}

export function PrintButton({ className, label = "Cetak" }: { className?: string; label?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}

export function PasswordInput({
  name,
  className,
  placeholder,
  required,
  minLength,
  autoComplete,
}: {
  name: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        name={name}
        className={className}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        style={{ paddingRight: 42 }}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

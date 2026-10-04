"use client";

import { useActionState } from "react";
import { AlertTriangle, Loader2, LogIn, User } from "lucide-react";
import { PasswordInput } from "@/components/client";
import { inputCls } from "@/components/ui";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={action} className="space-y-5" key={state.n ?? 0}>
      {state.error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
        </div>
      )}
      <div>
        <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700">
          Username
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="username"
            name="username"
            defaultValue={state.username}
            required
            autoComplete="username"
            placeholder="Masukkan username"
            className={`${inputCls} h-12 pl-10`}
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
        <PasswordInput
          name="password"
          required
          autoComplete="current-password"
          placeholder="Masukkan password"
          className={`${inputCls} h-12`}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-700 to-brand-800 font-semibold text-white shadow-lg shadow-brand-800/25 transition hover:from-brand-800 hover:to-brand-900 disabled:opacity-70"
      >
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
        {pending ? "Memeriksa..." : "Masuk"}
      </button>
    </form>
  );
}

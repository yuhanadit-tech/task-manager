"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import type { ApiResponse } from "@/types/user";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    setServerError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json: ApiResponse<{ id: string }> = await res.json();

    if (!res.ok || json.error) {
      setServerError(json.error ?? "Registration failed. Please try again.");
      return;
    }

    // Auto sign-in after successful registration
    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (signInResult?.error) {
      router.push("/login" as Route);
      return;
    }

    router.push("/dashboard" as Route);
    router.refresh();
  }

  async function handleGoogleSignIn() {
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="bg-white border border-[#e9ecef] rounded-xl p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-1">Create an account</h1>
      <p className="text-sm text-[#6c757d] mb-6">Start managing your team&apos;s work</p>

      {serverError && (
        <p role="alert" className="text-sm text-[#dc2626] bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          {serverError}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#1a1a2e] mb-1">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className="w-full rounded-md border border-[#ced4da] px-3 py-2 text-sm text-[#1a1a2e] placeholder-[#adb5bd] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
            placeholder="Jane Smith"
            {...register("name")}
          />
          {errors.name && (
            <p role="alert" className="text-xs text-[#dc2626] mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#1a1a2e] mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-md border border-[#ced4da] px-3 py-2 text-sm text-[#1a1a2e] placeholder-[#adb5bd] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p role="alert" className="text-xs text-[#dc2626] mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[#1a1a2e] mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md border border-[#ced4da] px-3 py-2 text-sm text-[#1a1a2e] placeholder-[#adb5bd] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
            placeholder="Minimum 8 characters"
            {...register("password")}
          />
          {errors.password && (
            <p role="alert" className="text-xs text-[#dc2626] mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1a1a2e] mb-1">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md border border-[#ced4da] px-3 py-2 text-sm text-[#1a1a2e] placeholder-[#adb5bd] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
            placeholder="••••••••"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p role="alert" className="text-xs text-[#dc2626] mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338ca] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#e9ecef]" />
        </div>
        <div className="relative flex justify-center text-xs text-[#6c757d] bg-white px-2">or</div>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full rounded-md border border-[#ced4da] px-4 py-2 text-sm font-medium text-[#1a1a2e] hover:bg-[#f8f9fa] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-sm text-[#6c757d] mt-5">
        Already have an account?{" "}
        <Link href={"/login" as Route} className="font-medium text-[#4f46e5] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

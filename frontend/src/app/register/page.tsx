"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({
        full_name: "",
        email: "",
        password: "",
        restaurant_name: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await register(form);
            router.push("/dashboard");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4 py-12">
            <div className="w-full max-w-md animate-scale-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-glow">
                            <span className="text-white font-bold text-xl">M</span>
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold text-surface-900">Create your account</h1>
                    <p className="text-surface-400 mt-1">Start serving digital menus in minutes</p>
                </div>

                {/* Form */}
                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm animate-scale-in">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-2">
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={form.full_name}
                                onChange={(e) => updateField("full_name", e.target.value)}
                                className="input-field"
                                placeholder="John Doe"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-2">
                                Restaurant Name
                            </label>
                            <input
                                type="text"
                                value={form.restaurant_name}
                                onChange={(e) => updateField("restaurant_name", e.target.value)}
                                className="input-field"
                                placeholder="My Amazing Restaurant"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => updateField("email", e.target.value)}
                                className="input-field"
                                placeholder="you@restaurant.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => updateField("password", e.target.value)}
                                className="input-field"
                                placeholder="••••••••"
                                minLength={6}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating account...
                                </div>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-6 text-sm text-surface-400">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}

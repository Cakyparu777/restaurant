"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Restaurant } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const [, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: "",
        description: "",
        phone: "",
        email: "",
        address: "",
        google_maps_url: "",
    });

    useEffect(() => {
        api
            .getMyRestaurant()
            .then((r) => {
                setRestaurant(r);
                setForm({
                    name: r.name || "",
                    description: r.description || "",
                    phone: r.phone || "",
                    email: r.email || "",
                    address: r.address || "",
                    google_maps_url: r.google_maps_url || "",
                });
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const save = async () => {
        setSaving(true);
        try {
            const updated = await api.updateMyRestaurant(form);
            setRestaurant(updated);
            alert("Settings saved!");
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto card p-8 animate-pulse-soft">
                <div className="h-6 bg-surface-100 rounded-full w-1/3 mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-12 bg-surface-50 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 page-enter">
            <h1 className="text-2xl font-bold text-surface-900">Settings</h1>

            {/* Restaurant Info */}
            <div className="card p-8">
                <h2 className="text-lg font-bold text-surface-800 mb-6">
                    Restaurant Information
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-2">
                            Restaurant Name
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={form.description}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, description: e.target.value }))
                            }
                            className="input-field min-h-[100px] resize-none"
                            placeholder="Tell customers about your restaurant..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-2">
                                Phone
                            </label>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, phone: e.target.value }))
                                }
                                className="input-field"
                                placeholder="+1 234 567 890"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, email: e.target.value }))
                                }
                                className="input-field"
                                placeholder="contact@restaurant.com"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-2">
                            Address
                        </label>
                        <input
                            type="text"
                            value={form.address}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, address: e.target.value }))
                            }
                            className="input-field"
                            placeholder="123 Main Street, City"
                        />
                    </div>
                    {/* 
                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-2">
                            Google Maps Link <span className="text-surface-400 font-normal">(Optional)</span>
                        </label>
                        <input
                            type="url"
                            value={form.google_maps_url}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, google_maps_url: e.target.value }))
                            }
                            className="input-field"
                            placeholder="https://maps.app.goo.gl/..."
                        />
                    </div>
                    */}
                </div>
                <button onClick={save} disabled={saving} className="btn-primary mt-6">
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            {/* Account */}
            <div className="card p-8">
                <h2 className="text-lg font-bold text-surface-800 mb-4">Account</h2>
                <div className="flex items-center gap-4 p-4 bg-surface-50 rounded-2xl mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-500 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                            {user?.full_name?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <p className="font-semibold text-surface-800">{user?.full_name}</p>
                        <p className="text-sm text-surface-400">{user?.email}</p>
                    </div>
                </div>
                <button onClick={logout} className="btn-danger text-sm">
                    Sign Out
                </button>
            </div>

            {/* Subscription */}
            <div className="card p-8">
                <h2 className="text-lg font-bold text-surface-800 mb-4">Subscription</h2>
                <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="badge bg-primary-200 text-primary-700 mb-2">
                                Free Plan
                            </span>
                            <p className="text-sm text-surface-600 mt-1">
                                Unlimited menu items, orders, and QR codes
                            </p>
                        </div>
                        <button className="btn-primary text-sm" disabled>
                            Upgrade (Coming Soon)
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}

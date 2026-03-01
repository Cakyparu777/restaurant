"use client";

import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Order, Restaurant } from "@/lib/types";

export default function DashboardPage() {
    const { user } = useAuth();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [rest, ords] = await Promise.all([
                    api.getMyRestaurant(),
                    api.getOrders(),
                ]);
                setRestaurant(rest);
                setOrders(ords);
            } catch {
                // may fail if no restaurant
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const todayOrders = orders.filter(
        (o) => new Date(o.created_at).toDateString() === new Date().toDateString()
    );
    const pendingOrders = orders.filter((o) => o.status === "pending");
    const todayRevenue = todayOrders.reduce(
        (s, o) => s + (o.status !== "cancelled" ? Number(o.total_amount) : 0),
        0
    );

    if (loading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="card p-6 animate-pulse-soft">
                        <div className="h-4 bg-surface-100 rounded-full w-1/3 mb-3" />
                        <div className="h-8 bg-surface-100 rounded-full w-1/2" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-surface-900">
                    Welcome back, {user?.full_name?.split(" ")[0]} 👋
                </h1>
                <p className="text-surface-400 mt-1">
                    Here&apos;s what&apos;s happening at{" "}
                    <span className="font-semibold text-surface-600">
                        {restaurant?.name || "your restaurant"}
                    </span>
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    {
                        label: "Today's Orders",
                        value: todayOrders.length,
                        icon: "📦",
                        color: "from-blue-500 to-blue-600",
                    },
                    {
                        label: "Pending",
                        value: pendingOrders.length,
                        icon: "⏳",
                        color: "from-amber-500 to-amber-600",
                    },
                    {
                        label: "Revenue Today",
                        value: `$${todayRevenue.toFixed(2)}`,
                        icon: "💰",
                        color: "from-primary-500 to-primary-600",
                    },
                    {
                        label: "Total Orders",
                        value: orders.length,
                        icon: "📊",
                        color: "from-purple-500 to-purple-600",
                    },
                ].map((stat, i) => (
                    <div
                        key={i}
                        className="card p-5 animate-slide-up"
                        style={{ animationDelay: `${i * 80}ms` }}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-surface-400 uppercase tracking-wide">
                                    {stat.label}
                                </p>
                                <p className="text-2xl md:text-3xl font-bold text-surface-900 mt-2">
                                    {stat.value}
                                </p>
                            </div>
                            <div
                                className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-lg`}
                            >
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-surface-900">Recent Orders</h2>
                    <a
                        href="/dashboard/orders"
                        className="text-sm text-primary-600 font-semibold hover:text-primary-700"
                    >
                        View all →
                    </a>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-4xl mb-3">🍽️</div>
                        <p className="text-surface-400">No orders yet. Share your menu link to get started!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.slice(0, 5).map((order, i) => (
                            <div
                                key={order.id}
                                className="flex items-center justify-between p-4 rounded-2xl bg-surface-50 hover:bg-surface-100 transition-colors animate-slide-up"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-card flex items-center justify-center text-sm font-bold text-surface-600">
                                        #{order.order_number.slice(-4)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-surface-800 text-sm">
                                            {order.order_number}
                                        </p>
                                        <p className="text-xs text-surface-400">
                                            Table {order.table_number || "-"} •{" "}
                                            {new Date(order.created_at).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-surface-800">
                                        ${Number(order.total_amount).toFixed(2)}
                                    </span>
                                    <span className={`badge-${order.status}`}>{order.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
                {[
                    {
                        title: "Manage Menu",
                        desc: "Add or edit items",
                        href: "/dashboard/menu",
                        icon: "🍕",
                    },
                    {
                        title: "View Orders",
                        desc: "Track all orders",
                        href: "/dashboard/orders",
                        icon: "📋",
                    },
                    {
                        title: "Get QR Code",
                        desc: "Share your menu",
                        href: "/dashboard/qr",
                        icon: "📱",
                    },
                ].map((action, i) => (
                    <a
                        key={i}
                        href={action.href}
                        className="card p-6 group cursor-pointer animate-slide-up"
                        style={{ animationDelay: `${i * 80}ms` }}
                    >
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                            {action.icon}
                        </div>
                        <h3 className="font-bold text-surface-800">{action.title}</h3>
                        <p className="text-sm text-surface-400">{action.desc}</p>
                    </a>
                ))}
            </div>
        </div>
    );
}

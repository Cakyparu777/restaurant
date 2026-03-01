"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Order, OrderStatus } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

const COLUMNS: { status: OrderStatus; label: string; color: string }[] = [
    { status: "pending", label: "🔔 Pending", color: "border-amber-400" },
    { status: "confirmed", label: "✅ Confirmed", color: "border-blue-400" },
    { status: "preparing", label: "👨‍🍳 Preparing", color: "border-purple-400" },
    { status: "ready", label: "🍽️ Ready", color: "border-primary-400" },
    { status: "completed", label: "✨ Completed", color: "border-surface-300" },
];

export default function OrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const wsRef = useRef<WebSocket | null>(null);

    const fetchOrders = async () => {
        try {
            const data = await api.getOrders();
            setOrders(data);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        // WebSocket for real-time updates
        if (user?.restaurant_id) {
            try {
                const ws = api.getOrdersWebSocket(user.restaurant_id);
                wsRef.current = ws;

                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === "new_order") {
                        setOrders((prev) => [data.order, ...prev]);
                    } else if (data.type === "order_status_update") {
                        setOrders((prev) =>
                            prev.map((o) => (o.id === data.order.id ? data.order : o))
                        );
                    }
                };

                ws.onclose = () => {
                    // Reconnect after 3 seconds
                    setTimeout(() => {
                        if (user?.restaurant_id) {
                            wsRef.current = api.getOrdersWebSocket(user.restaurant_id);
                        }
                    }, 3000);
                };
            } catch {
                // WebSocket not available, use polling
            }
        }

        return () => wsRef.current?.close();
    }, [user?.restaurant_id]);

    const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
        try {
            const updated = await api.updateOrderStatus(orderId, newStatus);
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "An error occurred");
        }
    };

    const getNextStatus = (current: OrderStatus): OrderStatus | null => {
        const flow: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "completed"];
        const idx = flow.indexOf(current);
        return idx < flow.length - 1 ? flow[idx + 1] : null;
    };

    if (loading) {
        return (
            <div className="flex gap-4 overflow-x-auto pb-4">
                {COLUMNS.map((col) => (
                    <div key={col.status} className="min-w-[300px] flex-shrink-0">
                        <div className="card p-4 animate-pulse-soft">
                            <div className="h-5 bg-surface-100 rounded-full w-1/2 mb-4" />
                            <div className="space-y-3">
                                <div className="h-20 bg-surface-50 rounded-2xl" />
                                <div className="h-20 bg-surface-50 rounded-2xl" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6 page-enter">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">Order Board</h1>
                    <p className="text-surface-400 text-sm mt-1">
                        Drag orders mentally, click to advance status
                    </p>
                </div>
                <button onClick={fetchOrders} className="btn-secondary text-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
                {COLUMNS.map((col) => {
                    const columnOrders = orders.filter((o) => o.status === col.status);
                    return (
                        <div key={col.status} className="min-w-[300px] md:min-w-0 md:flex-1 flex-shrink-0">
                            <div className={`rounded-3xl bg-surface-50 border-t-4 ${col.color} p-4`}>
                                {/* Column header */}
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-surface-700">{col.label}</h3>
                                    <span className="w-7 h-7 rounded-xl bg-white shadow-card flex items-center justify-center text-xs font-bold text-surface-500">
                                        {columnOrders.length}
                                    </span>
                                </div>

                                {/* Cards */}
                                <div className="space-y-3">
                                    {columnOrders.length === 0 ? (
                                        <div className="text-center py-6 text-surface-300 text-sm">
                                            No orders
                                        </div>
                                    ) : (
                                        columnOrders.map((order, i) => {
                                            const nextStatus = getNextStatus(order.status);
                                            return (
                                                <div
                                                    key={order.id}
                                                    className="card p-4 animate-scale-in"
                                                    style={{ animationDelay: `${i * 50}ms` }}
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <p className="font-bold text-surface-800 text-sm">
                                                                {order.order_number}
                                                            </p>
                                                            <p className="text-xs text-surface-400 mt-0.5">
                                                                Table {order.table_number || "-"} •{" "}
                                                                {new Date(order.created_at).toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </p>
                                                        </div>
                                                        <span className="font-bold text-surface-900">
                                                            ${Number(order.total_amount).toFixed(2)}
                                                        </span>
                                                    </div>

                                                    {/* Items preview */}
                                                    <div className="space-y-1 mb-3">
                                                        {order.items.slice(0, 3).map((item) => (
                                                            <div
                                                                key={item.id}
                                                                className="flex items-center justify-between text-xs text-surface-500"
                                                            >
                                                                <span>× {item.quantity}</span>
                                                                <span>${Number(item.subtotal).toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                        {order.items.length > 3 && (
                                                            <p className="text-xs text-surface-400">
                                                                +{order.items.length - 3} more items
                                                            </p>
                                                        )}
                                                    </div>

                                                    {order.customer_note && (
                                                        <p className="text-xs text-surface-400 italic bg-surface-50 rounded-xl p-2 mb-3">
                                                            💬 {order.customer_note}
                                                        </p>
                                                    )}

                                                    {/* Actions */}
                                                    <div className="flex gap-2">
                                                        {nextStatus && (
                                                            <button
                                                                onClick={() => updateStatus(order.id, nextStatus)}
                                                                className="btn-primary text-xs py-2 px-3 flex-1"
                                                            >
                                                                Move to {nextStatus}
                                                            </button>
                                                        )}
                                                        {order.status !== "cancelled" && order.status !== "completed" && (
                                                            <button
                                                                onClick={() => updateStatus(order.id, "cancelled")}
                                                                className="btn-ghost text-xs text-red-500 hover:bg-red-50 py-2 px-3"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

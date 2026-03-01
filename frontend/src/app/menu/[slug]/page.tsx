"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { PublicMenu, CartItem, MenuItem } from "@/lib/types";
import GoogleMapEmbed from "@/components/GoogleMapEmbed";

export default function CustomerMenuPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    const searchParams = useSearchParams();
    const qrToken = searchParams.get("table");

    const [data, setData] = useState<PublicMenu | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [tableNumber, setTableNumber] = useState("");
    const [note, setNote] = useState("");
    const [ordering, setOrdering] = useState(false);
    const [orderResult, setOrderResult] = useState<{ order_number: string; total_amount: number; status: string } | null>(null);

    useEffect(() => {
        api
            .getPublicMenu(slug)
            .then(setData)
            .catch(() => setError("Restaurant not found"))
            .finally(() => setLoading(false));
    }, [slug]);

    const addToCart = (item: MenuItem) => {
        setCart((prev) => {
            const existing = prev.find((c) => c.menu_item.id === item.id);
            if (existing) {
                return prev.map((c) =>
                    c.menu_item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
                );
            }
            return [...prev, { menu_item: item, quantity: 1 }];
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart((prev) => {
            const existing = prev.find((c) => c.menu_item.id === itemId);
            if (existing && existing.quantity > 1) {
                return prev.map((c) =>
                    c.menu_item.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
                );
            }
            return prev.filter((c) => c.menu_item.id !== itemId);
        });
    };

    const cartTotal = cart.reduce((sum, c) => {
        const price = Number(c.menu_item.price);
        const discount = c.menu_item.discount_percent / 100;
        return sum + price * (1 - discount) * c.quantity;
    }, 0);

    const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

    const placeOrder = async () => {
        if (cart.length === 0) return;
        setOrdering(true);
        try {
            const result = await api.placeOrder(slug, {
                table_number: tableNumber ? parseInt(tableNumber) : undefined,
                qr_token: qrToken || undefined,
                customer_note: note || undefined,
                items: cart.map((c) => ({
                    menu_item_id: c.menu_item.id,
                    quantity: c.quantity,
                })),
            });
            setOrderResult(result);
            setCart([]);
            setShowCart(false);
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setOrdering(false);
        }
    };

    const getEffectivePrice = (item: MenuItem) => {
        const price = Number(item.price);
        return item.discount_percent > 0
            ? price * (1 - item.discount_percent / 100)
            : price;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-50 flex items-center justify-center">
                <div className="animate-pulse-soft">
                    <div className="w-12 h-12 rounded-2xl bg-primary-500/20 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-lg bg-primary-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
                <div className="card p-8 text-center max-w-md">
                    <div className="text-5xl mb-4">🍽️</div>
                    <h1 className="text-xl font-bold text-surface-800 mb-2">Restaurant Not Found</h1>
                    <p className="text-surface-400">This menu link may be invalid or the restaurant is currently offline.</p>
                </div>
            </div>
        );
    }

    // Order success screen
    if (orderResult) {
        return (
            <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
                <div className="card p-8 text-center max-w-md w-full animate-scale-in">
                    <div className="w-20 h-20 mx-auto rounded-full bg-primary-100 flex items-center justify-center text-4xl mb-6">
                        ✅
                    </div>
                    <h1 className="text-2xl font-bold text-surface-900 mb-2">Order Placed!</h1>
                    <p className="text-surface-400 mb-6">Your order is being prepared</p>

                    <div className="bg-surface-50 rounded-2xl p-4 mb-6">
                        <p className="text-xs text-surface-400 uppercase tracking-wide">Order Number</p>
                        <p className="text-2xl font-bold text-surface-900 mt-1">
                            {orderResult.order_number}
                        </p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-surface-50 rounded-2xl mb-6">
                        <span className="text-surface-500">Total</span>
                        <span className="text-xl font-bold text-surface-900">
                            ${Number(orderResult.total_amount).toFixed(2)}
                        </span>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-sm text-primary-600">
                        <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse-soft" />
                        Status: {orderResult.status}
                    </div>

                    <button
                        onClick={() => setOrderResult(null)}
                        className="btn-primary w-full mt-6"
                    >
                        Order More
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-50 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-surface-900 to-surface-800 text-white px-4 pt-8 pb-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl" />
                <div className="relative max-w-lg mx-auto">
                    {data.restaurant.logo_url && (
                        <img
                            src={data.restaurant.logo_url}
                            alt={data.restaurant.name}
                            className="w-16 h-16 rounded-2xl object-cover mb-4 shadow-soft"
                        />
                    )}
                    <h1 className="text-2xl font-bold">{data.restaurant.name}</h1>
                    {data.restaurant.description && (
                        <p className="text-white/60 text-sm mt-2">{data.restaurant.description}</p>
                    )}

                    {/* Google Maps Integration
                    {(data.restaurant.address || data.restaurant.google_maps_url) && (
                        <div className="mt-6 mb-2">
                            <GoogleMapEmbed
                                address={data.restaurant.address}
                                restaurantName={data.restaurant.name}
                            />
                            {data.restaurant.google_maps_url && (
                                <a
                                    href={data.restaurant.google_maps_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 w-full bg-white/10 hover:bg-white/20 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors border border-white/20 backdrop-blur-sm shadow-soft"
                                >
                                    📍 Get Directions
                                </a>
                            )}
                        </div>
                    )}
                    */}
                </div>
            </div>

            {/* Category anchors */}
            <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-surface-100 px-4">
                <div className="max-w-lg mx-auto flex gap-2 overflow-x-auto py-3 -mx-1">
                    {data.menu.map((section) => (
                        <a
                            key={section.category.id}
                            href={`#cat-${section.category.id}`}
                            className="px-4 py-1.5 rounded-full bg-surface-100 text-surface-600 text-sm font-medium whitespace-nowrap hover:bg-primary-100 hover:text-primary-600 transition-colors"
                        >
                            {section.category.name}
                        </a>
                    ))}
                </div>
            </div>

            {/* Menu sections */}
            <div className="max-w-lg mx-auto px-4 pt-6">
                {data.menu.map((section) => (
                    <div key={section.category.id} id={`cat-${section.category.id}`} className="mb-8">
                        <h2 className="text-lg font-bold text-surface-900 mb-4 sticky top-14 bg-surface-50/90 backdrop-blur-sm py-2">
                            {section.category.name}
                        </h2>

                        <div className="space-y-3">
                            {section.items.map((item, i) => {
                                const cartItem = cart.find((c) => c.menu_item.id === item.id);
                                const effectivePrice = getEffectivePrice(item);

                                return (
                                    <div
                                        key={item.id}
                                        className="card p-4 animate-slide-up"
                                        style={{ animationDelay: `${i * 30}ms` }}
                                    >
                                        <div className="flex gap-4">
                                            {/* Image */}
                                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200 flex-shrink-0 flex items-center justify-center text-3xl overflow-hidden">
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    "🍽️"
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-surface-800">{item.name}</h3>
                                                {item.description && (
                                                    <p className="text-xs text-surface-400 mt-1 line-clamp-2">
                                                        {item.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="font-bold text-primary-600">
                                                        ${effectivePrice.toFixed(2)}
                                                    </span>
                                                    {item.discount_percent > 0 && (
                                                        <>
                                                            <span className="text-xs text-surface-400 line-through">
                                                                ${Number(item.price).toFixed(2)}
                                                            </span>
                                                            <span className="badge bg-red-100 text-red-600 text-[10px]">
                                                                -{item.discount_percent}%
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Add to cart */}
                                        <div className="mt-3 flex items-center justify-end">
                                            {cartItem ? (
                                                <div className="flex items-center gap-3 bg-surface-50 rounded-2xl p-1">
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="w-8 h-8 rounded-xl bg-white shadow-card flex items-center justify-center font-bold text-surface-600 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="font-bold text-surface-800 w-6 text-center">
                                                        {cartItem.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => addToCart(item)}
                                                        className="w-8 h-8 rounded-xl bg-primary-500 text-white shadow-glow flex items-center justify-center font-bold hover:bg-primary-600 transition-colors"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => addToCart(item)}
                                                    className="px-4 py-2 bg-primary-50 text-primary-600 rounded-2xl text-sm font-semibold hover:bg-primary-100 transition-colors"
                                                >
                                                    + Add
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Floating cart button */}
            {cartCount > 0 && !showCart && (
                <div className="fixed bottom-6 left-4 right-4 max-w-lg mx-auto z-40 animate-slide-up">
                    <button
                        onClick={() => setShowCart(true)}
                        className="w-full bg-primary-500 text-white rounded-2xl py-4 px-6 shadow-glow flex items-center justify-between font-semibold hover:bg-primary-600 transition-colors active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-sm">
                                {cartCount}
                            </span>
                            <span>View Order</span>
                        </div>
                        <span>${cartTotal.toFixed(2)}</span>
                    </button>
                </div>
            )}

            {/* Cart drawer */}
            {showCart && (
                <div className="fixed inset-0 z-50 animate-fade-in" onClick={() => setShowCart(false)}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 max-w-lg mx-auto">
                            {/* Handle */}
                            <div className="w-12 h-1 bg-surface-200 rounded-full mx-auto mb-6" />

                            <h2 className="text-xl font-bold text-surface-900 mb-6">Your Order</h2>

                            {/* Items */}
                            <div className="space-y-3 mb-6">
                                {cart.map((c) => (
                                    <div
                                        key={c.menu_item.id}
                                        className="flex items-center justify-between p-3 bg-surface-50 rounded-2xl"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-card">
                                                <button
                                                    onClick={() => removeFromCart(c.menu_item.id)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-red-500 hover:bg-red-50"
                                                >
                                                    −
                                                </button>
                                                <span className="text-sm font-bold w-5 text-center">
                                                    {c.quantity}
                                                </span>
                                                <button
                                                    onClick={() => addToCart(c.menu_item)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-primary-600 hover:bg-primary-50"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span className="text-sm font-medium text-surface-700 truncate max-w-[150px]">
                                                {c.menu_item.name}
                                            </span>
                                        </div>
                                        <span className="font-semibold text-surface-800">
                                            ${(getEffectivePrice(c.menu_item) * c.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Table number — only show if no QR token */}
                            {!qrToken && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-surface-700 mb-2">
                                        Table Number (optional)
                                    </label>
                                    <input
                                        type="number"
                                        value={tableNumber}
                                        onChange={(e) => setTableNumber(e.target.value)}
                                        className="input-field"
                                        placeholder="e.g., 5"
                                    />
                                </div>
                            )}
                            {qrToken && (
                                <div className="mb-4 p-3 bg-primary-50 rounded-2xl text-sm text-primary-700 font-medium">
                                    ✓ Table identified from QR code
                                </div>
                            )}

                            {/* Note */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-surface-700 mb-2">
                                    Note for kitchen (optional)
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="input-field min-h-[60px] resize-none"
                                    placeholder="Allergies, preferences..."
                                />
                            </div>

                            {/* Total + Order */}
                            <div className="border-t border-surface-100 pt-4 space-y-4">
                                <div className="flex items-center justify-between text-lg">
                                    <span className="font-medium text-surface-600">Total</span>
                                    <span className="font-bold text-surface-900">
                                        ${cartTotal.toFixed(2)}
                                    </span>
                                </div>
                                <button
                                    onClick={placeOrder}
                                    disabled={ordering}
                                    className="btn-primary w-full py-4 text-lg"
                                >
                                    {ordering ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Placing order...
                                        </div>
                                    ) : (
                                        `Place Order — $${cartTotal.toFixed(2)}`
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

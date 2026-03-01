"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Restaurant, Table } from "@/lib/types";

export default function QRPage() {
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTableNumber, setNewTableNumber] = useState("");
    const [newTableLabel, setNewTableLabel] = useState("");
    const [newTableSeats, setNewTableSeats] = useState("4");

    const fetchData = async () => {
        try {
            const [rest, tbls] = await Promise.all([
                api.getMyRestaurant(),
                api.getTables(),
            ]);
            setRestaurant(rest);
            setTables(tbls);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchData(); }, []);

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    const getMenuUrl = (table?: Table) => {
        if (!restaurant) return "";
        const url = `${baseUrl}/menu/${restaurant.slug}`;
        return table ? `${url}?table=${table.qr_token}` : url;
    };

    const getQrImage = (url: string) =>
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=0f172a&margin=16`;

    const addTable = async () => {
        try {
            await api.createTable({
                table_number: parseInt(newTableNumber),
                label: newTableLabel || undefined,
                seats: parseInt(newTableSeats) || 4,
            });
            setShowAddModal(false);
            setNewTableNumber("");
            setNewTableLabel("");
            setNewTableSeats("4");
            fetchData();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to create table");
        }
    };

    const deleteTable = async (id: string) => {
        if (!confirm("Delete this table?")) return;
        try {
            await api.deleteTable(id);
            fetchData();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to delete table");
        }
    };

    const rotateToken = async (id: string) => {
        if (!confirm("Regenerate QR? Old QR codes will stop working.")) return;
        try {
            await api.rotateTableToken(id);
            fetchData();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to rotate token");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse-soft text-surface-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 page-enter">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-surface-900">QR Codes & Tables</h1>
                    <p className="text-surface-400 text-sm mt-1">
                        {tables.length} tables • Each has a unique QR code
                    </p>
                </div>
                <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">
                    + Add Table
                </button>
            </div>

            {/* General menu QR (no table) */}
            <div className="card p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <img
                        src={getQrImage(getMenuUrl())}
                        alt="General menu QR"
                        className="w-32 h-32 rounded-2xl"
                    />
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="font-bold text-surface-800">General Menu Link</h3>
                        <p className="text-sm text-surface-400 mt-1">
                            No table assigned — customers can enter table number manually
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                            <input
                                type="text"
                                value={getMenuUrl()}
                                readOnly
                                className="input-field text-xs flex-1"
                            />
                            <button
                                onClick={() => { navigator.clipboard.writeText(getMenuUrl()); alert("Copied!"); }}
                                className="btn-secondary text-xs"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Per-table QR codes */}
            {tables.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="text-5xl mb-4">🪑</div>
                    <h3 className="text-lg font-bold text-surface-700 mb-2">No tables yet</h3>
                    <p className="text-surface-400 text-sm mb-6">
                        Add tables to generate unique QR codes for each
                    </p>
                    <button onClick={() => setShowAddModal(true)} className="btn-primary">
                        + Add First Table
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tables.map((table, i) => (
                        <div
                            key={table.id}
                            className={`card p-5 animate-scale-in ${!table.is_active ? "opacity-60" : ""}`}
                            style={{ animationDelay: `${i * 40}ms` }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-surface-800">
                                        Table {table.table_number}
                                    </h3>
                                    {table.label && (
                                        <p className="text-xs text-surface-400">{table.label}</p>
                                    )}
                                </div>
                                <span className="badge bg-surface-100 text-surface-500">
                                    {table.seats} seats
                                </span>
                            </div>

                            <div className="flex justify-center mb-4">
                                <img
                                    src={getQrImage(getMenuUrl(table))}
                                    alt={`QR for table ${table.table_number}`}
                                    className="w-40 h-40 rounded-2xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <a
                                        href={getQrImage(getMenuUrl(table))}
                                        download={`table-${table.table_number}-qr.png`}
                                        className="btn-secondary text-xs flex-1 text-center"
                                    >
                                        📥 Download
                                    </a>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(getMenuUrl(table));
                                            alert("Copied!");
                                        }}
                                        className="btn-secondary text-xs flex-1"
                                    >
                                        📋 Copy Link
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => rotateToken(table.id)}
                                        className="btn-ghost text-xs flex-1 text-amber-600 hover:bg-amber-50"
                                    >
                                        🔄 Rotate QR
                                    </button>
                                    <button
                                        onClick={() => deleteTable(table.id)}
                                        className="btn-ghost text-xs flex-1 text-red-500 hover:bg-red-50"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Table Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
                    <div className="card p-8 w-full max-w-md mx-4 animate-scale-in">
                        <h2 className="text-xl font-bold text-surface-900 mb-6">Add Table</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-2">
                                    Table Number
                                </label>
                                <input
                                    type="number"
                                    value={newTableNumber}
                                    onChange={(e) => setNewTableNumber(e.target.value)}
                                    className="input-field"
                                    placeholder="1"
                                    min="1"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-2">
                                    Label (optional)
                                </label>
                                <input
                                    type="text"
                                    value={newTableLabel}
                                    onChange={(e) => setNewTableLabel(e.target.value)}
                                    className="input-field"
                                    placeholder="e.g., Patio 3, Window seat"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-2">
                                    Seats
                                </label>
                                <input
                                    type="number"
                                    value={newTableSeats}
                                    onChange={(e) => setNewTableSeats(e.target.value)}
                                    className="input-field"
                                    placeholder="4"
                                    min="1"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={addTable} className="btn-primary flex-1">
                                Create Table
                            </button>
                            <button onClick={() => setShowAddModal(false)} className="btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Category, MenuItem } from "@/lib/types";

export default function MenuPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string | null>(null);

    // Modals
    const [showCatModal, setShowCatModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

    // Forms
    const [catName, setCatName] = useState("");
    const [itemForm, setItemForm] = useState({
        name: "",
        description: "",
        price: "",
        category_id: "",
        is_available: true,
        discount_percent: 0,
    });

    const fetchData = async () => {
        try {
            const [cats, its] = await Promise.all([
                api.getCategories(),
                api.getMenuItems(),
            ]);
            setCategories(cats);
            setItems(its);
            if (cats.length > 0 && !activeTab) setActiveTab(cats[0].id);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        fetchData();
    }, []);

    // Category CRUD
    const saveCategory = async () => {
        try {
            if (editingCat) {
                await api.updateCategory(editingCat.id, { name: catName });
            } else {
                await api.createCategory({ name: catName, sort_order: categories.length });
            }
            setShowCatModal(false);
            setCatName("");
            setEditingCat(null);
            fetchData();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "An error occurred");
        }
    };

    const deleteCategory = async (id: string) => {
        if (!confirm("Delete this category and all its items?")) return;
        try {
            await api.deleteCategory(id);
            fetchData();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "An error occurred");
        }
    };

    // Item CRUD
    const openItemModal = (item?: MenuItem) => {
        if (item) {
            setEditingItem(item);
            setItemForm({
                name: item.name,
                description: item.description || "",
                price: String(item.price),
                category_id: item.category_id,
                is_available: item.is_available,
                discount_percent: item.discount_percent,
            });
        } else {
            setEditingItem(null);
            setItemForm({
                name: "",
                description: "",
                price: "",
                category_id: activeTab || "",
                is_available: true,
                discount_percent: 0,
            });
        }
        setShowItemModal(true);
    };

    const saveItem = async () => {
        try {
            const data = {
                name: itemForm.name,
                description: itemForm.description || null,
                price: parseFloat(itemForm.price),
                category_id: itemForm.category_id,
                is_available: itemForm.is_available,
                discount_percent: itemForm.discount_percent,
            };
            if (editingItem) {
                await api.updateMenuItem(editingItem.id, data);
            } else {
                await api.createMenuItem(data);
            }
            setShowItemModal(false);
            setEditingItem(null);
            fetchData();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "An error occurred");
        }
    };

    const toggleItem = async (id: string) => {
        try {
            await api.toggleMenuItem(id);
            fetchData();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "An error occurred");
        }
    };

    const deleteItem = async (id: string) => {
        if (!confirm("Delete this menu item?")) return;
        try {
            await api.deleteMenuItem(id);
            fetchData();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "An error occurred");
        }
    };

    const filteredItems = activeTab
        ? items.filter((i) => i.category_id === activeTab)
        : items;

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="card p-6 animate-pulse-soft">
                        <div className="flex gap-4">
                            <div className="w-20 h-20 bg-surface-100 rounded-2xl" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-surface-100 rounded-full w-1/3" />
                                <div className="h-3 bg-surface-100 rounded-full w-2/3" />
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
                    <h1 className="text-2xl font-bold text-surface-900">Menu Management</h1>
                    <p className="text-surface-400 text-sm mt-1">
                        {items.length} items across {categories.length} categories
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setEditingCat(null);
                            setCatName("");
                            setShowCatModal(true);
                        }}
                        className="btn-secondary text-sm"
                    >
                        + Category
                    </button>
                    <button onClick={() => openItemModal()} className="btn-primary text-sm">
                        + Add Item
                    </button>
                </div>
            </div>

            {/* Category Tabs */}
            {categories.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                    <button
                        onClick={() => setActiveTab(null)}
                        className={`px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition-all ${!activeTab
                            ? "bg-surface-900 text-white shadow-soft"
                            : "bg-white text-surface-500 hover:bg-surface-50 border border-surface-200"
                            }`}
                    >
                        All ({items.length})
                    </button>
                    {categories.map((cat) => (
                        <div key={cat.id} className="relative group">
                            <button
                                onClick={() => setActiveTab(cat.id)}
                                className={`px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === cat.id
                                    ? "bg-surface-900 text-white shadow-soft"
                                    : "bg-white text-surface-500 hover:bg-surface-50 border border-surface-200"
                                    }`}
                            >
                                {cat.name} ({items.filter((i) => i.category_id === cat.id).length})
                            </button>
                            {/* Edit/Delete on hover */}
                            <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingCat(cat);
                                        setCatName(cat.name);
                                        setShowCatModal(true);
                                    }}
                                    className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]"
                                >
                                    ✎
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteCategory(cat.id);
                                    }}
                                    className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Items Grid */}
            {filteredItems.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="text-5xl mb-4">🍽️</div>
                    <h3 className="text-lg font-bold text-surface-700 mb-2">No items yet</h3>
                    <p className="text-surface-400 text-sm mb-6">
                        Add your first menu item to get started
                    </p>
                    <button onClick={() => openItemModal()} className="btn-primary">
                        + Add Menu Item
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item, i) => (
                        <div
                            key={item.id}
                            className={`card p-5 animate-scale-in ${!item.is_available ? "opacity-60" : ""
                                }`}
                            style={{ animationDelay: `${i * 40}ms` }}
                        >
                            <div className="flex gap-4">
                                {/* Image */}
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-surface-100 to-surface-200 flex-shrink-0 flex items-center justify-center text-3xl overflow-hidden">
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
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <h3 className="font-bold text-surface-800 truncate">
                                            {item.name}
                                        </h3>
                                        {item.discount_percent > 0 && (
                                            <span className="badge bg-red-100 text-red-600 ml-2">
                                                -{item.discount_percent}%
                                            </span>
                                        )}
                                    </div>
                                    {item.description && (
                                        <p className="text-xs text-surface-400 mt-1 line-clamp-2">
                                            {item.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="font-bold text-primary-600">
                                            ${Number(item.price).toFixed(2)}
                                        </span>
                                        {item.discount_percent > 0 && (
                                            <span className="text-xs text-surface-400 line-through">
                                                ${(Number(item.price) / (1 - item.discount_percent / 100)).toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-100">
                                <button
                                    onClick={() => toggleItem(item.id)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${item.is_available ? "bg-primary-500" : "bg-surface-300"
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${item.is_available ? "left-[26px]" : "left-0.5"
                                            }`}
                                    />
                                </button>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => openItemModal(item)}
                                        className="btn-ghost text-xs py-1.5"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="btn-ghost text-xs py-1.5 text-red-500 hover:bg-red-50"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Category Modal */}
            {showCatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
                    <div className="card p-8 w-full max-w-md mx-4 animate-scale-in">
                        <h2 className="text-xl font-bold text-surface-900 mb-6">
                            {editingCat ? "Edit Category" : "New Category"}
                        </h2>
                        <input
                            type="text"
                            value={catName}
                            onChange={(e) => setCatName(e.target.value)}
                            className="input-field mb-6"
                            placeholder="e.g., Main Dishes, Drinks, Desserts..."
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button onClick={saveCategory} className="btn-primary flex-1">
                                {editingCat ? "Save" : "Create"}
                            </button>
                            <button
                                onClick={() => {
                                    setShowCatModal(false);
                                    setEditingCat(null);
                                }}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Item Modal */}
            {showItemModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in overflow-y-auto py-8">
                    <div className="card p-8 w-full max-w-lg mx-4 animate-scale-in">
                        <h2 className="text-xl font-bold text-surface-900 mb-6">
                            {editingItem ? "Edit Item" : "New Menu Item"}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={itemForm.name}
                                    onChange={(e) =>
                                        setItemForm((f) => ({ ...f, name: e.target.value }))
                                    }
                                    className="input-field"
                                    placeholder="Grilled Salmon"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={itemForm.description}
                                    onChange={(e) =>
                                        setItemForm((f) => ({ ...f, description: e.target.value }))
                                    }
                                    className="input-field min-h-[80px] resize-none"
                                    placeholder="Fresh Atlantic salmon with herbs..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 mb-2">
                                        Price ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={itemForm.price}
                                        onChange={(e) =>
                                            setItemForm((f) => ({ ...f, price: e.target.value }))
                                        }
                                        className="input-field"
                                        placeholder="12.99"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 mb-2">
                                        Discount %
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={itemForm.discount_percent}
                                        onChange={(e) =>
                                            setItemForm((f) => ({
                                                ...f,
                                                discount_percent: parseInt(e.target.value) || 0,
                                            }))
                                        }
                                        className="input-field"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 mb-2">
                                    Category
                                </label>
                                <select
                                    value={itemForm.category_id}
                                    onChange={(e) =>
                                        setItemForm((f) => ({ ...f, category_id: e.target.value }))
                                    }
                                    className="input-field"
                                >
                                    <option value="">Select category</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={saveItem} className="btn-primary flex-1">
                                {editingItem ? "Save Changes" : "Add Item"}
                            </button>
                            <button
                                onClick={() => {
                                    setShowItemModal(false);
                                    setEditingItem(null);
                                }}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

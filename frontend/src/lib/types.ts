// API types matching the backend Pydantic schemas

export interface TokenResponse {
    access_token: string;
    token_type: string;
}

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: "admin" | "owner" | "staff";
    restaurant_id: string | null;
    is_active: boolean;
}

export interface Restaurant {
    id: string;
    name: string;
    slug: string;
    description?: string;
    phone?: string;
    email?: string;
    address?: string;
    logo_url?: string;
    google_maps_url?: string;
    is_active: boolean;
    created_at: string;
}

export interface Category {
    id: string;
    restaurant_id: string;
    name: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
}

export interface MenuItem {
    id: string;
    category_id: string;
    restaurant_id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    is_available: boolean;
    sort_order: number;
    discount_percent: number;
    created_at: string;
    updated_at: string;
}

export interface Table {
    id: string;
    restaurant_id: string;
    table_number: number;
    label: string | null;
    qr_token: string;
    seats: number;
    is_active: boolean;
    created_at: string;
}

export interface OrderItem {
    id: string;
    menu_item_id: string | null;
    menu_item_name?: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    special_instructions: string | null;
}

export interface Order {
    id: string;
    restaurant_id: string;
    order_number: string;
    table_number: number | null;
    table_id: string | null;
    status: OrderStatus;
    total_amount: number;
    customer_note: string | null;
    items: OrderItem[];
    created_at: string;
    updated_at: string;
}

export type OrderStatus =
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled";

export interface Subscription {
    id: string;
    restaurant_id: string;
    plan: "free" | "basic" | "premium";
    status: "active" | "expired" | "cancelled";
    starts_at: string;
    expires_at: string | null;
}

export interface MenuCategory {
    category: Category;
    items: MenuItem[];
}

export interface PublicMenu {
    restaurant: Restaurant;
    menu: MenuCategory[];
}

// Cart types (client-side only)
export interface CartItem {
    menu_item: MenuItem;
    quantity: number;
    special_instructions?: string;
}

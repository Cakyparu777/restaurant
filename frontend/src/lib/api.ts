import {
    TokenResponse,
    User,
    Restaurant,
    Category,
    MenuItem,
    Order,
    PublicMenu,
    Subscription,
    Table,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiClient {
    private token: string | null = null;

    constructor() {
        if (typeof window !== "undefined") {
            this.token = localStorage.getItem("token");
        }
    }

    setToken(token: string) {
        this.token = token;
        if (typeof window !== "undefined") {
            localStorage.setItem("token", token);
        }
    }

    clearToken() {
        this.token = null;
        if (typeof window !== "undefined") {
            localStorage.removeItem("token");
        }
    }

    private async request<T>(
        path: string,
        options: RequestInit = {}
    ): Promise<T> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(options.headers as Record<string, string>),
        };

        if (this.token) {
            headers["Authorization"] = `Bearer ${this.token}`;
        }

        const res = await fetch(`${API_URL}${path}`, {
            ...options,
            headers,
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ detail: "Request failed" }));
            throw new Error(error.detail || `HTTP ${res.status}`);
        }

        if (res.status === 204) return {} as T;
        return res.json();
    }

    // Auth
    async register(data: {
        email: string;
        password: string;
        full_name: string;
        restaurant_name: string;
    }): Promise<TokenResponse> {
        const res = await this.request<TokenResponse>("/auth/register", {
            method: "POST",
            body: JSON.stringify(data),
        });
        this.setToken(res.access_token);
        return res;
    }

    async login(email: string, password: string): Promise<TokenResponse> {
        const res = await this.request<TokenResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        this.setToken(res.access_token);
        return res;
    }

    async getMe(): Promise<User> {
        return this.request<User>("/auth/me");
    }

    // Restaurant
    async getMyRestaurant(): Promise<Restaurant> {
        return this.request<Restaurant>("/restaurants/me");
    }

    async updateMyRestaurant(data: Partial<Restaurant>): Promise<Restaurant> {
        return this.request<Restaurant>("/restaurants/me", {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    async getPublicMenu(slug: string): Promise<PublicMenu> {
        return this.request<PublicMenu>(`/restaurants/${slug}/menu`);
    }

    // Categories
    async getCategories(): Promise<Category[]> {
        return this.request<Category[]>("/categories");
    }

    async createCategory(data: { name: string; sort_order?: number }): Promise<Category> {
        return this.request<Category>("/categories", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
        return this.request<Category>(`/categories/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    async deleteCategory(id: string): Promise<void> {
        return this.request<void>(`/categories/${id}`, { method: "DELETE" });
    }

    // Menu Items
    async getMenuItems(categoryId?: string): Promise<MenuItem[]> {
        const params = categoryId ? `?category_id=${categoryId}` : "";
        return this.request<MenuItem[]>(`/menu-items${params}`);
    }

    async createMenuItem(data: Partial<MenuItem>): Promise<MenuItem> {
        return this.request<MenuItem>("/menu-items", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async updateMenuItem(id: string, data: Partial<MenuItem>): Promise<MenuItem> {
        return this.request<MenuItem>(`/menu-items/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    async toggleMenuItem(id: string): Promise<MenuItem> {
        return this.request<MenuItem>(`/menu-items/${id}/toggle`, {
            method: "PATCH",
        });
    }

    async deleteMenuItem(id: string): Promise<void> {
        return this.request<void>(`/menu-items/${id}`, { method: "DELETE" });
    }

    // Orders
    async placeOrder(
        slug: string,
        data: {
            table_number?: number;
            qr_token?: string;
            customer_note?: string;
            items: { menu_item_id: string; quantity: number; special_instructions?: string }[];
        }
    ): Promise<Order> {
        return this.request<Order>(`/restaurants/${slug}/orders`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async getOrders(status?: string): Promise<Order[]> {
        const params = status ? `?status=${status}` : "";
        return this.request<Order[]>(`/orders${params}`);
    }

    async getOrder(id: string): Promise<Order> {
        return this.request<Order>(`/orders/${id}`);
    }

    async updateOrderStatus(id: string, status: string): Promise<Order> {
        return this.request<Order>(`/orders/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        });
    }

    // Admin
    async adminGetRestaurants(): Promise<Restaurant[]> {
        return this.request<Restaurant[]>("/admin/restaurants");
    }

    // Tables
    async getTables(): Promise<Table[]> {
        return this.request<Table[]>("/tables");
    }

    async createTable(data: { table_number: number; label?: string; seats?: number }): Promise<Table> {
        return this.request<Table>("/tables", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async updateTable(id: string, data: Partial<Table>): Promise<Table> {
        return this.request<Table>(`/tables/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    async deleteTable(id: string): Promise<void> {
        return this.request<void>(`/tables/${id}`, { method: "DELETE" });
    }

    async rotateTableToken(id: string): Promise<Table> {
        return this.request<Table>(`/tables/${id}/rotate-token`, { method: "POST" });
    }

    async adminToggleRestaurant(id: string): Promise<{ id: string; is_active: boolean }> {
        return this.request<{ id: string; is_active: boolean }>(
            `/admin/restaurants/${id}/toggle`,
            { method: "PATCH" }
        );
    }

    async adminGetSubscriptions(): Promise<Subscription[]> {
        return this.request<Subscription[]>("/admin/subscriptions");
    }

    // WebSocket
    getOrdersWebSocket(restaurantId: string): WebSocket {
        const wsUrl = (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/v1");
        return new WebSocket(`${wsUrl}/ws/orders/${restaurantId}`);
    }

    getOrderStatusWebSocket(orderId: string): WebSocket {
        const wsUrl = (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/api/v1");
        return new WebSocket(`${wsUrl}/ws/order-status/${orderId}`);
    }
}

export const api = new ApiClient();

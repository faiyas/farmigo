import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export const api = axios.create({ 
  baseURL: API_BASE + "/api",
  headers: {
    'Content-Type': 'application/json',
  }
});

export function setAuthToken(token?: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    // Also add for axios instance
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
    delete axios.defaults.headers.common["Authorization"];
  }
}

export const AuthAPI = {
  async register(payload: { name: string; email: string; password: string; role?: string }) {
    const { data } = await api.post("/auth/register", payload);
    return data as { token: string; user: { id: number; name: string; email: string; role?: string } };
  },
  async login(payload: { email: string; password: string }) {
    const { data } = await api.post("/auth/login", payload);
    return data as { token: string; user: { id: number; name: string; email: string; role?: string } };
  },
};

export const CustomerAPI = {
  async market(search?: string) {
    const { data } = await api.get("/customer/market", { params: { search } });
    return data as { items: { id: number; crop: { id: number | null; name: string }; price: number; quantity: number; available: boolean; imageUrl?: string; farmerId: number }[] };
  },
  async createOrder(items: { inventoryId: number; quantity: number }[]) {
    const { data } = await api.post("/customer/orders", { items });
    return data as { orderId: number; total: number };
  },
};

export const FarmerAPI = {
  async listInventory() {
    const { data } = await api.get("/farmer/inventory");
    return data as { items: { id: number; crop: { id: number | null; name: string }; price: number; quantity: number; available: boolean; imageUrl?: string }[] };
  },
  async listCrops() {
    const { data } = await api.get("/farmer/crops");
    return data as { crops: { crop: string; name: string; description?: string }[] };
  },
  async createInventory(payload: { cropName: string; price: number; quantity: number; image?: File | null }) {
    const form = new FormData();
    form.append("cropName", payload.cropName);
    form.append("price", String(payload.price));
    form.append("quantity", String(payload.quantity));
    if (payload.image) form.append("image", payload.image);
    const { data } = await api.post("/farmer/inventory", form, { headers: { "Content-Type": "multipart/form-data" } });
    return data as { id: number; imageUrl?: string };
  },
  async updateInventory(id: number, payload: Partial<{ price: number; quantity: number; available: boolean; image: File | null }>) {
    // If image is present, send multipart, otherwise JSON
    if (payload.image) {
      const form = new FormData();
      if (payload.price !== undefined) form.append("price", String(payload.price));
      if (payload.quantity !== undefined) form.append("quantity", String(payload.quantity));
      if (payload.available !== undefined) form.append("available", payload.available ? "1" : "0");
      form.append("image", payload.image);
      const { data } = await api.put(`/farmer/inventory/${id}`, form, { headers: { "Content-Type": "multipart/form-data" } });
      return data as { status: string; imageUrl?: string };
    }
    const { data } = await api.put(`/farmer/inventory/${id}`, payload);
    return data as { status: string; imageUrl?: string };
  },
  async deleteInventory(id: number) {
    const { data } = await api.delete(`/farmer/inventory/${id}`);
    return data as { status: string };
  },
};

export const AdminAPI = {
  async stats() {
    const { data } = await api.get("/admin/stats");
    return data as {
      numFarmers: number;
      numCustomers: number;
      totalSales: number;
      itemsSold: number;
      activeListings: number;
      monthlySales: Array<{
        month: string;
        year: number;
        sales: number;
      }>;
      topFarmers: Array<{
        name: string;
        sales: number;
        orders: number;
      }>;
      cropsInDemand: Array<{
        name: string;
        quantity: number;
      }>;
    };
  },
};

export const AIApi = {
  async recommend(city: string) {
    const { data } = await api.get("/ai/recommend-crop", { params: { city } });
    return data as { recommendedCrops: string[]; suggestedManure: string; basis: string };
  },
  async chatbot(question: string) {
    const { data } = await api.post("/ai/chatbot", { question });
    return data as { answer: string };
  },
  async diseaseDetect(file: File) {
    const form = new FormData();
    form.append("image", file);
    const { data } = await api.post("/ai/disease-detect", form, { headers: { "Content-Type": "multipart/form-data" } });
    return data as (
      | { leafDetected: false; message: string; image: string }
      | { disease: string; confidence: number; advice: string; image: string; editedImage?: string | null; promptUsed?: string | null; leafDetected: true }
    );
  },
  async diseaseDetectWithPrompt(file: File, prompt: string) {
    const form = new FormData();
    form.append("image", file);
    form.append("prompt", prompt);
    const { data } = await api.post("/ai/disease-detect", form, { headers: { "Content-Type": "multipart/form-data" } });
    return data as (
      | { leafDetected: false; message: string; image: string }
      | { disease: string; confidence: number; advice: string; image: string; editedImage?: string | null; promptUsed?: string | null; leafDetected: true }
    );
  },
};



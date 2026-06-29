const BASE_URL = import.meta.env.VITE_API_URL || "https://web-production-f2fae.up.railway.app";

const request = async (endpoint: string, options: RequestInit = {}) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    let err = "Erro na requisição";
    try {
      const data = await res.json();
      err = data.detail || data.message || err;
    } catch (e) {}
    throw new Error(err);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

export const loginAdmin = async (username: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);
  const res = await fetch(`${BASE_URL}/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });
  if (!res.ok) throw new Error("Usuário ou senha incorretos");
  return res.json();
};

export const fetchBanners = () => request("/banners");
export const fetchConfiguracoes = () => request("/configuracoes");
export const fetchCategorias = () => request("/categorias");
export const fetchProdutos = () => request("/produtos");
export const fetchZonasEntrega = () => request("/zonas-entrega");

export const fetchClientes = (token: string) => request("/clientes", { headers: { Authorization: `Bearer ${token}` } });
export const fetchPedidosAdmin = (token: string) => request("/pedidos", { headers: { Authorization: `Bearer ${token}` } });
export const fetchDashboardStats = (token: string) => request("/pedidos/dashboard/stats", { headers: { Authorization: `Bearer ${token}` } });

export const updateOrderStatus = (token: string, id: string, status: string) => request(`/pedidos/${id}/status`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ status })
});

export const enviarDisparo = (token: string, mensagem: string) => request("/clientes/disparo", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ mensagem })
});

export const inscreverNotificacoes = (nome: string, whatsapp: string) => request("/clientes/inscrever", {
  method: "POST",
  body: JSON.stringify({ nome, whatsapp })
});

export const createProduto = (token: string, data: any) => request("/produtos", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify(data)
});
export const deleteProduto = (token: string, id: string) => request(`/produtos/${id}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${token}` }
});
export const createCategoria = (token: string, nome: string) => request("/categorias", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ nome })
});
export const deleteCategoria = (token: string, id: string) => request(`/categorias/${id}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${token}` }
});
export const updateEstoqueProduto = (token: string, id: string, estoque: number) => request(`/produtos/${id}/estoque`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ estoque })
});

export const updateConfiguracoes = (token: string, data: any) => request("/configuracoes", {
  method: "PATCH",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify(data)
});

export const createZonaEntrega = (token: string, data: any) => request("/zonas-entrega", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify(data)
});
export const updateZonaEntrega = (token: string, id: string, data: any) => request(`/zonas-entrega/${id}`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify(data)
});
export const deleteZonaEntrega = (token: string, id: string) => request(`/zonas-entrega/${id}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${token}` }
});

export const createBanner = (token: string, data: any) => request("/banners", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify(data)
});
export const updateBanner = (token: string, id: string, data: any) => request(`/banners/${id}`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify(data)
});
export const deleteBanner = (token: string, id: string) => request(`/banners/${id}`, {
  method: "DELETE",
  headers: { Authorization: `Bearer ${token}` }
});

// WhatsApp endpoints (Evolution API integration status)
export const fetchWhatsAppStatus = (token: string) => request("/whatsapp/status", { headers: { Authorization: `Bearer ${token}` } });
export const fetchWhatsAppQRCode = (token: string) => request("/whatsapp/qrcode", { headers: { Authorization: `Bearer ${token}` } });
export const logoutWhatsApp = (token: string) => request("/whatsapp/logout", { method: "POST", headers: { Authorization: `Bearer ${token}` } });

// Mocks for missing functions in admin.tsx
export const importFromInstagram = async (token: string) => { return { success: true } };
export const seedBoaVista = async (token: string) => { return { success: true } };

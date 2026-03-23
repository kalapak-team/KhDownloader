import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "kh_auth_token";

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
	const token = localStorage.getItem(TOKEN_KEY);
	if (token) {
		config.headers = config.headers || {};
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

export const fetchMediaInfo = (url) => api.post("/api/info", { url });
export const startDownload = (payload) => api.post("/api/download", payload);
export const getDownloadStatus = (id) => api.get(`/api/download/${id}/status`);
export const getDownloadFile = (id) => `${baseURL}/api/download/${id}/file`;
export const getHistory = (params) => api.get("/api/history", { params });
export const deleteHistory = (id) => api.delete(`/api/history/${id}`);
export const clearHistory = () => api.delete("/api/history");
export const registerWithEmail = (payload) => api.post("/api/auth/register", payload);
export const loginWithEmail = (payload) => api.post("/api/auth/login", payload);
export const loginWithGoogle = (credential) => api.post("/api/auth/google", { credential });
export const getCurrentUser = () => api.get("/api/auth/me");
export const getGoogleConfig = () => api.get("/api/auth/google-config");

// Admin
export const adminGetStats = () => api.get("/api/admin/stats");
export const adminGetUsers = (params) => api.get("/api/admin/users", { params });
export const adminToggleUserActive = (id) => api.patch(`/api/admin/users/${id}/toggle-active`);
export const adminToggleUserAdmin = (id) => api.patch(`/api/admin/users/${id}/toggle-admin`);
export const adminDeleteUser = (id) => api.delete(`/api/admin/users/${id}`);
export const adminGetDownloads = (params) => api.get("/api/admin/downloads", { params });
export const adminDeleteDownload = (id) => api.delete(`/api/admin/downloads/${id}`);

// Profile
export const updateProfile = (payload) => api.patch("/api/users/me", payload);
export const changePassword = (payload) => api.put("/api/users/me/password", payload);
export const uploadAvatar = async (file) => {
	const form = new FormData();
	form.append("file", file);
	const token = localStorage.getItem(TOKEN_KEY);
	const headers = {};
	if (token) headers["Authorization"] = `Bearer ${token}`;
	const res = await fetch(`${baseURL}/api/users/me/avatar`, {
		method: "POST",
		headers,
		body: form,
	});
	if (!res.ok) {
		let detail = "Upload failed";
		try { const j = await res.json(); detail = j.detail || detail; } catch {}
		throw new Error(detail);
	}
	return res.json();
};

// PDF to JPG — POST returns ZIP as base64 inside JSON so IDM cannot intercept it
export const convertPdfToJpg = async (file) => {
	const form = new FormData();
	form.append("file", file);
	const token = localStorage.getItem(TOKEN_KEY);
	const headers = {};
	if (token) headers["Authorization"] = `Bearer ${token}`;
	const res = await fetch(`${baseURL}/api/pdf2jpg`, {
		method: "POST",
		headers,
		body: form,
	});
	if (!res.ok) {
		let detail = "Conversion failed";
		try { const j = await res.json(); detail = j.detail || detail; } catch {}
		throw new Error(detail);
	}
	return res.json(); // { filename, data: "<base64 zip>" }
};

// JPG to PDF — POST returns PDF as base64 inside JSON so IDM cannot intercept it
export const convertJpgToPdf = async (files, orientation = "portrait", margin = "small") => {
	const form = new FormData();
	files.forEach((f) => form.append("files", f));
	form.append("orientation", orientation);
	form.append("margin", margin);
	const token = localStorage.getItem(TOKEN_KEY);
	const headers = {};
	if (token) headers["Authorization"] = `Bearer ${token}`;
	const res = await fetch(`${baseURL}/api/jpg2pdf`, {
		method: "POST",
		headers,
		body: form,
	});
	if (!res.ok) {
		let detail = "Conversion failed";
		try { const j = await res.json(); detail = j.detail || detail; } catch {}
		throw new Error(detail);
	}
	return res.json(); // { filename, data: "<base64 pdf>" }
};

// Merge PDFs — POST returns merged PDF as base64 inside JSON so IDM cannot intercept it
export const mergePdfs = async (files) => {
	const form = new FormData();
	files.forEach((f) => form.append("files", f));
	const token = localStorage.getItem(TOKEN_KEY);
	const headers = {};
	if (token) headers["Authorization"] = `Bearer ${token}`;
	const res = await fetch(`${baseURL}/api/mergepdf`, {
		method: "POST",
		headers,
		body: form,
	});
	if (!res.ok) {
		let detail = "Merge failed";
		try { const j = await res.json(); detail = j.detail || detail; } catch {}
		throw new Error(detail);
	}
	return res.json(); // { filename, data: "<base64 pdf>" }
};

export { TOKEN_KEY };

export default api;

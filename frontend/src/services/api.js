const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");
const authHeaders     = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });
const authHeadersOnly = () => ({ Authorization: `Bearer ${getToken()}` });

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const registerUser = async (name, email, password, signature) => {
  const res = await fetch(`${BASE}/users/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, signature }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const loginUser = async (email, password) => {
  const res = await fetch(`${BASE}/users/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const getGoogleAuthUrl = () => `${BASE}/users/auth/google`;

// ─── Profile ─────────────────────────────────────────────────────────────────
export const getProfile = async () => {
  const res = await fetch(`${BASE}/users/profile`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const updateProfile = async (payload) => {
  const res = await fetch(`${BASE}/users/profile`, {
    method: "PUT", headers: authHeaders(), body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await fetch(`${BASE}/users/avatar`, {
    method: "POST", headers: authHeadersOnly(), body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const changePassword = async (oldPassword, newPassword) => {
  const res = await fetch(`${BASE}/users/change-password`, {
    method: "PUT", headers: authHeaders(), body: JSON.stringify({ oldPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

// Set mood override (moodOverride: bool, dramaMood: optional string)
export const setMoodOverride = async (moodOverride, dramaMood) => {
  const res = await fetch(`${BASE}/users/mood-override`, {
    method: "PUT", headers: authHeaders(),
    body: JSON.stringify({ moodOverride, ...(dramaMood ? { dramaMood } : {}) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

// ─── File Upload ──────────────────────────────────────────────────────────────
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE}/upload`, {
    method: "POST", headers: authHeadersOnly(), body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data; // { fileId, filename, originalName, mimetype, size, url }
};

export const deleteFile = async (filename) => {
  const res = await fetch(`${BASE}/upload/${filename}`, {
    method: "DELETE", headers: authHeaders(),
  });
  return res.json();
};

/**
 * Fetch a protected file and return an authenticated object URL.
 * Use this wherever you need to display or download a file attachment.
 * Always call URL.revokeObjectURL(result) when done to avoid memory leaks.
 */
export const fetchFileObjectUrl = async (filename) => {
  const res = await fetch(`${BASE}/upload/${encodeURIComponent(filename)}`, {
    headers: authHeadersOnly(),
  });
  if (!res.ok) throw new Error("Could not load file.");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const fetchTasks = async (params = {}) => {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/tasks?${q}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const fetchStats = async () => {
  const res = await fetch(`${BASE}/tasks/stats/summary`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const fetchCalendar = async (month, year) => {
  const q = new URLSearchParams({ month, year }).toString();
  const res = await fetch(`${BASE}/tasks/calendar?${q}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const fetchDramaTrend = async (days = 30) => {
  const res = await fetch(`${BASE}/tasks/analytics/drama-trend?days=${days}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const createTask = async (payload) => {
  const res = await fetch(`${BASE}/tasks`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const updateTask = async (id, payload) => {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: "PUT", headers: authHeaders(), body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const deleteTask = async (id) => {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: "DELETE", headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const fetchCategories = async () => {
  const res = await fetch(`${BASE}/categories`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const createCategory = async (payload) => {
  const res = await fetch(`${BASE}/categories`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const deleteCategory = async (id) => {
  const res = await fetch(`${BASE}/categories/${id}`, {
    method: "DELETE", headers: authHeaders(),
  });
  return res.json();
};

// ─── Notifications ─────────────────────────────────────────────────────────────
export const fetchNotifications = async () => {
  const res = await fetch(`${BASE}/notifications`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const markAllRead = async () => {
  const res = await fetch(`${BASE}/notifications/read-all`, { method: "PUT", headers: authHeaders() });
  return res.json();
};

export const clearNotifications = async () => {
  const res = await fetch(`${BASE}/notifications`, { method: "DELETE", headers: authHeaders() });
  return res.json();
};

// ─── AI ───────────────────────────────────────────────────────────────────────
export const generateStory = async () => {
  const res = await fetch(`${BASE}/ai/story`, { method: "POST", headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const generateReaction = async (taskTitle, dramaLevel) => {
  const res = await fetch(`${BASE}/ai/reaction`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify({ taskTitle, dramaLevel }),
  });
  const data = await res.json();
  if (!res.ok) return { reaction: "INCREDIBLE! Another crisis conquered!" };
  return data;
};

const BASE = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// Auth
export const registerUser = async (name, email, password) => {
  const res = await fetch(`${BASE}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const loginUser = async (email, password) => {
  const res = await fetch(`${BASE}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const updateProfile = async (payload) => {
  const res = await fetch(`${BASE}/users/profile`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

// Tasks
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

export const createTask = async (payload) => {
  const res = await fetch(`${BASE}/tasks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const updateTask = async (id, payload) => {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const deleteTask = async (id) => {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

// Categories
export const fetchCategories = async () => {
  const res = await fetch(`${BASE}/categories`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const createCategory = async (payload) => {
  const res = await fetch(`${BASE}/categories`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const deleteCategory = async (id) => {
  const res = await fetch(`${BASE}/categories/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

// Notifications
export const fetchNotifications = async () => {
  const res = await fetch(`${BASE}/notifications`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

export const markAllRead = async () => {
  const res = await fetch(`${BASE}/notifications/read-all`, {
    method: "PUT",
    headers: authHeaders(),
  });
  return res.json();
};

export const clearNotifications = async () => {
  const res = await fetch(`${BASE}/notifications`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
};

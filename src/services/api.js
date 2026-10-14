// src/services/api.js
import { API_URL } from "../config";

// 🔐 Autenticación
export async function loginUser(email, password) {
  const res = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

export async function registerUser(fullName, email, password) {
  const res = await fetch(`${API_URL}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, password })
  });
  return res.json();
}

export async function forgotPassword(email) {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  return res.json();
}

export async function resetPassword(token, newPassword) {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword })
  });
  return res.json();
}

// 🎵 Audios
export async function getAudios(token) {
  const res = await fetch(`${API_URL}/audios`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function generateAudio(token, file, idioma, categoria) {
  const formData = new FormData();
  formData.append("document", file);
  formData.append("language", idioma);
  formData.append("category", categoria);

  const res = await fetch(`${API_URL}/audios/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  return res.json();
}
// 👤 Perfil
export async function getAudiosCount(token) {
  const res = await fetch(`${API_URL}/audios`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

export async function updateUserName(token, fullName) {
  const res = await fetch(`${API_URL}/users/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ fullName })
  });
  return res.json();
}

export async function changePassword(token, currentPassword, newPassword) {
  const res = await fetch(`${API_URL}/users/change-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  return res.json();
}

export async function uploadProfilePhoto(token, file) {
  const formData = new FormData();
  formData.append("photo", file);

  const res = await fetch(`${API_URL}/users/photo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  return res.json();
}

import { API_URL } from "../config";

const json = { "Content-Type": "application/json" };
const auth = (token) => ({ Authorization: `Bearer ${token}` });

// 🔐 Autenticación
export async function loginUser(email, password) {
  const res = await fetch(`${API_URL}/users/login`, { method: "POST", headers: json, body: JSON.stringify({ email, password }) });
  return res.json();
}
export async function registerUser(fullName, email, password) {
  const res = await fetch(`${API_URL}/users/register`, { method: "POST", headers: json, body: JSON.stringify({ fullName, email, password }) });
  return res.json();
}
export async function forgotPassword(email) {
  const res = await fetch(`${API_URL}/auth/forgot-password`, { method: "POST", headers: json, body: JSON.stringify({ email }) });
  return res.json();
}
export async function resetPassword(token, newPassword) {
  const res = await fetch(`${API_URL}/auth/reset-password`, { method: "POST", headers: json, body: JSON.stringify({ token, newPassword }) });
  return res.json();
}

// 🎵 Audios
export async function getAudios(token) {
  const res = await fetch(`${API_URL}/audios`, { headers: auth(token) });
  return res.json();
}
// ✅ Ahora recibe y envía "modo" (antes se ignoraba)
export async function generateAudio(token, file, idioma, categoria, modo = "resumen") {
  const formData = new FormData();
  formData.append("document", file);
  formData.append("language", idioma);
  formData.append("category", categoria);
  formData.append("modo", modo);
  const res = await fetch(`${API_URL}/audios/generate`, { method: "POST", headers: auth(token), body: formData });
  return res.json();
}
export function downloadAudio(token, audioId) {
  window.location.href = `${API_URL}/audios/download/${audioId}?token=${token}`;
}
export async function deleteAudio(token, audioId) {
  const res = await fetch(`${API_URL}/audios/${audioId}`, { method: "DELETE", headers: auth(token) });
  return res.json();
}
export async function updateAudioName(token, audioId, fileName) {
  const res = await fetch(`${API_URL}/audios/${audioId}`, { method: "PUT", headers: { ...json, ...auth(token) }, body: JSON.stringify({ fileName }) });
  return res.json();
}

// 👤 Perfil
export async function getAudiosCount(token) {
  return getAudios(token);
}
export async function updateUserName(token, fullName) {
  const res = await fetch(`${API_URL}/users/update`, { method: "PUT", headers: { ...json, ...auth(token) }, body: JSON.stringify({ fullName }) });
  return res.json();
}
export async function changePassword(token, currentPassword, newPassword) {
  const res = await fetch(`${API_URL}/users/change-password`, { method: "PUT", headers: { ...json, ...auth(token) }, body: JSON.stringify({ currentPassword, newPassword }) });
  return res.json();
}
export async function uploadProfilePhoto(token, file) {
  const formData = new FormData();
  formData.append("photo", file);
  const res = await fetch(`${API_URL}/users/photo`, { method: "POST", headers: auth(token), body: formData });
  return res.json();
}
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const User = require('../models/user');
const cloudinary = require('../config/cloudinary');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  const email = value.trim();
  if (!email || email.length > 254 || /\s/.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  if (!/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(local)) return false;
  const labels = domain.split('.');
  if (labels.length < 2 || labels.some((label) => !label || label.length > 63 || !/^[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?$/i.test(label))) return false;
  return /^[A-Z]{2,}$/i.test(labels[labels.length - 1]);
}

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body || {};
    if (!fullName?.trim() || !email || !password) return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    if (!isValidEmail(email)) return res.status(400).json({ message: 'Ingresa un correo válido, por ejemplo nombre@dominio.com.' });
    if (password.length < 8) return res.status(400).json({ message: 'La contraseña debe tener mínimo 8 caracteres.' });

    const emailNormalized = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: emailNormalized });
    if (existingUser) return res.status(409).json({ message: 'Ya existe una cuenta con ese correo.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ fullName: fullName.trim(), email: emailNormalized, password: hashedPassword });
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    return res.status(201).json({
      message: 'Usuario registrado correctamente.',
      token,
      user: { id: newUser._id, fullName: newUser.fullName, email: newUser.email, profilePhoto: newUser.profilePhoto || '' },
    });
  } catch (error) {
    console.error('Error registrando usuario:', error.message);
    return res.status(500).json({ message: 'Error al registrar usuario.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Credenciales inválidas.' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    return res.json({
      message: 'Inicio de sesión exitoso.', token,
      user: { id: user._id, fullName: user.fullName, email: user.email, profilePhoto: user.profilePhoto || '' },
    });
  } catch (error) {
    console.error('Error iniciando sesión:', error.message);
    return res.status(500).json({ message: 'Error al iniciar sesión.' });
  }
});

router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { fullName } = req.body || {};
    if (!fullName?.trim()) return res.status(400).json({ message: 'El nombre completo es obligatorio.' });
    const updatedUser = await User.findByIdAndUpdate(req.userId, { fullName: fullName.trim() }, { new: true });
    if (!updatedUser) return res.status(404).json({ message: 'Usuario no encontrado.' });
    return res.json({ message: 'Perfil actualizado correctamente.', user: { id: updatedUser._id, fullName: updatedUser.fullName, email: updatedUser.email, profilePhoto: updatedUser.profilePhoto || '' } });
  } catch (error) {
    console.error('Error actualizando usuario:', error.message);
    return res.status(500).json({ message: 'Error al actualizar perfil.' });
  }
});

router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword || newPassword.length < 8) return res.status(400).json({ message: 'Contraseña actual y nueva inválidas.' });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    if (!(await bcrypt.compare(currentPassword, user.password))) return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('Error cambiando contraseña:', error.message);
    return res.status(500).json({ message: 'Error al cambiar contraseña.' });
  }
});

router.post('/photo', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    let photoValue;
    if (req.file) {
      const dataURI = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const uploaded = await cloudinary.uploader.upload(dataURI, { folder: 'eduaudio_profiles', resource_type: 'image' });
      photoValue = uploaded.secure_url;
    } else photoValue = req.body?.photo || req.body?.image || req.body?.profilePhoto || null;
    if (!photoValue) return res.status(400).json({ message: 'La foto es obligatoria.' });
    const user = await User.findByIdAndUpdate(req.userId, { profilePhoto: photoValue }, { new: true });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    return res.json({ message: 'Foto de perfil actualizada.', photoUrl: user.profilePhoto, user: { id: user._id, fullName: user.fullName, email: user.email, profilePhoto: user.profilePhoto || '' } });
  } catch (error) {
    console.error('Error actualizando foto de perfil:', error.message);
    return res.status(500).json({ message: 'Error al actualizar foto.' });
  }
});

router.delete('/delete-account', authMiddleware, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.userId);
    if (!deletedUser) return res.status(404).json({ message: 'Usuario no encontrado.' });
    return res.json({ message: 'Cuenta eliminada correctamente.' });
  } catch (error) {
    console.error('Error eliminando cuenta:', error.message);
    return res.status(500).json({ message: 'Error al eliminar cuenta.' });
  }
});

module.exports = router;

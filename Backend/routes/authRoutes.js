const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/user');

const router = express.Router();

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Debes proporcionar un correo válido.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No existe una cuenta con ese correo.' });
    }

    const secret = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign({ id: user._id, purpose: 'reset' }, secret, { expiresIn: '1h' });
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return res.json({
        message: 'Correo enviado exitosamente.',
        devMode: true,
        resetLink,
      });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"EduAudio IA" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: 'Recuperar contraseña - EduAudio IA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #4A3F8F;">🎧 EduAudio IA</h2>
          <p>Hola <strong>${user.fullName}</strong>,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <p>Haz clic en el botón para continuar:</p>
          <a href="${resetLink}" style="display:inline-block;background:#F5A623;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Restablecer contraseña</a>
          <p style="color:#888;font-size:13px;">Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.</p>
        </div>
      `,
    });

    return res.json({ message: 'Correo enviado exitosamente.' });
  } catch (error) {
    console.error('Error enviando correo:', error.message);
    return res.status(500).json({ message: 'Error al enviar el correo.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};

    if (!token) {
      return res.status(400).json({ message: 'El enlace para restablecer la contraseña es inválido o ha expirado.' });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener mínimo 8 caracteres.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    if (decoded.purpose !== 'reset') {
      return res.status(400).json({ message: 'Token inválido para restablecer la contraseña.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });

    return res.json({ message: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    console.error('Error en reset-password:', error.message);
    return res.status(400).json({ message: 'Token inválido o expirado.' });
  }
});

module.exports = router;

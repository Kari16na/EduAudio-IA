const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const axios = require('axios');

router.post('/forgot-password', async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT no configurado.' });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No existe una cuenta con ese correo.' });
    }

    const token = jwt.sign({ id: user._id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const linkRecuperacion = `${frontend}/reset-password?token=${token}`;

    if (!process.env.BREVO_API_KEY) {
      return res.status(503).json({ message: 'La recuperación por correo no está configurada en este servidor.' });
    }

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: 'EduAudio IA', email: process.env.BREVO_SENDER || 'no-reply@eduaudio.com' },
      to: [{ email }],
      subject: 'Recuperar contraseña - EduAudio IA',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #4A3F8F;">🎧 EduAudio IA</h2>
          <p>Hola <strong>${user.fullName}</strong>,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <p>Haz clic en el botón para continuar:</p>
          <a href="${linkRecuperacion}"
            style="background:#F5A623;color:white;padding:12px 24px;
            border-radius:8px;text-decoration:none;font-weight:bold;
            display:inline-block;margin:16px 0;">
            Restablecer contraseña
          </a>
          <p style="color:#888;font-size:13px;">
            Este enlace expira en 1 hora. Si no solicitaste esto, ignora este correo.
          </p>
        </div>
      `
    }, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    res.json({ message: 'Correo enviado exitosamente.' });
  } catch (error) {
    console.error('Error enviando correo:', error.message);
    res.status(500).json({ message: 'Error al enviar el correo.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT no configurado.' });
    }

    const { token, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener mínimo 8 caracteres.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== 'reset') throw new Error('Token no válido para restablecer');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });
    res.json({ message: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    console.error('Error en reset-password:', error.message);
    res.status(400).json({ message: 'Token inválido o expirado.' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

// Configurar el transportador de email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Enviar correo de recuperación
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No existe una cuenta con ese correo.' });
    }

    // Crear token temporal de 1 hora
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const linkRecuperacion = `http://localhost:5173/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"EduAudio IA" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Recuperar contraseña - EduAudio IA',
      html: `
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
    });

    res.json({ message: 'Correo enviado exitosamente.' });

  } catch (error) {
    console.error('Error enviando correo:', error.message);
    res.status(500).json({ message: 'Error al enviar el correo.' });
  }
});

// Restablecer contraseña
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(decoded.id, { password: hashedPassword });
    res.json({ message: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    res.status(400).json({ message: 'Token inválido o expirado.' });
  }
});

module.exports = router;
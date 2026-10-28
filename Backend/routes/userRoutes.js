const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const User = require('../models/user');
const cloudinary = require('../config/cloudinary');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configurar multer en memoria para recibir archivos de imagen del perfil
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
});

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body || {};

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener mínimo 8 caracteres.' });
    }

    const emailNormalized = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: emailNormalized });
    if (existingUser) {
      return res.status(409).json({ message: 'Ya existe una cuenta con ese correo.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      fullName: fullName.trim(),
      email: emailNormalized,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

    return res.status(201).json({
      message: 'Usuario registrado correctamente.',
      token,
      user: { 
        id: newUser._id, 
        fullName: newUser.fullName, 
        email: newUser.email, 
        profilePhoto: newUser.profilePhoto || '' 
      },
    });
  } catch (error) {
    console.error('Error registrando usuario:', error.message);
    return res.status(500).json({ message: 'Error al registrar usuario.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

    return res.json({
      message: 'Inicio de sesión exitoso.',
      token,
      user: { 
        id: user._id, 
        fullName: user.fullName, 
        email: user.email, 
        profilePhoto: user.profilePhoto || '' 
      },
    });
  } catch (error) {
    console.error('Error iniciando sesión:', error.message);
    return res.status(500).json({ message: 'Error al iniciar sesión.' });
  }
});

router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { fullName } = req.body || {};
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ message: 'El nombre completo es obligatorio.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { fullName: fullName.trim() },
      { new: true }
    );

    return res.json({
      message: 'Perfil actualizado correctamente.',
      user: { 
        id: updatedUser._id, 
        fullName: updatedUser.fullName, 
        email: updatedUser.email, 
        profilePhoto: updatedUser.profilePhoto || '' 
      },
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error.message);
    return res.status(500).json({ message: 'Error al actualizar perfil.' });
  }
});

router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Contraseña actual y nueva inválidas.' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('Error cambiando contraseña:', error.message);
    return res.status(500).json({ message: 'Error al cambiar contraseña.' });
  }
});

// Ruta flexible para aceptar archivo (FormData) o JSON con URL/Base64
router.post('/photo', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    let photoValue = null;

    // Si el frontend envió un archivo mediante FormData
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      let dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        folder: 'eduaudio_profiles',
        resource_type: 'image',
      });
      photoValue = uploadResponse.secure_url;
    } else {
      // Si el frontend envió un JSON con la URL o texto en base64
      photoValue = req.body?.photo || req.body?.image || req.body?.profilePhoto || (typeof req.body === 'string' ? req.body : null);
    }

    if (!photoValue) {
      return res.status(400).json({ message: 'La foto es obligatoria.' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId, 
      { profilePhoto: photoValue }, 
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    return res.json({ 
      message: 'Foto de perfil actualizada.', 
      photoUrl: user.profilePhoto,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePhoto: user.profilePhoto || ''
      }
    });
  } catch (error) {
    console.error('Error actualizando foto de perfil:', error.message);
    return res.status(500).json({ message: `Error al actualizar foto: ${error.message}` });
  }
});

router.delete('/delete-account', authMiddleware, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    return res.json({ message: 'Cuenta eliminada correctamente.' });
  } catch (error) {
    console.error('Error eliminando cuenta:', error.message);
    return res.status(500).json({ message: 'Error al eliminar cuenta.' });
  }
});

module.exports = router;

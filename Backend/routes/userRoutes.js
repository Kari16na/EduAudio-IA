const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const upload = multer({ storage: multer.memoryStorage() });

// Registro
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullName, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, profilePhoto: user.profilePhoto || "" }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar perfil (nombre)
router.put('/update', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token requerido" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { fullName } = req.body;

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { fullName },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    res.json({ message: "Usuario actualizado", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cambiar contraseña
router.put('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token requerido" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Faltan datos requeridos." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "La nueva contraseña debe tener mínimo 8 caracteres." });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "La contraseña actual es incorrecta." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Contraseña actualizada correctamente." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Subir / actualizar foto de perfil
router.post('/photo', upload.single('photo'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token requerido" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!req.file) {
      return res.status(400).json({ message: "Debes subir una imagen." });
    }

    const publicPath = path.join(__dirname, '../public');
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath);
    }

    // Eliminar foto anterior si existe y es un archivo local propio
    const userActual = await User.findById(decoded.id);
    if (userActual?.profilePhoto?.includes('/public/')) {
      const rutaAnterior = path.join(publicPath, path.basename(userActual.profilePhoto));
      if (fs.existsSync(rutaAnterior)) {
        fs.unlinkSync(rutaAnterior);
      }
    }

    const extension = path.extname(req.file.originalname) || '.jpg';
    const photoFileName = `photo_${decoded.id}_${Date.now()}${extension}`;
    const photoPath = path.join(publicPath, photoFileName);

    fs.writeFileSync(photoPath, req.file.buffer);

    const photoUrl = `${req.protocol}://${req.get('host')}/public/${photoFileName}`;

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { profilePhoto: photoUrl },
      { new: true }
    );

    res.json({ message: "Foto actualizada correctamente.", photoUrl, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
      user: { id: user._id, fullName: user.fullName, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Actualizar perfil
router.put('/update', async (req, res) => {
  try {
    // Obtener token del header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token requerido" });

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extraer datos del body
    const { fullName } = req.body;

    // Actualizar usuario en la BD
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

module.exports = router;

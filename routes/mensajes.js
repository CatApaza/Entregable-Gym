const express = require('express');
const router = express.Router();
const Mensaje = require('../models/Mensaje');

router.post('/', async (req, res) => {
  try {
    const mensaje = new Mensaje(req.body);
    await mensaje.save();
    res.status(201).json(mensaje);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const mensajes = await Mensaje.find().populate('remitenteId destinatarioId');
  res.json(mensajes);
});

module.exports = router;

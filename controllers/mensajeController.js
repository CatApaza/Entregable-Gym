const Mensaje = require('../models/Mensaje');

exports.enviarMensaje = async (req, res) => {
  try {
    const mensaje = new Mensaje(req.body);
    await mensaje.save();
    res.status(201).json(mensaje);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.obtenerMensajes = async (req, res) => {
  try {
    const mensajes = await Mensaje.find().populate('remitenteId destinatarioId');
    res.json(mensajes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
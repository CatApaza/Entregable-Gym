const jwt = require('jsonwebtoken');

exports.verificarToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: 'Acceso denegado, token requerido' });

  try {
    const decoded = jwt.verify(token, 'claveSecreta');
    req.usuarioId = decoded.id; 
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};
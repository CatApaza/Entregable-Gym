const express = require('express');
const EntrenadorService = require('../services/entrenadorService');
const ClienteService = require('../services/clienteService');

exports.obtenerEntrenador = async (req, res) => {
  try {
      const entrenador = await EntrenadorService.obtenerEntrenadorPorUsuario(req.user.id);
      if (!entrenador) {
        return res.status(404).json({ error:'Entrenador no encontrado' })
      }
      res.json(entrenador);
  } catch (error) {
      console.error('Error al obtener los datos del entrenador:', error.message);
      res.status(500).json({ error: 'Error del servidor' });
  }
}


exports.actualizarEntrenador = async (req, res) => {
  try {
      const usuarioId = req.user.id;
      const datosActualizados = req.body;

      const entrenadorActualizado = await EntrenadorService.actualizarEntrenador(usuarioId, datosActualizados);
      
      if(!entrenadorActualizado){
        return res.status(404).json({ error:'Entrenador no encontrado' });
      }

      res.json({ mensaje: 'Datos del entrenador actualizados correctamente'})

  } catch (error) {
      console.error('Error al actualizar los datos del entrenador:', error.message);
      res.status(500).json({ error: 'Error del servidor' });
  }
};

// Obtener los clientes asociados a un entrenador
exports.obtenerClientesDelEntrenador = async (req, res) => {
  try {
      // Obtener el ID del entrenador desde la sesión o parámetros
      const entrenadorId = req.params.entrenadorId || (req.user && req.user.id);
      
      if (!entrenadorId) {
          return res.status(400).json({ error: 'ID de entrenador no proporcionado' });
      }
      
      console.log(`Obteniendo clientes para el entrenador ${entrenadorId}`);
      
      // Primero obtenemos el entrenador por el ID de usuario
      const entrenador = await EntrenadorService.obtenerEntrenadorPorUsuario(entrenadorId);
      if (!entrenador) {
          return res.status(404).json({ error: 'Entrenador no encontrado' });
      }
      
      // Obtener los clientes asignados al entrenador
      const clientes = await ClienteService.obtenerClientesPorEntrenador(entrenador._id);
      
      res.json(clientes);
  } catch (error) {
      console.error('Error al obtener clientes del entrenador:', error.message);
      res.status(500).json({ error: 'Error del servidor' });
  }
};

// Asignar un cliente a un entrenador
exports.asignarClienteAEntrenador = async (req, res) => {
  try {
      const { clienteId } = req.body;
      const entrenadorId = req.params.entrenadorId || (req.user && req.user.id);
      
      if (!entrenadorId) {
          return res.status(400).json({ error: 'ID de entrenador no proporcionado' });
      }
      
      if (!clienteId) {
          return res.status(400).json({ error: 'ID de cliente no proporcionado' });
      }
      
      // Obtener el entrenador por el ID de usuario
      const entrenador = await EntrenadorService.obtenerEntrenadorPorUsuario(entrenadorId);
      if (!entrenador) {
          return res.status(404).json({ error: 'Entrenador no encontrado' });
      }
      
      // Asignar el cliente al entrenador
      const clienteActualizado = await ClienteService.asignarEntrenadorACliente(clienteId, entrenador._id);
      
      res.json({ mensaje: 'Cliente asignado correctamente', cliente: clienteActualizado });
  } catch (error) {
      console.error('Error al asignar cliente a entrenador:', error.message);
      res.status(500).json({ error: 'Error del servidor' });
  }
};

// Listar todos los entrenadores disponibles
exports.listarEntrenadores = async (req, res) => {
  try {
      const entrenadores = await EntrenadorService.obtenerAllEntrenador();
      
      // Poblar los datos de usuario para cada entrenador
      const entrenadoresConUsuarios = await Promise.all(
          entrenadores.map(async (entrenador) => {
              const entrenadorObj = entrenador.toObject();
              if (entrenadorObj.usuarioId) {
                  try {
                      const Usuario = require('../models/Usuario');
                      const usuario = await Usuario.findById(entrenadorObj.usuarioId);
                      if (usuario) {
                          // Eliminar información sensible
                          const usuarioObj = usuario.toObject();
                          delete usuarioObj.contrasenia;
                          entrenadorObj.usuario = usuarioObj;
                      }
                  } catch (err) {
                      console.error('Error al obtener usuario para entrenador:', err);
                  }
              }
              return entrenadorObj;
          })
      );
      
      res.json(entrenadoresConUsuarios);
  } catch (error) {
      console.error('Error al listar entrenadores:', error.message);
      res.status(500).json({ error: 'Error del servidor' });
  }
};
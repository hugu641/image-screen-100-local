const { fdb } = require('../database/db');
const { logEvent } = require('../services/socketService');

async function getSettings(req, res) {
  try {
    const settings = await fdb.getById('settings', 'config') || {};

    // Valeurs par défaut
    if (!settings.store_name) settings.store_name = 'Mon Magasin';
    if (!settings.default_duration) settings.default_duration = '5';
    if (!settings.logo) settings.logo = '';

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des paramètres.' });
  }
}

async function updateSettings(req, res) {
  const { store_name, default_duration, logo } = req.body;

  try {
    const updates = {};

    if (store_name !== undefined) updates.store_name = store_name;
    if (default_duration !== undefined) updates.default_duration = String(default_duration);
    if (logo !== undefined) updates.logo = logo;

    await fdb.set('settings', 'config', updates);
    await logEvent(null, 'info', 'Paramètres système mis à jour');

    res.json({ message: 'Paramètres enregistrés avec succès.' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: "Erreur lors de l'enregistrement des paramètres." });
  }
}

module.exports = {
  getSettings,
  updateSettings
};

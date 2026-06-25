const { fdb } = require('../database/db');

async function listEvents(req, res) {
  const limit = req.query.limit ? parseInt(req.query.limit) : 50;

  try {
    const events = await fdb.getAll(
      'events',
      [],
      { orderBy: 'timestamp', orderDir: 'desc', limit }
    );
    res.json(events);
  } catch (error) {
    console.error('List events error:', error);
    res.status(500).json({ error: 'Impossible de charger le journal des événements.' });
  }
}

module.exports = {
  listEvents
};

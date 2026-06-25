const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { fdb } = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'signage_super_secret_key_12345';

// Register New User
async function register(req, res) {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Veuillez saisir un email et un mot de passe.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
  }

  try {
    const existing = await fdb.getWhere('users', [{ field: 'email', value: email }]);
    if (existing) {
      return res.status(409).json({ error: 'Un compte avec cet email existe déjà.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newId = await fdb.add('users', {
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      role: 'user'
    });

    const token = jwt.sign({ userId: newId, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newId,
        email,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Une erreur est survenue lors de la création du compte.' });
  }
}

// Authenticate Administrator
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Veuillez saisir un email et un mot de passe.' });
  }

  try {
    const user = await fdb.getWhere('users', [{ field: 'email', value: email }]);
    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role || 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Une erreur est survenue lors de la connexion.' });
  }
}

// Get Current User Profile (via middleware)
async function me(req, res) {
  try {
    const user = await fdb.getById('users', req.user.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil.' });
  }
}

// Update Admin Password
async function updatePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Tous les champs sont requis.' });
  }

  try {
    const user = await fdb.getById('users', userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Le mot de passe actuel est incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await fdb.update('users', userId, { password: hashedPassword });

    res.json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du mot de passe.' });
  }
}

// Express JWT Auth Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Accès refusé. Aucun jeton fourni.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Jeton invalide ou expiré.' });
  }
}

module.exports = {
  register,
  login,
  me,
  updatePassword,
  authMiddleware
};

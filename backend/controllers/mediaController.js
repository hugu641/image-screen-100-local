const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { fdb } = require('../database/db');
const { compressImageBuffer } = require('../services/compressionService');
const { logEvent } = require('../services/socketService');

// ─── Multer : stockage en mémoire ───────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'video/mp4'
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non pris en charge. (JPG, PNG, WEBP, MP4 acceptés)'), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
}).array('files', 10);

// ─── Controller functions ─────────────────────────────────────────────────────

async function uploadMedia(req, res) {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier sélectionné.' });
    }

    const uploadedItems = [];

    try {
      // S'assurer que le dossier uploads existe
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      for (const file of req.files) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const filename = `file-${uniqueSuffix}${ext}`;

        let buffer = file.buffer;
        let size = file.size;

        // Compression en mémoire pour les images
        if (file.mimetype.startsWith('image/')) {
          const compressed = await compressImageBuffer(buffer, file.mimetype);
          if (compressed) {
            buffer = compressed;
            size = compressed.length;
          }
        }

        // Sauvegarder sur le disque local
        const uploadPath = path.join(uploadsDir, filename);
        await fs.promises.writeFile(uploadPath, buffer);

        // Enregistrer en SQLite (filepath = chemin relatif /uploads/...)
        const publicUrl = `/uploads/${filename}`;
        const mediaId = await fdb.add('media', {
          filename,
          original_name: file.originalname,
          mime_type: file.mimetype,
          size,
          filepath: publicUrl
        });

        const newMedia = await fdb.getById('media', mediaId);
        uploadedItems.push(newMedia);

        await logEvent(null, 'info', `Média ajouté : ${file.originalname}`);
      }

      res.status(201).json({
        message: `${uploadedItems.length} fichier(s) téléversé(s) avec succès.`,
        media: uploadedItems
      });
    } catch (storageError) {
      console.error('Storage upload error:', storageError);
      res.status(500).json({ error: "Une erreur est survenue lors de l'enregistrement des fichiers." });
    }
  });
}

async function listMedia(req, res) {
  const { search, sort } = req.query;

  try {
    let orderField = 'created_at';
    let orderDir = 'desc';

    if (sort === 'oldest') { orderField = 'created_at'; orderDir = 'asc'; }
    else if (sort === 'name_asc') { orderField = 'original_name'; orderDir = 'asc'; }
    else if (sort === 'name_desc') { orderField = 'original_name'; orderDir = 'desc'; }

    let mediaList = await fdb.getAll('media', [], { orderBy: orderField, orderDir });

    if (search) {
      const searchLower = search.toLowerCase();
      mediaList = mediaList.filter(m =>
        m.original_name && m.original_name.toLowerCase().includes(searchLower)
      );
    }

    res.json(mediaList);
  } catch (error) {
    console.error('List media error:', error);
    res.status(500).json({ error: 'Impossible de récupérer la bibliothèque de médias.' });
  }
}

async function deleteMedia(req, res) {
  const { id } = req.params;

  try {
    const media = await fdb.getById('media', id);
    if (!media) {
      return res.status(404).json({ error: 'Média introuvable.' });
    }

    // Supprimer du disque local
    const filePath = path.join(__dirname, '..', 'uploads', media.filename);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (fsErr) {
      console.warn(`[File System] Could not delete file ${media.filename}:`, fsErr.message);
    }

    // Supprimer de la base SQLite
    await fdb.delete('media', id);
    await logEvent(null, 'info', `Média supprimé : ${media.original_name}`);

    res.json({ message: 'Média supprimé avec succès.' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du média.' });
  }
}

async function renameMedia(req, res) {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Le nom ne peut pas être vide.' });
  }

  try {
    const media = await fdb.getById('media', id);
    if (!media) {
      return res.status(404).json({ error: 'Média introuvable.' });
    }

    const ext = path.extname(media.original_name);
    let newOriginalName = name;
    if (ext && !name.toLowerCase().endsWith(ext.toLowerCase())) {
      newOriginalName = name + ext;
    }

    await fdb.update('media', id, { original_name: newOriginalName });
    res.json({ message: 'Média renommé avec succès.', original_name: newOriginalName });
  } catch (error) {
    console.error('Rename media error:', error);
    res.status(500).json({ error: 'Erreur lors du renommage du média.' });
  }
}

module.exports = {
  uploadMedia,
  listMedia,
  deleteMedia,
  renameMedia
};

const Jimp = require('jimp');

/**
 * Compresse une image à partir d'un Buffer en mémoire.
 * @param {Buffer} inputBuffer - Buffer de l'image originale
 * @param {string} mimeType    - MIME type (ex: 'image/jpeg')
 * @returns {Promise<Buffer|null>} Buffer compressé, ou null si bypassed/échoué
 */
async function compressImageBuffer(inputBuffer, mimeType) {
  try {
    // Seuls JPEG et PNG sont compressés (WebP et BMP ignorés pour la sécurité)
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(mimeType)) {
      console.log(`[Compression] Bypassed for mime type: ${mimeType}`);
      return null;
    }

    const image = await Jimp.read(inputBuffer);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    const MAX_WIDTH = 1920;
    const MAX_HEIGHT = 1080;

    // Redimensionner si nécessaire
    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      const widthRatio = MAX_WIDTH / width;
      const heightRatio = MAX_HEIGHT / height;
      const ratio = Math.min(widthRatio, heightRatio);
      const newWidth = Math.round(width * ratio);
      const newHeight = Math.round(height * ratio);
      image.resize(newWidth, newHeight);
      console.log(`[Compression] Resized from ${width}x${height} to ${newWidth}x${newHeight}`);
    }

    image.quality(80); // Qualité 80%

    const outputBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    console.log(`[Compression] Done. Output size: ${(outputBuffer.length / 1024).toFixed(1)} KB`);
    return outputBuffer;
  } catch (error) {
    console.error(`[Compression] Failed, keeping original. Error:`, error.message);
    return null;
  }
}

module.exports = { compressImageBuffer };

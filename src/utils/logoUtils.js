/**
 * Logo upload validation and normalization for PDF branding.
 *
 * Phase 1 is in-memory only: a validated logo becomes a PNG data URL that is
 * used for the on-screen preview and handed to the PDF generator. Nothing is
 * uploaded or stored anywhere.
 */

export const LOGO_ACCEPT = 'image/png,image/jpeg,.png,.jpg,.jpeg';
export const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const MIN_WIDTH = 100;
const MIN_HEIGHT = 30;
const MAX_DIMENSION = 4000; // guards against decompression-bomb style images
const MIN_ASPECT = 0.25;    // tallest accepted shape (1:4)
const MAX_ASPECT = 8;       // widest accepted shape (8:1)
const OUTPUT_MAX_WIDTH = 800;
const OUTPUT_MAX_HEIGHT = 400;

export class LogoValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LogoValidationError';
  }
}

// Identify the real format from the file's leading bytes, not its name or MIME type.
function detectFormat(bytes) {
  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  if (isPng) return 'png';
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (isJpeg) return 'jpeg';
  return null;
}

function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode failed'));
    img.src = url;
  });
}

/**
 * Validate an uploaded logo and normalize it for the PDF.
 *
 * Returns { dataUrl, width, height, fileName }, where dataUrl is a flattened
 * (opaque, white background) PNG scaled down if necessary. Re-drawing through a
 * canvas also strips metadata and any embedded payload from the original file.
 * Throws LogoValidationError with a user-facing message when the file is rejected.
 */
export async function validateAndNormalizeLogo(file) {
  if (!file) throw new LogoValidationError('Please choose a logo file.');

  if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)) {
    throw new LogoValidationError('SVG logos are not supported. Please upload a PNG or JPG.');
  }

  if (file.size === 0) {
    throw new LogoValidationError('That file is empty. Please choose a PNG or JPG logo.');
  }
  if (file.size > LOGO_MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    throw new LogoValidationError(`That logo is ${mb} MB. The maximum size is ${LOGO_MAX_BYTES / (1024 * 1024)} MB.`);
  }

  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!detectFormat(head)) {
    throw new LogoValidationError('Unsupported file type. Please upload a PNG or JPG.');
  }

  const url = URL.createObjectURL(file);
  try {
    let img;
    try {
      img = await loadImageElement(url);
    } catch {
      throw new LogoValidationError('That file could not be read as an image. Please try a different PNG or JPG.');
    }

    const w = img.naturalWidth;
    const h = img.naturalHeight;

    if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
      throw new LogoValidationError(`That image is too large (${w}×${h}px). Maximum is ${MAX_DIMENSION}×${MAX_DIMENSION}px.`);
    }
    if (w < MIN_WIDTH || h < MIN_HEIGHT) {
      throw new LogoValidationError(`That image is too small (${w}×${h}px). Minimum is ${MIN_WIDTH}×${MIN_HEIGHT}px.`);
    }
    const aspect = w / h;
    if (aspect > MAX_ASPECT || aspect < MIN_ASPECT) {
      throw new LogoValidationError('That image is too narrow or too wide to use as a logo. Please use a more standard shape.');
    }

    const scale = Math.min(1, OUTPUT_MAX_WIDTH / w, OUTPUT_MAX_HEIGHT / h);
    const outW = Math.max(1, Math.round(w * scale));
    const outH = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new LogoValidationError('That file could not be processed. Please try a different PNG or JPG.');
    }
    // Flatten transparency onto white so transparent or dark logos stay readable on the PDF plate.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outW, outH);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, outW, outH);

    return { dataUrl: canvas.toDataURL('image/png'), width: outW, height: outH, fileName: file.name };
  } finally {
    // The object URL only exists for the duration of validation, so nothing can leak.
    URL.revokeObjectURL(url);
  }
}

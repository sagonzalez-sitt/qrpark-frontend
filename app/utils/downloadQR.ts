/**
 * Convierte un data URL (base64) a un Blob.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/**
 * Detecta si el dispositivo es iOS (iPhone, iPad, iPod).
 */
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Smart download: en iOS usa Web Share API para permitir guardar a galeria,
 * en Android/desktop usa descarga directa.
 */
export async function smartDownloadQR(dataUrl: string, fileName: string): Promise<void> {
  const blob = dataUrlToBlob(dataUrl);
  const file = new File([blob], fileName, { type: 'image/png' });

  if (isIOS() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'QR de Parqueadero',
      });
      return;
    } catch (err) {
      // Si el usuario cancela el share, no hacemos fallback
      if (err instanceof Error && err.name === 'AbortError') return;
      // Cualquier otro error, fallback a descarga normal
    }
  }

  // Fallback: descarga directa (Android, desktop, o si Share API falla)
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

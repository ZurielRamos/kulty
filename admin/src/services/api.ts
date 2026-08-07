import { config } from '../config';
import type { Orientation } from '../types';

/**
 * Sube la imagen al backend que hace todo el proceso
 */
export async function uploadProduct(blob: Blob, orientation: Orientation) {
  const formData = new FormData();
  formData.append('file', blob, 'art.jpg');
  formData.append('orientation', orientation);

  const response = await fetch(`${config.apiUrl}/api/products/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Error al crear producto');
  }

  return response.json();
}

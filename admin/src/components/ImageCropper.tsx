import { useRef, useState, useCallback, useEffect } from 'react';
import Cropper from 'react-cropper';
import type { ReactCropperElement } from 'react-cropper';
import type { Orientation } from '../types';

interface ImageCropperProps {
  onUpload: (blob: Blob, base64: string, orientation: Orientation) => void;
  isProcessing: boolean;
}

export function ImageCropper({ onUpload, isProcessing }: ImageCropperProps) {
  const cropperRef = useRef<ReactCropperElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<Orientation>('vertical');

  const aspectRatio = orientation === 'vertical' ? 7 / 10 : 10 / 7;

  // Escape limpia el crop, Enter sube
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && imageSrc) {
        setImageSrc(null);
        setOrientation('vertical');
      }
      if (e.key === 'Enter' && imageSrc && !isProcessing) {
        e.preventDefault();
        handleUpload();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageSrc, isProcessing]);

  // Detectar orientación automáticamente según dimensiones de la imagen
  const detectOrientation = useCallback((dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const detected: Orientation = img.width >= img.height ? 'horizontal' : 'vertical';
      setOrientation(detected);
      setImageSrc(dataUrl);
    };
    img.src = dataUrl;
  }, []);

  // Manejar pegado desde clipboard
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => detectOrientation(reader.result as string);
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  }, [detectOrientation]);

  // Cambiar orientación manualmente
  const handleOrientationChange = (newOrientation: Orientation) => {
    setOrientation(newOrientation);
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      const newRatio = newOrientation === 'vertical' ? 7 / 10 : 10 / 7;
      cropper.setAspectRatio(newRatio);
    }
  };

  // Recortar y enviar
  const handleUpload = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({
      width: orientation === 'vertical' ? 2100 : 3000,
      height: orientation === 'vertical' ? 3000 : 2100,
    });

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        onUpload(blob, base64, orientation);
      },
      'image/jpeg',
      0.9,
    );
  };

  return (
    <div className="space-y-4" onPaste={handlePaste} tabIndex={0}>
      {!imageSrc ? (
        <div
          ref={(el) => el?.focus()}
          className="border-2 border-dashed border-gray-400 rounded-lg p-16 text-center text-gray-500 cursor-pointer focus:border-blue-500 focus:outline-none"
          tabIndex={0}
          onPaste={handlePaste}
        >
          <p className="text-lg font-medium">Pega una imagen aquí</p>
          <p className="text-sm mt-2">Cmd+V desde el portapapeles</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Orientación autodetectada, editable */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Orientación:</span>
            <button
              onClick={() => handleOrientationChange('vertical')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                orientation === 'vertical'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Vertical (7:10)
            </button>
            <button
              onClick={() => handleOrientationChange('horizontal')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                orientation === 'horizontal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Horizontal (10:7)
            </button>
          </div>

          <Cropper
            ref={cropperRef}
            src={imageSrc}
            style={{ height: 500, width: '100%' }}
            aspectRatio={aspectRatio}
            guides={true}
            viewMode={1}
            responsive={true}
            autoCropArea={1}
            background={false}
          />

          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={isProcessing}
              className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isProcessing ? 'Procesando...' : 'Subir'}
            </button>
            <button
              onClick={() => { setImageSrc(null); setOrientation('vertical'); }}
              disabled={isProcessing}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded font-medium hover:bg-gray-400 disabled:opacity-50 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

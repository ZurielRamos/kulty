import type { ProductData } from '../types';

interface ProductPreviewProps {
  product: ProductData;
  onConfirm: () => void;
  onDiscard: () => void;
  isLoading: boolean;
}

export function ProductPreview({
  product,
  onConfirm,
  onDiscard,
  isLoading,
}: ProductPreviewProps) {
  return (
    <div className="border rounded-lg p-6 space-y-4 bg-white shadow">
      <h2 className="text-xl font-bold">Vista previa del producto</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Arte</p>
          <img
            src={product.artImage}
            alt="Arte"
            className="rounded border w-full object-cover"
          />
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Mockup</p>
          <img
            src={product.mockupImage}
            alt="Mockup"
            className="rounded border w-full object-cover"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-sm text-gray-500">Título:</span>
          <p className="font-medium">{product.title}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">Descripción:</span>
          <p>{product.description}</p>
        </div>
        <div className="flex gap-4">
          <div>
            <span className="text-sm text-gray-500">Categoría:</span>
            <p className="font-medium capitalize">{product.category}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Estilo:</span>
            <p className="font-medium capitalize">{product.style.replace('_', ' ')}</p>
          </div>
        </div>
        <div>
          <span className="text-sm text-gray-500">Texto para embedding:</span>
          <p className="text-sm text-gray-700 italic">{product.embeddingText}</p>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Guardando...' : 'Guardar producto'}
        </button>
        <button
          onClick={onDiscard}
          disabled={isLoading}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded font-medium hover:bg-gray-400 disabled:opacity-50 transition-colors"
        >
          Descartar
        </button>
      </div>
    </div>
  );
}

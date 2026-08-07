import { useEffect, useState, useRef } from 'react';
import { config } from '../config';
import { CATEGORIES } from '../types';
import { ImageCropper } from '../components/ImageCropper';
import { uploadProduct } from '../services/api';
import type { Orientation } from '../types';

interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  style: string;
  orientation: string;
  gallery: string[];
  isActive: boolean;
  createdAt: string;
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [batch, setBatch] = useState<any>(null);
  const batchFileRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async (category?: string, signal?: AbortSignal) => {
    setLoading(true);
    const params = category ? `?category=${category}` : '';
    try {
      const res = await fetch(`${config.apiUrl}/api/products${params}`, { signal });
      const data = await res.json();
      setProducts(data);
    } catch (e: any) {
      if (e.name !== 'AbortError') throw e;
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      fetchProducts(selectedCategory || undefined);
      return;
    }
    setLoading(true);
    const res = await fetch(
      `${config.apiUrl}/api/products/search?q=${encodeURIComponent(search)}&limit=20`,
    );
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(selectedCategory || undefined, controller.signal);
    return () => controller.abort();
  }, [selectedCategory]);

  // Polling del batch activo
  useEffect(() => {
    const checkBatch = async () => {
      try {
        const res = await fetch(`${config.apiUrl}/api/batch/active`);
        const data = await res.json();
        setBatch(data);
      } catch {}
    };
    checkBatch();
    const interval = setInterval(checkBatch, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${config.apiUrl}/api/batch/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setBatch(data);
    } catch {}

    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
        <div className="flex items-center gap-3">
          {/* Batch progress indicator */}
          {batch && (batch.status === 'processing' || batch.status === 'pending') && (
            <div className="relative group">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-blue-700 font-medium">
                  {batch.processed}/{batch.total}
                </span>
              </div>
              {/* Tooltip detalle */}
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <p className="text-sm font-medium text-gray-800 mb-2">Creación en lote</p>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>Procesados: {batch.processed}/{batch.total}</p>
                  <p>Fallidos: {batch.failed}</p>
                  {batch.currentFile && <p>Actual: {batch.currentFile}</p>}
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${(batch.processed / batch.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Batch upload button */}
          <button
            onClick={() => batchFileRef.current?.click()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            📦 Lote ZIP
          </button>
          <input
            ref={batchFileRef}
            type="file"
            accept=".zip"
            onChange={handleBatchUpload}
            className="hidden"
          />

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            + Nuevo producto
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar productos (búsqueda semántica)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border-0 shadow-sm focus:ring-2 focus:ring-orange-300 outline-none"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            !selectedCategory
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-600 hover:bg-orange-50'
          }`}
        >
          Todos
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap capitalize transition-colors ${
              selectedCategory === cat
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 hover:bg-orange-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No hay productos
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            Mostrando {products.length} producto{products.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-orange-300"
              >
                <div className="aspect-[4/5] rounded-xl overflow-hidden bg-gray-100 mb-3">
                  <img
                    src={product.gallery[1] || product.gallery[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium text-sm text-gray-800 truncate">
                  {product.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full capitalize">
                    {product.category}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full capitalize">
                    {product.style.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">#{product.id}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadProductModal
          onClose={() => setShowUploadModal(false)}
          onCreated={() => {
            fetchProducts(selectedCategory || undefined);
          }}
        />
      )}
    </div>
  );
}

function UploadProductModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cropperKey, setCropperKey] = useState(0);
  const isSubmitting = { current: false };

  const handleUpload = async (
    blob: Blob,
    _base64: string,
    orientation: Orientation,
  ) => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const product = await uploadProduct(blob, orientation);

      setSuccess(`✓ Producto #${product.id}: ${product.title}`);
      setCropperKey((k) => k + 1);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsProcessing(false);
      isSubmitting.current = false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Nuevo Producto</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4">
            {success}
          </div>
        )}

        <ImageCropper key={cropperKey} onUpload={handleUpload} isProcessing={isProcessing} />
      </div>
    </div>
  );
}

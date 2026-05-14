import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, Package, Store, Minus, Plus, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    fetchProduct()
  }, [id])

  async function fetchProduct() {
    const { data } = await supabase
      .from('products')
      .select('*, vendor:profiles(full_name, email), category:categories(name)')
      .eq('id', id)
      .single()
    setProduct(data)
    setLoading(false)
  }

  function handleAddToCart() {
    addToCart(product, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-200 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-10 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="max-w-6xl mx-auto px-4 py-16 text-center">
      <p className="text-gray-500">Produit introuvable</p>
      <button onClick={() => navigate('/products')} className="btn-primary mt-4">Voir les produits</button>
    </div>
  )

  const allImages = [product.image_url, ...(product.images || [])].filter(Boolean)
  const mainImage = allImages[selectedImage] || `https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&h=500&fit=crop`

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm font-medium group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Retour
      </button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-3">
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&h=500&fit=crop' }}
            />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === i ? 'border-orange-500' : 'border-transparent'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category?.name && (
            <span className="text-sm text-orange-600 font-medium uppercase tracking-wide">
              {product.category.name}
            </span>
          )}
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            {product.name}
          </h1>

          <div className="text-3xl font-bold text-orange-600 mb-6">
            {Number(product.price).toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
          </div>

          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-6">{product.description}</p>
          )}

          {/* Stock */}
          <div className={`flex items-center gap-2 mb-6 text-sm font-medium ${
            product.stock === 0 ? 'text-red-600' : product.stock <= 5 ? 'text-amber-600' : 'text-green-600'
          }`}>
            <Package size={15} />
            {product.stock === 0 ? 'Épuisé' : `${product.stock} en stock`}
          </div>

          {/* Quantity + Add to cart */}
          {product.stock > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Quantité :</label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-4 py-2 font-semibold text-gray-900 min-w-10 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all ${
                  added
                    ? 'bg-green-500 text-white'
                    : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95'
                }`}
              >
                {added ? <><Check size={18} /> Ajouté au panier !</> : <><ShoppingCart size={18} /> Ajouter au panier</>}
              </button>
            </div>
          )}

          {/* Vendor */}
          {product.vendor && (
            <div className="flex items-center gap-3 mt-8 p-4 bg-gray-50 rounded-2xl">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                <Store size={18} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Vendu par</p>
                <p className="font-semibold text-gray-900 text-sm">{product.vendor.full_name}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

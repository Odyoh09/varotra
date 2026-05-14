import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useState } from 'react'

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)

  function handleAddToCart(e) {
    e.preventDefault()
    addToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const imageUrl = product.image_url ||
    `https://images.unsplash.com/photo-${getUnsplashId(product.category?.name)}?w=400&h=300&fit=crop&auto=format`

  return (
    <Link to={`/products/${product.id}`} className="card group block overflow-hidden">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=300&fit=crop' }}
        />
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">Épuisé</span>
          </div>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <div className="absolute top-2 left-2">
            <span className="badge bg-amber-100 text-amber-800">Plus que {product.stock}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        {product.category?.name && (
          <span className="text-xs text-orange-600 font-medium uppercase tracking-wide">
            {product.category.name}
          </span>
        )}
        <h3 className="font-semibold text-gray-900 mt-0.5 mb-1 line-clamp-2 text-xs sm:text-sm leading-snug">
          {product.name}
        </h3>

        {product.vendor?.full_name && (
          <p className="text-xs text-gray-400 mb-2 hidden sm:block">Par {product.vendor.full_name}</p>
        )}

        <div className="flex items-center justify-between gap-1 sm:gap-2">
          <span className="text-sm sm:text-base font-bold text-gray-900 truncate">
            {Number(product.price).toLocaleString('fr-FR')} Ar
          </span>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            aria-label={added ? 'Ajouté au panier' : 'Ajouter au panier'}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-medium transition-all shrink-0 ${
              added
                ? 'bg-green-100 text-green-700'
                : product.stock === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95'
            }`}
          >
            <ShoppingCart size={12} />
            <span className="hidden sm:inline">{added ? 'Ajouté !' : 'Ajouter'}</span>
          </button>
        </div>
      </div>
    </Link>
  )
}

function getUnsplashId(categoryName) {
  const map = {
    'Électronique': '1498049794561-7780e7231661',
    'Mode & Vêtements': '1441984904996-e0b6ba687e04',
    'Maison & Jardin': '1555041469-a586c61ea9bc',
    'Alimentation': '1542838132-92c53300491e',
    'Sports & Loisirs': '1461896836934-ffe607ba8211',
    'Beauté & Santé': '1596462502278-27bfdc403348',
  }
  return map[categoryName] || '1491553895911-0055eca6402d'
}

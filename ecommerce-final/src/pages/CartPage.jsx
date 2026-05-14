import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function CartPage() {
  const { items, total, updateQuantity, removeFromCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          Votre panier est vide
        </h2>
        <p className="text-gray-500 mb-6">Découvrez nos produits et ajoutez vos favoris !</p>
        <Link to="/products" className="btn-primary inline-flex items-center gap-2">
          <ShoppingBag size={16} /> Parcourir les produits
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
          Panier ({items.length} article{items.length > 1 ? 's' : ''})
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(item => (
            <div key={item.id} className="card p-4 flex items-start gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-50">
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=200&h=200&fit=crop'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=200&h=200&fit=crop' }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{item.name}</h3>
                {item.vendor?.full_name && (
                  <p className="text-xs text-gray-400 mt-0.5">Par {item.vendor.full_name}</p>
                )}
                <p className="text-orange-600 font-bold mt-1">
                  {Number(item.price).toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>

                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="px-2 py-1.5 hover:bg-gray-50"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="px-3 py-1.5 text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-2 py-1.5 hover:bg-gray-50"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <p className="text-xs text-gray-500 font-medium">
                  = {(item.price * item.quantity).toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Récapitulatif</h2>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Sous-total ({items.reduce((s, i) => s + i.quantity, 0)} articles)</span>
                <span>{total.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Livraison</span>
                <span className="text-green-600 font-medium">Gratuite</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-5">
              <div className="flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span className="text-orange-600 text-lg">{total.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</span>
              </div>
            </div>

            {user ? (
              <Link to="/checkout" className="btn-primary w-full text-center block">
                Procéder au paiement
              </Link>
            ) : (
              <div>
                <Link to="/login" className="btn-primary w-full text-center block mb-2">
                  Se connecter pour commander
                </Link>
                <p className="text-xs text-gray-400 text-center">Ou continuer en tant qu'invité</p>
              </div>
            )}

            <Link to="/products" className="btn-secondary w-full text-center block mt-2 text-sm">
              Continuer les achats
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

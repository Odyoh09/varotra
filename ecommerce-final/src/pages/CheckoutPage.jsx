import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Check, Loader } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [address, setAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCVC, setCardCVC] = useState('')

  async function handleCheckout(e) {
    e.preventDefault()
    setLoading(true)

    // Simulate payment delay (Stripe simulation)
    await new Promise(r => setTimeout(r, 1500))

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        client_id: user.id,
        total_amount: total,
        status: 'paid',
        payment_method: paymentMethod,
        shipping_address: address,
      })
      .select()
      .single()

    if (!error && order) {
      // Insert order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        vendor_id: item.vendor_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }))

      await supabase.from('order_items').insert(orderItems)

      // Update stock
      for (const item of items) {
        await supabase
          .from('products')
          .update({ stock: Math.max(0, item.stock - item.quantity) })
          .eq('id', item.id)
      }

      await clearCart()
      setSuccess(true)
      setTimeout(() => navigate('/orders'), 3000)
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={36} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          Commande confirmée !
        </h2>
        <p className="text-gray-500">Votre commande a été passée avec succès. Redirection vers vos commandes...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
        Finaliser la commande
      </h1>

      <form onSubmit={handleCheckout}>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Shipping */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Adresse de livraison</h2>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="input resize-none h-24"
                placeholder="Numéro et nom de rue, ville, code postal..."
                required
              />
            </div>

            {/* Payment */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-orange-600" /> Paiement
              </h2>
              
              <div className="flex gap-3 mb-4">
                {['card', 'mobile_money'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      paymentMethod === method
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {method === 'card' ? '💳 Carte bancaire' : '📱 Mobile Money'}
                  </button>
                ))}
              </div>

              {paymentMethod === 'card' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Numéro de carte</label>
                    <input
                      className="input font-mono"
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim())}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiration</label>
                      <input className="input" placeholder="MM/AA" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">CVC</label>
                      <input className="input" placeholder="123" value={cardCVC} onChange={e => setCardCVC(e.target.value.slice(0, 3))} required />
                    </div>
                  </div>
                  <div className="bg-blue-50 text-blue-700 text-xs px-3 py-2 rounded-xl">
                    💡 Mode simulation — utilisez n'importe quelle valeur
                  </div>
                </div>
              ) : (
                <div>
                  <input className="input" placeholder="Numéro Mobile Money (ex: 034 XX XXX XX)" required />
                  <div className="bg-blue-50 text-blue-700 text-xs px-3 py-2 rounded-xl mt-2">
                    💡 Mode simulation — utilisez n'importe quel numéro
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order summary */}
          <div className="card p-5 h-fit sticky top-24">
            <h2 className="font-semibold text-gray-900 mb-4">Votre commande</h2>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=80'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="flex-1 text-gray-700 line-clamp-1">{item.name}</span>
                  <span className="text-gray-500 shrink-0">×{item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span>{total.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Livraison</span>
                <span className="text-green-600">Gratuite</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100">
                <span>Total</span>
                <span className="text-orange-600">{total.toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader size={16} className="animate-spin" /> Traitement en cours...</>
              ) : (
                <>Confirmer et payer</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

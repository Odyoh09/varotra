import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const STATUS_LABELS = {
  pending: 'En attente',
  paid: 'Payée',
  processing: 'En traitement',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) fetchOrders()
  }, [user])

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, product:products(name, image_url, price))')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card p-5 mb-3 animate-pulse">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-32" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
        Mes commandes
      </h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">Aucune commande</h3>
          <p className="text-gray-500 text-sm mb-4">Vous n'avez pas encore passé de commande</p>
          <Link to="/products" className="btn-primary inline-block">Découvrir les produits</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="card overflow-hidden">
              <div
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      Commande #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <span className={`badge ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-orange-600">
                    {Number(order.total_amount).toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                  </span>
                  {expanded === order.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </div>

              {expanded === order.id && (
                <div className="border-t border-gray-100 p-5 bg-gray-50">
                  <div className="space-y-3">
                    {order.order_items?.map(item => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-white">
                          <img
                            src={item.product?.image_url || 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=80'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.product?.name}</p>
                          <p className="text-xs text-gray-500">×{item.quantity} × {Number(item.unit_price).toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 shrink-0">
                          {Number(item.total_price).toLocaleString('fr-FR', { style: 'currency', currency: 'MGA' })}
                        </p>
                      </div>
                    ))}
                  </div>
                  {order.shipping_address && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 font-medium">Livraison à :</p>
                      <p className="text-sm text-gray-700 mt-1">{order.shipping_address}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Truck, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/products/ProductCard'

const CATEGORY_IMAGES = {
  'Électronique': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=200&fit=crop',
  'Mode & Vêtements': 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=300&h=200&fit=crop',
  'Maison & Jardin': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=200&fit=crop',
  'Alimentation': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=200&fit=crop',
  'Sports & Loisirs': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&h=200&fit=crop',
  'Beauté & Santé': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=200&fit=crop',
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetchFeatured()
    fetchCategories()
  }, [])

  async function fetchFeatured() {
    const { data } = await supabase
      .from('products')
      .select('*, vendor:profiles(full_name), category:categories(name)')
      .eq('is_active', true)
      .gt('stock', 0)
      .order('created_at', { ascending: false })
      .limit(8)
    setFeaturedProducts(data || [])
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data || [])
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="badge bg-orange-100 text-orange-700 mb-4">🇲🇬 Plateforme Malagasy</span>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Achetez et vendez avec{' '}
                <span className="text-orange-600">confiance</span>
              </h1>
              <p className="text-gray-600 text-base sm:text-lg mb-8 leading-relaxed">
                La marketplace multi-vendeurs de Madagascar. Des milliers de produits, des vendeurs certifiés, des paiements sécurisés.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/products" className="btn-primary flex items-center gap-2 text-sm sm:text-base px-5 sm:px-7 py-2.5 sm:py-3">
                  Explorer les produits <ArrowRight size={16} />
                </Link>
                <Link to="/register" className="btn-secondary flex items-center gap-2 text-sm sm:text-base px-5 sm:px-7 py-2.5 sm:py-3">
                  Devenir vendeur
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-8 flex-wrap">
                {[['500+', 'Vendeurs'], ['10k+', 'Produits'], ['50k+', 'Clients']].map(([num, label]) => (
                  <div key={label}>
                    <p className="font-bold text-lg sm:text-xl text-gray-900">{num}</p>
                    <p className="text-gray-500 text-xs sm:text-sm">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Hero images — visible seulement sur grand écran */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&h=300&fit=crop',
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
                'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300&h=300&fit=crop',
                'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=300&h=300&fit=crop',
              ].map((src, i) => (
                <div
                  key={i}
                  className={`rounded-2xl overflow-hidden ${i === 1 ? 'mt-8' : ''} ${i === 3 ? '-mt-8' : ''} shadow-md`}
                >
                  <img src={src} alt="" className="w-full aspect-square object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-y border-gray-100 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center">
            {[
              { icon: Truck, label: 'Livraison rapide', desc: 'Partout à Madagascar' },
              { icon: Shield, label: 'Paiement sécurisé', desc: 'Transactions protégées' },
              { icon: Star, label: 'Vendeurs certifiés', desc: 'Qualité garantie' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 sm:gap-2 py-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Icon size={16} className="text-orange-600" />
                </div>
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">{label}</p>
                <p className="text-gray-500 text-xs hidden sm:block">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <h2
            className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 sm:mb-6"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Catégories populaires
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            {categories.map(cat => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="group card overflow-hidden text-center"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={cat.image_url || CATEGORY_IMAGES[cat.name] || 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300&h=200&fit=crop'}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="py-1.5 sm:py-2 px-1">
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2">{cat.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <h2
            className="text-xl sm:text-2xl font-bold text-gray-900"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Nouveaux produits
          </h2>
          <Link to="/products" className="text-orange-600 font-medium text-sm hover:underline flex items-center gap-1">
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="text-center py-16 card">
            <p className="text-gray-500">Aucun produit disponible pour le moment.</p>
            <Link to="/register" className="text-orange-600 font-medium text-sm mt-2 block">
              Devenez vendeur et ajoutez vos produits →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

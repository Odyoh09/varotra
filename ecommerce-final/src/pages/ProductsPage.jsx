import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/products/ProductCard'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, sortBy])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data || [])
  }

  async function fetchProducts() {
    setLoading(true)
    let query = supabase
      .from('products')
      .select('*, vendor:profiles(full_name), category:categories(name)')
      .eq('is_active', true)
      .gt('stock', 0)
      .order(sortBy, { ascending: sortBy === 'price' })

    if (selectedCategory) query = query.eq('category_id', selectedCategory)
    if (priceRange.min) query = query.gte('price', Number(priceRange.min))
    if (priceRange.max) query = query.lte('price', Number(priceRange.max))

    const { data, error } = await query
    if (!error) setProducts(data || [])
    setLoading(false)
  }

  function handlePriceFilter(e) {
    e.preventDefault()
    fetchProducts()
  }

  function clearFilters() {
    setSearch('')
    setSelectedCategory('')
    setSortBy('created_at')
    setPriceRange({ min: '', max: '' })
  }

  const filtered = products.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.vendor?.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const hasActiveFilters = selectedCategory || priceRange.min || priceRange.max || search

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
          Tous les produits
        </h1>
        <p className="text-gray-500 text-sm mt-1">{filtered.length} produit{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Search + Filters row */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit, vendeur..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-2 shrink-0 ${showFilters ? 'border-orange-400 text-orange-600' : ''}`}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filtres</span>
          {hasActiveFilters && <span className="w-2 h-2 bg-orange-500 rounded-full" />}
        </button>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="input w-auto shrink-0 cursor-pointer"
        >
          <option value="created_at">Plus récents</option>
          <option value="price">Prix croissant</option>
        </select>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Category filter */}
            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Catégorie</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="input text-sm"
              >
                <option value="">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Price range */}
            <form onSubmit={handlePriceFilter} className="flex gap-2 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Prix min (Ar)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={priceRange.min}
                  onChange={e => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="input text-sm w-32"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Prix max (Ar)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={priceRange.max}
                  onChange={e => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="input text-sm w-32"
                />
              </div>
              <button type="submit" className="btn-primary text-sm py-3">Appliquer</button>
            </form>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1">
                <X size={14} /> Réinitialiser
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory('')}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !selectedCategory ? 'bg-orange-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
            }`}
          >
            Tout
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.id ? 'bg-orange-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-t-2xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-6 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="font-semibold text-gray-700 mb-2">Aucun produit trouvé</h3>
          <p className="text-gray-500 text-sm">Essayez d'autres termes ou supprimez les filtres</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-primary mt-4">Voir tous les produits</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

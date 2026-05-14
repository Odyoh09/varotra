import { useState, useEffect } from 'react'
import {
  Plus, Edit2, Trash2, Package, TrendingUp, ShoppingBag,
  Eye, EyeOff, Upload, X, AlertTriangle, CheckCircle, RefreshCw
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const DEMO_IMAGE = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop'

export default function VendorDashboard() {
  const { user, profile } = useAuth()
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', stock: '', category_id: '', image_url: ''
  })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('products')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (user) {
      fetchAll()
    }
  }, [user])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchProducts(), fetchOrders(), fetchCategories()])
    setLoading(false)
  }

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(name)')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setProducts(data || [])
  }

  async function fetchOrders() {
    const { data } = await supabase
      .from('order_items')
      .select('*, order:orders(*), product:products(name, image_url)')
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false })
    setOrders(data || [])
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data || [])
  }

  function openForm(product = null) {
    setEditProduct(product)
    setFormError('')
    setFormSuccess('')
    setFormData(product ? {
      name: product.name || '',
      description: product.description || '',
      price: String(product.price || ''),
      stock: String(product.stock || ''),
      category_id: product.category_id || '',
      image_url: product.image_url || ''
    } : {
      name: '', description: '', price: '', stock: '', category_id: '', image_url: ''
    })
    setImagePreview(product?.image_url || '')
    setImageFile(null)
    setShowForm(true)
    // Scroll vers le haut du formulaire
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
  }

  function closeForm() {
    setShowForm(false)
    setEditProduct(null)
    setFormError('')
    setFormSuccess('')
    setImageFile(null)
    setImagePreview('')
    setUploadingImage(false)
  }

  async function uploadImage() {
    if (!imageFile) return formData.image_url || null

    setUploadingImage(true)
    const ext = imageFile.name.split('.').pop().toLowerCase()
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    if (!allowedExts.includes(ext)) {
      throw new Error('Format non supporté. Utilisez JPG, PNG, WEBP ou GIF.')
    }

    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(path, imageFile, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      if (uploadError.message?.includes('Bucket not found') || uploadError.statusCode === 404) {
        throw new Error(
          'Le bucket "product-images" n\'existe pas dans Supabase Storage.\n' +
          'Solution: Supabase → Storage → New bucket → Nom: "product-images" → Public: oui.\n' +
          'En attendant, collez une URL d\'image externe.'
        )
      }
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(path)

    setUploadingImage(false)
    return publicUrl
  }

  async function handleSave(e) {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    // Validation
    if (!formData.name.trim()) {
      setFormError('Le nom du produit est requis')
      return
    }
    const price = parseFloat(formData.price)
    const stock = parseInt(formData.stock)
    if (isNaN(price) || price < 0) {
      setFormError('Le prix doit être un nombre positif')
      return
    }
    if (isNaN(stock) || stock < 0) {
      setFormError('Le stock doit être un nombre positif')
      return
    }

    setSaving(true)
    try {
      let imageUrl = formData.image_url || null

      if (imageFile) {
        imageUrl = await uploadImage()
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price,
        stock,
        category_id: formData.category_id || null,
        image_url: imageUrl,
        vendor_id: user.id,
      }

      let error
      if (editProduct) {
        // On exclut vendor_id du payload UPDATE pour éviter les conflits RLS
        const { vendor_id: _omit, ...updatePayload } = payload
        const { data: updated, error: updateError } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', editProduct.id)
          .eq('vendor_id', user.id)
          .select()
        error = updateError
        if (!error && (!updated || updated.length === 0)) {
          throw new Error('Mise à jour échouée : produit introuvable ou accès refusé.')
        }
      } else {
        const { error: insertError } = await supabase
          .from('products')
          .insert({ ...payload, is_active: true })
        error = insertError
      }

      if (error) throw error

      setFormSuccess(editProduct ? 'Produit modifié avec succès !' : 'Produit créé avec succès !')
      await fetchProducts()

      // Ferme le modal après 1s
      setTimeout(() => {
        closeForm()
      }, 900)
    } catch (err) {
      console.error('Save error:', err)
      setFormError(err.message || 'Une erreur est survenue. Vérifiez votre connexion.')
    } finally {
      setSaving(false)
      setUploadingImage(false)
    }
  }

  async function toggleActive(product) {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)
      .eq('vendor_id', user.id)
    if (!error) fetchProducts()
  }

  async function deleteProduct(id, name) {
    if (!window.confirm(`Supprimer "${name}" définitivement ? Cette action est irréversible.`)) return
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('vendor_id', user.id)
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id))
    } else {
      alert('Erreur lors de la suppression: ' + error.message)
    }
  }

  function handleImageFile(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setFormError("L'image ne doit pas dépasser 5MB")
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setFormData(prev => ({ ...prev, image_url: '' }))
  }

  function clearImage() {
    setImagePreview('')
    setImageFile(null)
    setFormData(prev => ({ ...prev, image_url: '' }))
  }

  function fillDemoProduct() {
    setFormData({
      name: 'iPhone 13',
      description: 'Apple iPhone 13 128GB - Écran Super Retina XDR 6,1", puce A15 Bionic, double capteur photo 12MP, batterie longue durée. État neuf, débloqué tous opérateurs.',
      price: '2000000',
      stock: '5',
      category_id: categories.find(c => c.slug === 'electronique')?.id || categories[0]?.id || '',
      image_url: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=400&h=400&fit=crop'
    })
    setImagePreview('https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=400&h=400&fit=crop')
    setImageFile(null)
    setFormError('')
  }

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_price || 0), 0)
  const totalSales = orders.reduce((s, o) => s + (o.quantity || 0), 0)
  const activeProducts = products.filter(p => p.is_active).length

  const STATUS_LABELS = {
    pending: 'En attente',
    paid: 'Payée',
    processing: 'En traitement',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  }
  const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    processing: 'bg-purple-100 text-purple-700',
    shipped: 'bg-blue-100 text-blue-700',
    delivered: 'bg-teal-100 text-teal-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
            Espace Vendeur
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Bienvenue, <span className="font-medium text-gray-700">{profile?.full_name || 'Vendeur'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-xl transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw size={16} />
          </button>
          <button onClick={() => openForm()} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nouveau produit
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total produits', value: products.length, sub: `${activeProducts} actifs`, icon: Package, color: 'text-blue-600' },
          { label: 'Commandes reçues', value: orders.length, sub: 'depuis le début', icon: ShoppingBag, color: 'text-purple-600' },
          { label: 'Articles vendus', value: totalSales, sub: 'unités au total', icon: TrendingUp, color: 'text-green-600' },
          {
            label: 'Revenu total',
            value: totalRevenue.toLocaleString('fr-MG') + ' Ar',
            sub: 'toutes commandes',
            icon: TrendingUp,
            color: 'text-orange-600'
          },
        ].map(stat => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{stat.label}</p>
              <stat.icon size={18} className={stat.color + ' opacity-60'} />
            </div>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {[
          { id: 'products', label: `Mes produits (${products.length})` },
          { id: 'orders', label: `Commandes (${orders.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Liste des produits */}
      {activeTab === 'products' && (
        <div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <div key={i} className="card h-64 animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 card">
              <Package size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-2">Aucun produit pour l'instant.</p>
              <p className="text-gray-400 text-sm mb-5">Commencez par créer votre premier produit !</p>
              <button onClick={() => openForm()} className="btn-primary inline-flex items-center gap-2">
                <Plus size={16} /> Créer un produit
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => (
                <div key={product.id} className={`card overflow-hidden transition-opacity ${!product.is_active ? 'opacity-60' : ''}`}>
                  <div className="aspect-video relative overflow-hidden bg-gray-50">
                    <img
                      src={product.image_url || DEMO_IMAGE}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.src = DEMO_IMAGE }}
                    />
                    {!product.is_active && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="bg-white text-gray-700 text-xs font-medium px-2 py-1 rounded-full shadow">
                          Inactif
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{product.name}</h3>
                      <span className="text-orange-600 font-bold text-sm shrink-0">
                        {Number(product.price).toLocaleString('fr-MG')} Ar
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Stock: <span className={product.stock <= 2 ? 'text-red-600 font-semibold' : ''}>{product.stock}</span>
                      {' · '}{product.category?.name || 'Sans catégorie'}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openForm(product)}
                        className="flex-1 btn-secondary py-1.5 text-xs flex items-center justify-center gap-1"
                      >
                        <Edit2 size={12} /> Modifier
                      </button>
                      <button
                        onClick={() => toggleActive(product)}
                        title={product.is_active ? 'Désactiver' : 'Activer'}
                        className="p-2 text-gray-400 hover:text-blue-600 border border-gray-200 rounded-xl transition-colors"
                      >
                        {product.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id, product.name)}
                        title="Supprimer"
                        className="p-2 text-gray-400 hover:text-red-600 border border-gray-200 rounded-xl transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Liste des commandes */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-16 card">
              <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium mb-1">Aucune commande pour le moment</p>
              <p className="text-gray-400 text-sm">Les commandes de vos clients apparaîtront ici</p>
            </div>
          ) : orders.map(item => (
            <div key={item.id} className="card p-4 flex items-center gap-4">
              {/* Image produit */}
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                <img
                  src={item.product?.image_url || DEMO_IMAGE}
                  alt={item.product?.name}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.src = DEMO_IMAGE }}
                />
              </div>
              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{item.product?.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(item.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                  {' · '}Qté: {item.quantity}
                </p>
              </div>
              {/* Prix + statut */}
              <div className="text-right shrink-0">
                <p className="font-bold text-orange-600 text-sm">
                  {Number(item.total_price).toLocaleString('fr-MG')} Ar
                </p>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${
                  STATUS_COLORS[item.order?.status] || 'bg-gray-100 text-gray-600'
                }`}>
                  {STATUS_LABELS[item.order?.status] || item.order?.status || 'pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== MODAL FORMULAIRE PRODUIT ===== */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={e => e.target === e.currentTarget && closeForm()}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg my-4 shadow-2xl">
            {/* En-tête du modal */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editProduct ? '✏️ Modifier le produit' : '➕ Nouveau produit'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Erreur */}
              {formError && (
                <div className="flex items-start gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-100">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <span style={{ whiteSpace: 'pre-line' }}>{formError}</span>
                </div>
              )}
              {/* Succès */}
              {formSuccess && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm border border-green-100">
                  <CheckCircle size={16} className="shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Bouton exemple demo */}
              {!editProduct && (
                <button
                  type="button"
                  onClick={fillDemoProduct}
                  className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-2"
                >
                  📱 Remplir avec l'exemple iPhone 13 (2 000 000 Ar)
                </button>
              )}

              {/* Upload image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image du produit</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-orange-300 transition-colors">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Aperçu" className="w-full h-36 object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-1 right-1 bg-white rounded-full p-1.5 shadow hover:bg-gray-100"
                      >
                        <X size={13} className="text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Cliquer pour uploader une image</span>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP · max 5MB</p>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageFile}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs text-gray-400">ou coller une URL</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <input
                  type="url"
                  placeholder="https://exemple.com/image.jpg"
                  value={formData.image_url}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, image_url: e.target.value }))
                    setImagePreview(e.target.value)
                    setImageFile(null)
                  }}
                  className="input mt-2 text-sm"
                />
              </div>

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom du produit <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="Ex: iPhone 13 128GB"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez votre produit : caractéristiques, état, inclus..."
                />
              </div>

              {/* Prix & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Prix (Ar) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="input"
                    value={formData.price}
                    onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                    placeholder="2000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="input"
                    value={formData.stock}
                    onChange={e => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    required
                    placeholder="5"
                  />
                </div>
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégorie</label>
                <select
                  className="input"
                  value={formData.category_id}
                  onChange={e => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                >
                  <option value="">— Choisir une catégorie —</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Aucune catégorie. Exécutez le fichier supabase-schema.sql dans Supabase.
                  </p>
                )}
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {(saving || uploadingImage) && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {uploadingImage ? 'Upload image...' : saving ? 'Enregistrement...' : editProduct ? 'Enregistrer' : 'Créer le produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

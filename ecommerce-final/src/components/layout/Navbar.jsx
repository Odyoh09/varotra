import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Store, LogOut, Package, LayoutDashboard, Menu, X, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Ferme le menu au changement de route
  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  // Ferme le dropdown si clic en dehors
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  async function handleSignOut() {
    setUserMenuOpen(false)
    setMenuOpen(false)
    await signOut()
    navigate('/', { replace: true })
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center">
              <Store size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl" style={{ fontFamily: 'Playfair Display, serif' }}>
              MarketPlace<span className="text-orange-600">MG</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/products"
              className={`font-medium text-sm transition-colors ${isActive('/products') ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
            >
              Produits
            </Link>
            {profile?.role === 'vendor' && (
              <Link
                to="/vendor/dashboard"
                className={`font-medium text-sm transition-colors ${isActive('/vendor/dashboard') ? 'text-orange-600' : 'text-gray-600 hover:text-orange-600'}`}
              >
                Mon Espace Vendeur
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Panier */}
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-orange-600 transition-colors">
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* Menu utilisateur */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
                >
                  <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-orange-700 text-xs font-bold">
                      {(profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block text-gray-700 max-w-[120px] truncate">
                    {profile?.full_name || 'Mon compte'}
                  </span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50">
                    {/* Info utilisateur */}
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {profile?.full_name || 'Utilisateur'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1.5 ${
                        profile?.role === 'vendor'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-50 text-orange-700'
                      }`}>
                        {profile?.role === 'vendor' ? '🏪 Vendeur' : '🛍️ Client'}
                      </span>
                    </div>

                    {/* Liens */}
                    <Link
                      to="/orders"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Package size={15} className="text-gray-400" />
                      Mes commandes
                    </Link>

                    {profile?.role === 'vendor' && (
                      <Link
                        to="/vendor/dashboard"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LayoutDashboard size={15} className="text-gray-400" />
                        Dashboard vendeur
                      </Link>
                    )}

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors rounded-b-2xl"
                      >
                        <LogOut size={15} />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-2 px-4">Connexion</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4 hidden sm:block">Inscription</Link>
              </div>
            )}

            {/* Bouton menu mobile */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-orange-600"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          <Link to="/products" className="block py-2.5 text-sm font-medium text-gray-700 hover:text-orange-600">
            Produits
          </Link>
          {profile?.role === 'vendor' && (
            <Link to="/vendor/dashboard" className="block py-2.5 text-sm font-medium text-gray-700 hover:text-orange-600">
              Espace Vendeur
            </Link>
          )}
          {user && (
            <Link to="/orders" className="block py-2.5 text-sm font-medium text-gray-700 hover:text-orange-600">
              Mes commandes
            </Link>
          )}
          {!user && (
            <Link to="/register" className="block py-2.5 text-sm font-medium text-orange-600">
              S'inscrire
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}

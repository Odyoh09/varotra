import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Store, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function AuthPage({ mode = 'login' }) {
  const [isLogin, setIsLogin] = useState(mode === 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('client')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { signIn, signUp, user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Rediriger selon le rôle une fois le profil chargé
  useEffect(() => {
    if (!authLoading && user) {
      if (profile?.role === 'vendor') {
        navigate('/vendor/dashboard', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    }
  }, [user, profile, authLoading, navigate])

  function resetForm() {
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
    setFullName('')
    setRole('client')
  }

  function switchMode(toLogin) {
    setIsLogin(toLogin)
    resetForm()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (isLogin) {
      const { error } = await signIn({ email, password })
      if (error) {
        if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
          setError('Email ou mot de passe incorrect. Vérifiez vos informations.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Veuillez confirmer votre email avant de vous connecter.')
        } else {
          setError(error.message)
        }
        setLoading(false)
      } else {
        // La redirection est gérée par le useEffect une fois le profil chargé
        // (vers /vendor/dashboard si vendeur, vers / sinon)
      }
    } else {
      if (!fullName.trim()) {
        setError('Veuillez entrer votre nom complet')
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères')
        setLoading(false)
        return
      }

      const { data, error } = await signUp({ email, password, fullName, role })

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          setError('Cet email est déjà utilisé. Connectez-vous à la place.')
        } else {
          setError(error.message)
        }
        setLoading(false)
      } else {
        if (data?.user?.identities?.length === 0) {
          setError('Cet email est déjà enregistré. Connectez-vous.')
          setLoading(false)
        } else if (data?.session) {
          // Inscription + connexion automatique
          navigate(role === 'vendor' ? '/vendor/dashboard' : '/', { replace: true })
        } else {
          setSuccess('Compte créé ! Vérifiez votre email pour confirmer, puis connectez-vous.')
          setIsLogin(true)
          setEmail(email)
          setPassword('')
          setLoading(false)
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Store size={24} className="text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
            MarketPlaceMG
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte gratuitement'}
          </p>
        </div>

        <div className="card p-8">
          {/* Toggle Connexion / Inscription */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isLogin ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => switchMode(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isLogin ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Inscription
            </button>
          </div>

          {/* Messages erreur / succès */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm border border-red-100">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm border border-green-100">
              <CheckCircle size={16} className="mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom complet (inscription uniquement) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="input"
                  placeholder="Jean Dupont"
                  required
                  autoComplete="name"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="votre@email.com"
                required
                autoComplete={isLogin ? 'email' : 'new-email'}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe *</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  minLength={6}
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-xs text-gray-400 mt-1">Minimum 6 caractères</p>
              )}
            </div>

            {/* Rôle (inscription uniquement) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Je suis</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('client')}
                    className={`p-3 rounded-xl border-2 text-sm font-medium text-center transition-all ${
                      role === 'client'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    🛍️ Client
                    <p className="text-xs mt-0.5 font-normal opacity-70">J'achète des produits</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('vendor')}
                    className={`p-3 rounded-xl border-2 text-sm font-medium text-center transition-all ${
                      role === 'vendor'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    🏪 Vendeur
                    <p className="text-xs mt-0.5 font-normal opacity-70">Je vends des produits</p>
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center flex items-center gap-2 py-3"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isLogin ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
            {' '}
            <button onClick={() => switchMode(!isLogin)} className="text-orange-600 font-medium hover:underline">
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

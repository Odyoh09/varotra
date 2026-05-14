import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setLoading(false)
        return
      }

      if (session?.user) {
        if (event === 'SIGNED_IN') {
          await new Promise(r => setTimeout(r, 500))
        }
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId, retries = 5) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (!data && retries > 0) {
        await new Promise(r => setTimeout(r, 600))
        return fetchProfile(userId, retries - 1)
      }
      setProfile(data || null)
    } catch (err) {
      console.error('fetchProfile error:', err)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  async function signUp({ email, password, fullName, role }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: role || 'client' } }
    })

    if (data?.user && !error) {
      setTimeout(async () => {
        const { data: existing } = await supabase
          .from('profiles').select('id').eq('id', data.user.id).maybeSingle()
        if (!existing) {
          await supabase.from('profiles').upsert({
            id: data.user.id, email, full_name: fullName, role: role || 'client'
          })
        }
      }, 1500)
    }
    return { data, error }
  }

  async function signIn({ email, password }) {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    // Réinitialise l'état localement AVANT d'appeler Supabase
    setUser(null)
    setProfile(null)
    await supabase.auth.signOut()
  }

  async function updateProfile(updates) {
    if (!user) return { error: 'Non connecté' }
    const { data, error } = await supabase
      .from('profiles').update(updates).eq('id', user.id).select().single()
    if (!error && data) setProfile(data)
    return { data, error }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

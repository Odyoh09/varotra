import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const CartContext = createContext({})

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const { user } = useAuth()
  const prevUserRef = useRef(null)

  useEffect(() => {
    const wasLoggedIn = prevUserRef.current
    prevUserRef.current = user?.id || null

    if (user) {
      // User just logged in: merge local cart with DB
      if (!wasLoggedIn) {
        mergeAndLoadCart()
      } else {
        loadCartFromDB()
      }
    } else {
      // Not logged in: use localStorage
      try {
        const saved = localStorage.getItem('cart')
        setItems(saved ? JSON.parse(saved) : [])
      } catch {
        setItems([])
      }
    }
  }, [user])

  // Persist to localStorage for guests
  useEffect(() => {
    if (!user) {
      localStorage.setItem('cart', JSON.stringify(items))
    }
  }, [items, user])

  async function loadCartFromDB() {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, product:products(*, vendor:profiles(full_name), category:categories(name))')
      .eq('user_id', user.id)
    if (!error && data) {
      setItems(data.map(item => ({
        ...item.product,
        id: item.product_id,
        quantity: item.quantity,
      })))
    }
  }

  async function mergeAndLoadCart() {
    // Get local cart items
    let localItems = []
    try {
      const saved = localStorage.getItem('cart')
      localItems = saved ? JSON.parse(saved) : []
    } catch {
      localItems = []
    }

    // Load DB cart
    const { data: dbItems } = await supabase
      .from('cart_items')
      .select('*, product:products(*, vendor:profiles(full_name), category:categories(name))')
      .eq('user_id', user.id)

    const dbCart = (dbItems || []).map(item => ({
      ...item.product,
      id: item.product_id,
      quantity: item.quantity,
    }))

    // Merge: local items take priority for quantity
    if (localItems.length > 0) {
      for (const localItem of localItems) {
        const existing = dbCart.find(i => i.id === localItem.id)
        if (existing) {
          const newQty = existing.quantity + localItem.quantity
          existing.quantity = newQty
          await supabase.from('cart_items')
            .update({ quantity: newQty })
            .eq('user_id', user.id)
            .eq('product_id', localItem.id)
        } else {
          await supabase.from('cart_items')
            .upsert({ user_id: user.id, product_id: localItem.id, quantity: localItem.quantity })
        }
      }
      localStorage.removeItem('cart')
      // Reload from DB after merge
      await loadCartFromDB()
    } else {
      setItems(dbCart)
    }
  }

  async function addToCart(product, quantity = 1) {
    const existing = items.find(i => i.id === product.id)
    if (existing) {
      const newQty = existing.quantity + quantity
      setItems(prev => prev.map(i => i.id === product.id ? { ...i, quantity: newQty } : i))
      if (user) {
        await supabase.from('cart_items')
          .update({ quantity: newQty })
          .eq('user_id', user.id)
          .eq('product_id', product.id)
      }
    } else {
      setItems(prev => [...prev, { ...product, quantity }])
      if (user) {
        await supabase.from('cart_items')
          .insert({ user_id: user.id, product_id: product.id, quantity })
      }
    }
  }

  async function removeFromCart(productId) {
    setItems(prev => prev.filter(i => i.id !== productId))
    if (user) {
      await supabase.from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)
    }
  }

  async function updateQuantity(productId, quantity) {
    if (quantity <= 0) return removeFromCart(productId)
    setItems(prev => prev.map(i => i.id === productId ? { ...i, quantity } : i))
    if (user) {
      await supabase.from('cart_items')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId)
    }
  }

  async function clearCart() {
    setItems([])
    localStorage.removeItem('cart')
    if (user) {
      await supabase.from('cart_items').delete().eq('user_id', user.id)
    }
  }

  const total = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider value={{ items, total, itemCount, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)

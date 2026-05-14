-- ============================================================
-- SCHEMA SUPABASE - Plateforme E-commerce Multi-Vendeurs
-- VERSION CORRIGÉE - Exécutez ce script dans l'éditeur SQL de Supabase
-- ============================================================

-- 1. TABLE: profiles (extension de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'vendor', 'admin')),
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLE: categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE: products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE: orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method TEXT DEFAULT 'card',
  shipping_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLE: order_items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLE: cart_items (panier persistant)
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES: Profiles
-- NOTE: Une seule politique SELECT pour éviter les conflits
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Lecture: tout le monde peut lire les profils (nécessaire pour afficher les noms vendeurs)
CREATE POLICY "Profiles are publicly readable" ON public.profiles
  FOR SELECT USING (true);

-- Insertion: utilisateur peut créer son propre profil (fallback si trigger échoue)
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Modification: utilisateur peut modifier son propre profil
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- POLICIES: Categories
-- ============================================================
DROP POLICY IF EXISTS "Categories are public" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

CREATE POLICY "Categories are public" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- POLICIES: Products
-- ============================================================
DROP POLICY IF EXISTS "Products are public" ON public.products;
DROP POLICY IF EXISTS "Vendors can manage own products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
DROP POLICY IF EXISTS "Vendors can view own inactive products" ON public.products;

-- Lecture publique des produits actifs
CREATE POLICY "Products are public" ON public.products
  FOR SELECT USING (is_active = true);

-- Vendeurs peuvent voir tous leurs produits (actifs et inactifs)
CREATE POLICY "Vendors can view own products" ON public.products
  FOR SELECT USING (vendor_id = auth.uid());

-- Vendeurs peuvent gérer leurs propres produits
CREATE POLICY "Vendors can insert own products" ON public.products
  FOR INSERT WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can update own products" ON public.products
  FOR UPDATE USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can delete own products" ON public.products
  FOR DELETE USING (vendor_id = auth.uid());

-- Admins peuvent tout gérer
CREATE POLICY "Admins can manage all products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- POLICIES: Orders
-- ============================================================
DROP POLICY IF EXISTS "Clients view own orders" ON public.orders;
DROP POLICY IF EXISTS "Clients can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins view all orders" ON public.orders;

CREATE POLICY "Clients view own orders" ON public.orders
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Clients can create orders" ON public.orders
  FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Admins view all orders" ON public.orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- POLICIES: Order items
-- ============================================================
DROP POLICY IF EXISTS "Order items visible to order owner" ON public.order_items;
DROP POLICY IF EXISTS "Vendors view their order items" ON public.order_items;
DROP POLICY IF EXISTS "Order items can be created" ON public.order_items;

CREATE POLICY "Order items visible to order owner" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND client_id = auth.uid())
  );

CREATE POLICY "Vendors view their order items" ON public.order_items
  FOR SELECT USING (vendor_id = auth.uid());

CREATE POLICY "Order items can be created" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND client_id = auth.uid())
  );

-- ============================================================
-- POLICIES: Cart
-- ============================================================
DROP POLICY IF EXISTS "Users manage own cart" ON public.cart_items;

CREATE POLICY "Users manage own cart" ON public.cart_items
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Créer automatiquement un profil après inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at automatique
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- DONNÉES DE TEST
-- ============================================================
INSERT INTO public.categories (name, slug, description, image_url) VALUES
  ('Électronique', 'electronique', 'Téléphones, ordinateurs, gadgets', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'),
  ('Mode & Vêtements', 'mode', 'Vêtements, chaussures, accessoires', 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400'),
  ('Maison & Jardin', 'maison', 'Décoration, mobilier, jardinage', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400'),
  ('Alimentation', 'alimentation', 'Épicerie, boissons, produits frais', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'),
  ('Sports & Loisirs', 'sports', 'Équipement sportif, jeux, hobbies', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400'),
  ('Beauté & Santé', 'beaute', 'Cosmétiques, bien-être, pharmacie', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- STORAGE BUCKET pour les images produits
-- ============================================================
-- Créez manuellement dans Supabase: Storage > New bucket
-- Nom: product-images
-- Public: true (cochez "Public bucket")
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
-- Max file size: 5242880 (5MB)
--
-- Puis ajoutez cette policy de storage:
-- Bucket: product-images
-- Policy name: "Authenticated users can upload"
-- Allowed operation: INSERT
-- Target roles: authenticated
-- Policy definition: true


-- ============================================================
-- DONNÉES DE DÉMONSTRATION : iPhone 13 commandé
-- ============================================================
-- NOTE: Ce bloc INSERT crée un exemple COMPLET:
--   1. Un vendeur demo
--   2. Le produit iPhone 13 à 2 000 000 Ar
--   3. Un client demo
--   4. Une commande passée avec l'iPhone 13
--
-- IMPORTANT: Exécutez ces lignes SÉPARÉMENT dans Supabase SQL Editor
-- car elles dépendent de vrai UUIDs auth. En production, créez
-- d'abord les comptes via l'interface, puis remplacez les UUIDs.
--
-- Voici un exemple avec des UUIDs fictifs (à adapter):
-- ============================================================

-- Simuler un produit iPhone 13 visible publiquement (sans compte vendeur réel)
-- Vous pouvez exécuter ceci après avoir créé un compte vendeur et récupéré son UUID:

/*
-- Remplacez 'VOTRE-VENDOR-UUID' par l'UUID du vendeur (visible dans Supabase Auth > Users)
-- Remplacez 'VOTRE-CLIENT-UUID' par l'UUID du client

-- Étape 1: Créer le produit iPhone 13
INSERT INTO public.products (vendor_id, category_id, name, description, price, stock, image_url, is_active)
SELECT
  'VOTRE-VENDOR-UUID'::uuid,
  c.id,
  'iPhone 13',
  'Apple iPhone 13 128GB - Écran Super Retina XDR 6,1" OLED, puce A15 Bionic, double capteur photo 12MP Ultra grand-angle + grand-angle, Face ID, 5G. Débloqué tous opérateurs. Livré avec câble et documentation. Garantie 1 an.',
  2000000.00,
  5,
  'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=600&h=600&fit=crop',
  true
FROM public.categories c WHERE c.slug = 'electronique'
ON CONFLICT DO NOTHING;

-- Étape 2: Créer une commande demo
INSERT INTO public.orders (client_id, total_amount, status, payment_method, shipping_address, notes)
VALUES (
  'VOTRE-CLIENT-UUID'::uuid,
  2000000.00,
  'paid',
  'mobile_money',
  'Lot II J 42, Ankadifotsy, Antananarivo 101, Madagascar',
  'Livraison express demandée'
);

-- Étape 3: Ajouter l'iPhone 13 dans les articles de cette commande
INSERT INTO public.order_items (order_id, product_id, vendor_id, quantity, unit_price, total_price)
SELECT
  o.id,
  p.id,
  p.vendor_id,
  1,
  2000000.00,
  2000000.00
FROM public.orders o, public.products p
WHERE p.name = 'iPhone 13'
  AND o.client_id = 'VOTRE-CLIENT-UUID'::uuid
ORDER BY o.created_at DESC
LIMIT 1;
*/

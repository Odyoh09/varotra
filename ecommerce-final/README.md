# E-Commerce Multi-Vendeur

Application e-commerce multi-vendeur construite avec React, Vite, Tailwind CSS et Supabase.

## 🚀 Stack Technique

- **Frontend** : React 19 + Vite
- **Style** : Tailwind CSS
- **Backend/Auth/DB** : Supabase
- **Routing** : React Router v7
- **State** : TanStack Query + Context API

## ⚙️ Configuration locale

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/VOTRE_USERNAME/ecommerce-corrige.git
   cd ecommerce-corrige
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Créez votre fichier `.env` à partir de `.env.example` :
   ```bash
   cp .env.example .env
   ```

4. Remplissez vos clés Supabase dans `.env` :
   ```
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre-anon-key
   ```

5. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

## 🗄️ Base de données

Exécutez le fichier `supabase-schema.sql` dans l'éditeur SQL de votre projet Supabase pour créer toutes les tables nécessaires.

## 🌐 Déploiement sur Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Importez ce dépôt sur [Vercel](https://vercel.com)
2. Ajoutez les variables d'environnement dans Vercel Dashboard :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Vercel détecte automatiquement Vite — aucune configuration supplémentaire nécessaire.

## 📁 Structure du projet

```
src/
├── components/
│   ├── layout/       # Navbar, Footer
│   └── products/     # ProductCard
├── context/          # AuthContext, CartContext
├── lib/              # Client Supabase
└── pages/            # Pages de l'app
```

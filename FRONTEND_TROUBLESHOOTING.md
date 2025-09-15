# Guide de Dépannage Frontend - Requêtes Axios

## Problème : Login/Register redirige au lieu d'utiliser axios

### 🔍 Diagnostic

Si les formulaires de connexion et d'inscription redirigent au lieu d'utiliser axios pour les requêtes, voici comment diagnostiquer et corriger le problème.

## ✅ Corrections Apportées

### 1. Composants Login et Register Corrigés

**Avant** : Formulaires statiques sans logique de soumission
**Après** : Formulaires fonctionnels avec Redux et axios

#### Login.tsx
- ✅ Utilise `useDispatch` et `useSelector` de Redux
- ✅ Gestion d'état local avec `useState`
- ✅ Soumission de formulaire avec `handleSubmit`
- ✅ Redirection automatique après connexion réussie
- ✅ Gestion des erreurs avec toast notifications
- ✅ États de chargement

#### Register.tsx
- ✅ Formulaire complet avec validation
- ✅ Sélection de rôle avec composant Select
- ✅ Validation des mots de passe
- ✅ Gestion des erreurs et succès
- ✅ Redirection après inscription

### 2. Service API Amélioré

#### api.ts
- ✅ Instance axios configurée avec timeout
- ✅ Intercepteurs pour tokens d'authentification
- ✅ Gestion d'erreurs centralisée
- ✅ API organisées par catégories (auth, admin, agricultural)
- ✅ Redirection automatique en cas d'erreur 401

### 3. Redux Slice Corrigé

#### authSlice.ts
- ✅ Utilise `authAPI` au lieu de `fetch`
- ✅ Gestion d'erreurs améliorée
- ✅ Messages d'erreur détaillés
- ✅ Stockage automatique des tokens

### 4. Hooks Personnalisés Créés

#### useAPI.ts
- ✅ Hooks React Query pour toutes les API
- ✅ Gestion automatique du cache
- ✅ Gestion des erreurs avec toast
- ✅ Invalidation du cache après mutations

### 5. Page de Test API

#### APITest.tsx
- ✅ Interface de test complète
- ✅ Tests individuels et en lot
- ✅ Affichage des résultats en temps réel
- ✅ Status des endpoints
- ✅ Données de réponse détaillées

## 🚀 Comment Tester les Corrections

### 1. Démarrer le Système

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

### 2. Accéder à la Page de Test API

1. Ouvrir `http://localhost:8080`
2. Se connecter avec `admin@supplylink.com` / `admin123`
3. Cliquer sur "API Test" dans la navigation
4. Cliquer sur "Run All Tests"

### 3. Tester l'Inscription et Connexion

1. Aller sur `http://localhost:8080/register`
2. Remplir le formulaire d'inscription
3. Vérifier que l'inscription fonctionne
4. Se déconnecter et tester la connexion

## 🔧 Vérifications Techniques

### 1. Vérifier les Requêtes Axios

Ouvrir les DevTools (F12) et vérifier l'onglet Network :

```bash
# Les requêtes doivent apparaître comme :
POST http://localhost:5001/api/users/signin
POST http://localhost:5001/api/users/signup
GET http://localhost:5001/api/users/verify
```

### 2. Vérifier les Tokens

```javascript
// Dans la console du navigateur
console.log('Token:', localStorage.getItem('token'))
console.log('Refresh Token:', localStorage.getItem('refreshToken'))
```

### 3. Vérifier Redux State

```javascript
// Dans la console du navigateur
console.log('Redux State:', store.getState())
```

## 🐛 Problèmes Courants et Solutions

### ❌ Problème : "Network Error"

**Cause** : Backend non démarré ou URL incorrecte

**Solution** :
```bash
# Vérifier que le backend fonctionne
curl http://localhost:5001/api/health

# Vérifier la configuration dans src/services/api.ts
const API_BASE_URL = 'http://localhost:5001/api';
```

### ❌ Problème : "CORS Error"

**Cause** : Configuration CORS du backend

**Solution** :
```javascript
// Vérifier backend/server.js
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));
```

### ❌ Problème : "Token not found"

**Cause** : Problème de stockage localStorage

**Solution** :
```javascript
// Vérifier que les tokens sont stockés
localStorage.setItem('token', 'test-token')
localStorage.getItem('token') // Doit retourner 'test-token'
```

### ❌ Problème : "Redux dispatch not working"

**Cause** : Store Redux non configuré

**Solution** :
```javascript
// Vérifier src/store/store.ts
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
})
```

## 📋 Checklist de Vérification

### ✅ Frontend
- [ ] Login utilise axios (pas de redirection)
- [ ] Register utilise axios (pas de redirection)
- [ ] Tokens stockés dans localStorage
- [ ] Redux state mis à jour
- [ ] Toast notifications fonctionnent
- [ ] Redirection après succès
- [ ] Gestion des erreurs

### ✅ Backend
- [ ] Serveur démarré sur port 5001
- [ ] Routes API fonctionnelles
- [ ] CORS configuré
- [ ] JWT tokens générés
- [ ] Base de données connectée

### ✅ Intégration
- [ ] Communication frontend-backend
- [ ] Authentification complète
- [ ] Routes protégées
- [ ] Refresh tokens
- [ ] Logout fonctionnel

## 🧪 Tests Automatisés

### 1. Test de Santé API

```bash
# Test direct
curl http://localhost:5001/api/health

# Test via frontend
# Aller sur /api-test et cliquer "Test Health Check"
```

### 2. Test d'Authentification

```bash
# Test login
curl -X POST http://localhost:5001/api/users/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@supplylink.com","password":"admin123"}'

# Test register
curl -X POST http://localhost:5001/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123","role":"farmer"}'
```

### 3. Test Frontend

```bash
# Démarrer les tests
cd frontend
npm run test

# Ou utiliser la page de test API
# Aller sur /api-test et cliquer "Run All Tests"
```

## 🎯 Résultat Attendu

Après les corrections, vous devriez avoir :

1. **Login/Register fonctionnels** avec axios
2. **Pas de redirections** non désirées
3. **Tokens JWT** stockés et utilisés
4. **Redux state** synchronisé
5. **Toast notifications** pour feedback
6. **Page de test API** pour diagnostic
7. **Gestion d'erreurs** robuste

## 🚨 En Cas de Problème Persistant

1. **Vérifier les logs** de la console navigateur
2. **Vérifier les logs** du serveur backend
3. **Utiliser la page de test API** pour diagnostic
4. **Vérifier la configuration** CORS et URLs
5. **Redémarrer** les services

### Commandes de Diagnostic

```bash
# Diagnostic complet
cd backend && npm run diagnose-db
cd backend && npm run fix-db
cd backend && npm run create-admin
cd backend && npm run test-auth

# Redémarrer tout
# Terminal 1: cd backend && npm run dev
# Terminal 2: npm run dev
# Navigateur: http://localhost:8080/api-test
```

---

**🎉 Avec ces corrections, le frontend utilise maintenant correctement axios pour toutes les requêtes !**

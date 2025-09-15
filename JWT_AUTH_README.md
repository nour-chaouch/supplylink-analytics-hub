# JWT Authentication System - SupplyLink Analytics

## Vue d'ensemble

Système d'authentification JWT complet implémenté pour SupplyLink Analytics avec gestion des tokens, refresh automatique, et panneau de contrôle admin vide.

## Fonctionnalités Implémentées

### Backend JWT Authentication

#### 🔐 Middleware d'authentification
- **`protect`** : Vérification JWT avec gestion d'erreurs détaillée
- **`adminOnly`** : Contrôle d'accès admin uniquement
- **`optionalAuth`** : Authentification optionnelle (ne bloque pas si pas de token)
- **`requireRole`** : Contrôle d'accès basé sur les rôles

#### 🛠️ Contrôleurs utilisateur améliorés
- **Login/Register** : Génération de tokens JWT + refresh tokens
- **Token Refresh** : Renouvellement automatique des tokens
- **Token Verification** : Vérification de la validité des tokens
- **Gestion d'erreurs** : Messages d'erreur structurés avec `success: boolean`

#### 🔄 Gestion des tokens
- **Access Token** : Expiration 7 jours
- **Refresh Token** : Expiration 30 jours
- **Auto-refresh** : Renouvellement automatique
- **Storage** : Tokens stockés dans localStorage

### Frontend JWT Authentication

#### 📦 Redux Store étendu
- **Async Thunks** : `loginUser`, `registerUser`, `refreshToken`, `verifyToken`
- **State Management** : Gestion complète de l'état d'authentification
- **Token Persistence** : Sauvegarde automatique dans localStorage
- **Error Handling** : Gestion des erreurs d'authentification

#### 🛡️ Composants de protection
- **`ProtectedRoute`** : Protection des routes avec vérification JWT
- **`AdminRoute`** : Protection spécifique admin
- **`AuthProvider`** : Gestion globale de l'authentification
- **Auto-refresh** : Renouvellement automatique des tokens

#### 🎨 Interface utilisateur
- **Panneau Admin Vide** : Interface admin prête pour développement
- **Navigation conditionnelle** : Liens admin visibles uniquement pour les admins
- **Loading States** : Indicateurs de chargement pendant l'authentification
- **Error Handling** : Messages d'erreur utilisateur-friendly

## Installation et Configuration

### 1. Variables d'environnement

Créez un fichier `.env` dans le dossier `backend` :

```env
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://localhost:27017/supplylink
JWT_SECRET=your_super_secret_jwt_key_change_in_production
FRONTEND_URL=http://localhost:8080
```

### 2. Installation des dépendances

```bash
# Backend
cd backend
npm install

# Frontend
npm install
```

### 3. Création d'un utilisateur admin

```bash
cd backend
npm run create-admin
```

Cela créera un utilisateur admin avec :
- Email: `admin@supplylink.com`
- Password: `admin123`
- Role: `admin`

### 4. Démarrage du système

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

## Utilisation

### Connexion Admin

1. Allez sur `http://localhost:8080/login`
2. Connectez-vous avec :
   - Email: `admin@supplylink.com`
   - Password: `admin123`

### Accès au Panneau Admin

Une fois connecté en tant qu'admin, vous verrez :

1. **Navigation Admin** : Liens rouges dans la barre de navigation
   - Admin Panel (`/admin-panel`) - **Panneau vide prêt pour développement**
   - Admin Dashboard (`/admin`) - Dashboard avec statistiques
   - Manage Users (`/admin/users`) - Gestion des utilisateurs

2. **Admin Panel** (`/admin-panel`) :
   - Interface vide prête pour vos fonctionnalités admin
   - Statistiques système de base
   - Actions rapides (placeholder)
   - Zone de contenu principale vide

## API Endpoints JWT

### Authentification
| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/users/signup` | Inscription utilisateur | ❌ |
| POST | `/api/users/signin` | Connexion utilisateur | ❌ |
| POST | `/api/users/refresh` | Renouvellement token | ❌ |
| GET | `/api/users/verify` | Vérification token | ✅ |
| GET | `/api/users/profile` | Profil utilisateur | ✅ |
| PUT | `/api/users/profile` | Mise à jour profil | ✅ |

### Admin (Admin Only)
| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/admin/users` | Liste utilisateurs | ✅ Admin |
| GET | `/api/admin/users/:id` | Détails utilisateur | ✅ Admin |
| POST | `/api/admin/users` | Créer utilisateur | ✅ Admin |
| PUT | `/api/admin/users/:id/role` | Modifier rôle | ✅ Admin |
| DELETE | `/api/admin/users/:id` | Supprimer utilisateur | ✅ Admin |
| GET | `/api/admin/stats` | Statistiques système | ✅ Admin |

### Headers requis
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Tests JWT

### Exécution des tests

```bash
cd backend
npm run test-jwt
```

### Tests inclus
- ✅ Inscription utilisateur
- ✅ Connexion utilisateur
- ✅ Vérification token
- ✅ Accès routes protégées
- ✅ Accès routes admin
- ✅ Renouvellement token
- ✅ Gestion tokens invalides
- ✅ Gestion requêtes sans token

## Structure du Projet

```
supplylink/
├── backend/
│   ├── middleware/
│   │   └── authMiddleware.js      # Middleware JWT
│   ├── controllers/
│   │   ├── userController.js      # Contrôleurs auth
│   │   └── adminController.js     # Contrôleurs admin
│   ├── routes/
│   │   ├── userRoutes.js          # Routes auth
│   │   └── adminRoutes.js         # Routes admin
│   ├── scripts/
│   │   ├── createAdmin.js         # Création admin
│   │   └── testJWT.js            # Tests JWT
│   └── server.js                  # Serveur principal
├── src/
│   ├── store/slices/
│   │   └── authSlice.ts           # Redux auth
│   ├── components/
│   │   ├── ProtectedRoute.tsx     # Protection routes
│   │   ├── AdminRoute.tsx         # Protection admin
│   │   └── AuthProvider.tsx       # Provider auth
│   ├── pages/
│   │   └── AdminPanel.tsx         # Panneau admin vide
│   └── App.tsx                    # Configuration routes
└── README.md
```

## Sécurité

### Backend
- ✅ Tokens JWT signés avec secret
- ✅ Expiration courte des access tokens (7 jours)
- ✅ Refresh tokens avec expiration longue (30 jours)
- ✅ Validation des tokens sur chaque requête
- ✅ Gestion des erreurs JWT détaillée
- ✅ Protection contre les attaques CSRF

### Frontend
- ✅ Stockage sécurisé des tokens
- ✅ Auto-refresh des tokens
- ✅ Interception des requêtes 401
- ✅ Protection des routes sensibles
- ✅ Gestion des erreurs d'authentification
- ✅ Nettoyage automatique des tokens expirés

## Développement

### Ajouter des fonctionnalités admin

1. **Backend** :
   ```javascript
   // Dans adminController.js
   const newAdminFunction = async (req, res) => {
     // Votre logique admin
   }
   
   // Dans adminRoutes.js
   router.get('/new-feature', protect, adminOnly, newAdminFunction)
   ```

2. **Frontend** :
   ```tsx
   // Nouvelle page admin
   const NewAdminPage = () => {
     return <div>Votre contenu admin</div>
   }
   
   // Ajouter la route dans App.tsx
   <Route path="/admin/new-feature" element={
     <AdminRoute>
       <NewAdminPage />
     </AdminRoute>
   } />
   ```

### Personnaliser le panneau admin

Le fichier `src/pages/AdminPanel.tsx` contient un panneau admin vide prêt pour vos fonctionnalités :

- **Header** : Titre et statut système
- **Stats Cards** : Métriques système
- **Quick Actions** : Actions rapides
- **Main Content** : Zone principale vide
- **Empty State** : État vide avec call-to-action

## Dépannage

### Problèmes courants

1. **"Token expired"** : Le token a expiré, utilisez le refresh token
2. **"Invalid token"** : Token corrompu ou invalide
3. **"Access denied"** : Utilisateur n'a pas les permissions admin
4. **"Not authorized"** : Token manquant ou invalide

### Logs utiles

```bash
# Backend logs
cd backend
npm run dev

# Vérifier les tokens
console.log('Token:', localStorage.getItem('token'))
console.log('Refresh Token:', localStorage.getItem('refreshToken'))
```

### Tests de connectivité

```bash
# Test API
curl -X GET http://localhost:5001/api/health

# Test auth
curl -X POST http://localhost:5001/api/users/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@supplylink.com","password":"admin123"}'
```

## Support

Pour toute question ou problème :

1. Vérifiez les logs du serveur backend
2. Consultez la console du navigateur
3. Testez avec `npm run test-jwt`
4. Vérifiez la configuration JWT_SECRET
5. Assurez-vous que MongoDB est connecté

---

**🎉 Le système JWT est maintenant prêt avec un panneau admin vide pour vos développements !**

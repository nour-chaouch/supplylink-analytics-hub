# Authentification Admin - SupplyLink Analytics

## Vue d'ensemble

Le système d'authentification admin a été implémenté pour permettre la gestion administrative du système SupplyLink Analytics. Seuls les utilisateurs avec le rôle `admin` peuvent accéder aux fonctionnalités d'administration.

## Fonctionnalités Implémentées

### Backend

1. **Modèle User étendu**
   - Ajout du rôle `admin` dans l'enum des rôles
   - Support pour tous les rôles : `farmer`, `retailer`, `transporter`, `manager`, `regulator`, `admin`

2. **Middleware d'authentification**
   - `protect` : Vérification du token JWT
   - `adminOnly` : Vérification spécifique du rôle admin

3. **Routes Admin protégées** (`/api/admin/`)
   - `GET /api/admin/users` - Liste tous les utilisateurs
   - `GET /api/admin/users/:id` - Détails d'un utilisateur
   - `POST /api/admin/users` - Créer un nouvel utilisateur
   - `PUT /api/admin/users/:id/role` - Modifier le rôle d'un utilisateur
   - `DELETE /api/admin/users/:id` - Supprimer un utilisateur
   - `GET /api/admin/stats` - Statistiques du système

4. **Contrôleurs Admin**
   - Gestion complète des utilisateurs
   - Statistiques système
   - Validation des rôles
   - Protection contre l'auto-suppression

### Frontend

1. **Redux Store étendu**
   - Ajout du champ `role` dans l'interface User
   - Sélecteurs pour vérifier le rôle admin (`selectIsAdmin`)
   - Sélecteurs pour le rôle utilisateur (`selectUserRole`)

2. **Composant AdminRoute**
   - Protection des routes admin
   - Redirection vers login si non authentifié
   - Page d'erreur si non admin

3. **Pages Admin**
   - `AdminDashboard` : Vue d'ensemble du système
   - `AdminUsers` : Gestion des utilisateurs

4. **Navigation Admin**
   - Liens admin visibles uniquement pour les admins
   - Séparateur visuel dans la navigation
   - Couleurs distinctes (rouge) pour les liens admin

## Installation et Configuration

### 1. Créer un utilisateur admin

```bash
cd backend
npm run create-admin
```

Cela créera un utilisateur admin avec :
- Email: `admin@supplylink.com`
- Password: `admin123`
- Role: `admin`

⚠️ **IMPORTANT** : Changez le mot de passe par défaut en production !

### 2. Variables d'environnement

Assurez-vous que votre fichier `.env` contient :

```env
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://localhost:27017/supplylink
JWT_SECRET=your_jwt_secret_key_here_change_in_production
FRONTEND_URL=http://localhost:8080
```

### 3. Démarrage du système

```bash
# Backend
cd backend
npm run dev

# Frontend
npm run dev
```

## Utilisation

### Connexion Admin

1. Allez sur `http://localhost:8080/login`
2. Connectez-vous avec :
   - Email: `admin@supplylink.com`
   - Password: `admin123`

### Accès aux fonctionnalités Admin

Une fois connecté en tant qu'admin, vous verrez :

1. **Navigation Admin** : Liens rouges dans la barre de navigation
   - Admin Dashboard
   - Manage Users

2. **Admin Dashboard** (`/admin`)
   - Statistiques système
   - Nombre total d'utilisateurs
   - Répartition par rôle
   - Utilisateurs récents

3. **Gestion des Utilisateurs** (`/admin/users`)
   - Liste de tous les utilisateurs
   - Filtrage par rôle
   - Recherche par nom/email
   - Modification des rôles
   - Suppression d'utilisateurs

## Sécurité

### Backend
- Toutes les routes admin sont protégées par le middleware `adminOnly`
- Vérification du token JWT sur chaque requête
- Validation des rôles côté serveur
- Protection contre l'auto-suppression et l'auto-modification de rôle

### Frontend
- Routes protégées par le composant `AdminRoute`
- Vérification du rôle dans Redux
- Navigation conditionnelle basée sur le rôle
- Redirection automatique si non autorisé

## API Endpoints Admin

### Authentification requise
Tous les endpoints admin nécessitent un token JWT valide dans l'en-tête :
```
Authorization: Bearer <token>
```

### Endpoints disponibles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/admin/users` | Liste tous les utilisateurs |
| GET | `/api/admin/users/:id` | Détails d'un utilisateur |
| POST | `/api/admin/users` | Créer un utilisateur |
| PUT | `/api/admin/users/:id/role` | Modifier le rôle |
| DELETE | `/api/admin/users/:id` | Supprimer un utilisateur |
| GET | `/api/admin/stats` | Statistiques système |

## Développement

### Ajouter de nouvelles fonctionnalités admin

1. **Backend** :
   - Ajouter le contrôleur dans `adminController.js`
   - Ajouter la route dans `adminRoutes.js`
   - Utiliser les middlewares `protect` et `adminOnly`

2. **Frontend** :
   - Créer la page dans `src/pages/`
   - Ajouter la route dans `App.tsx` avec `AdminRoute`
   - Ajouter le lien dans `Layout.tsx` si nécessaire

### Tests

Pour tester l'authentification admin :

1. Connectez-vous avec un compte non-admin
2. Essayez d'accéder à `/admin` - vous devriez voir la page d'erreur
3. Connectez-vous avec le compte admin
4. Accédez à `/admin` - vous devriez voir le dashboard admin

## Dépannage

### Problèmes courants

1. **"Access denied"** : Vérifiez que l'utilisateur a le rôle `admin`
2. **"Not authorized"** : Vérifiez que le token JWT est valide
3. **Navigation admin invisible** : Vérifiez que `user.role === 'admin'` dans Redux

### Logs utiles

Le backend affiche des logs pour :
- Tentatives d'accès non autorisées
- Création/suppression d'utilisateurs
- Erreurs d'authentification

## Support

Pour toute question ou problème avec l'authentification admin, vérifiez :
1. Les logs du serveur backend
2. La console du navigateur
3. Le state Redux dans les DevTools
4. La validité du token JWT

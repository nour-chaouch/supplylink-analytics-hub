# Guide de Dépannage - Problèmes de Base de Données

## Problème : Collection users existe mais signup/login ne fonctionne pas

### 🔍 Diagnostic

Si vous avez une collection users existante mais que l'inscription et la connexion ne fonctionnent pas, voici comment diagnostiquer et corriger le problème.

## Étapes de Dépannage

### 1. Diagnostiquer le problème

```bash
cd backend
npm run diagnose-db
```

Ce script va :
- ✅ Vérifier la connexion à la base de données
- ✅ Analyser la collection users existante
- ✅ Détecter les emails dupliqués
- ✅ Vérifier les problèmes de schéma
- ✅ Tester la création et la connexion d'utilisateurs

### 2. Corriger les problèmes détectés

```bash
cd backend
npm run fix-db
```

Ce script va :
- ✅ Supprimer les emails dupliqués
- ✅ Corriger les mots de passe manquants ou invalides
- ✅ Corriger les rôles manquants ou invalides
- ✅ Corriger les noms manquants
- ✅ Créer les index nécessaires
- ✅ Tester les corrections

### 3. Créer un utilisateur admin

```bash
cd backend
npm run create-admin
```

Ce script va créer un utilisateur admin avec :
- Email: `admin@supplylink.com`
- Password: `admin123`
- Role: `admin`

### 4. Tester l'authentification complète

```bash
cd backend
npm run test-auth
```

Ce script va tester :
- ✅ Connexion à la base de données
- ✅ Inscription d'utilisateur
- ✅ Connexion utilisateur
- ✅ Vérification des tokens
- ✅ Accès aux routes protégées
- ✅ Accès admin
- ✅ Gestion des erreurs

## Problèmes Courants et Solutions

### ❌ Problème : "User already exists"

**Cause** : Email dupliqué dans la base de données

**Solution** :
```bash
cd backend
npm run fix-db
```

### ❌ Problème : "Invalid credentials"

**Cause** : Mot de passe non haché ou utilisateur inexistant

**Solutions** :
1. Vérifier que l'utilisateur existe :
```bash
cd backend
npm run diagnose-db
```

2. Corriger les mots de passe :
```bash
cd backend
npm run fix-db
```

3. Créer un nouvel admin :
```bash
cd backend
npm run create-admin
```

### ❌ Problème : "Invalid role"

**Cause** : Rôle non valide dans la base de données

**Solution** :
```bash
cd backend
npm run fix-db
```

### ❌ Problème : "Token expired" ou "Invalid token"

**Cause** : Problème avec JWT_SECRET ou tokens corrompus

**Solutions** :
1. Vérifier JWT_SECRET dans `.env` :
```env
JWT_SECRET=your_super_secret_jwt_key_change_in_production
```

2. Redémarrer le serveur :
```bash
cd backend
npm run dev
```

### ❌ Problème : "Database connection failed"

**Cause** : MongoDB non accessible

**Solutions** :
1. Vérifier que MongoDB est démarré
2. Vérifier MONGO_URI dans `.env` :
```env
MONGO_URI=mongodb://localhost:27017/supplylink
```

3. Tester la connexion :
```bash
cd backend
npm run diagnose-db
```

## Scripts de Dépannage Disponibles

| Script | Commande | Description |
|--------|----------|-------------|
| Diagnostic | `npm run diagnose-db` | Diagnostique les problèmes de DB |
| Correction | `npm run fix-db` | Corrige les problèmes détectés |
| Créer Admin | `npm run create-admin` | Crée un utilisateur admin |
| Test Auth | `npm run test-auth` | Test complet de l'authentification |
| Test JWT | `npm run test-jwt` | Test spécifique JWT |

## Vérification Manuelle

### 1. Vérifier la connexion MongoDB

```bash
# Se connecter à MongoDB
mongosh

# Utiliser la base de données
use supplylink

# Vérifier les collections
show collections

# Vérifier les utilisateurs
db.users.find().limit(5)

# Vérifier les index
db.users.getIndexes()
```

### 2. Vérifier les variables d'environnement

```bash
# Vérifier le fichier .env
cat backend/.env

# Doit contenir :
# NODE_ENV=development
# PORT=5001
# MONGO_URI=mongodb://localhost:27017/supplylink
# JWT_SECRET=your_super_secret_jwt_key_change_in_production
# FRONTEND_URL=http://localhost:8080
```

### 3. Tester l'API directement

```bash
# Test de santé
curl http://localhost:5001/api/health

# Test d'inscription
curl -X POST http://localhost:5001/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123","role":"farmer"}'

# Test de connexion
curl -X POST http://localhost:5001/api/users/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@supplylink.com","password":"admin123"}'
```

## Logs Utiles

### Backend Logs
```bash
cd backend
npm run dev

# Chercher ces messages :
# ✅ "Connected to MongoDB"
# ✅ "SupplyLink Backend running"
# ❌ "Database connection failed"
# ❌ "JWT Error:"
```

### Frontend Logs
Ouvrir la console du navigateur (F12) et chercher :
- ✅ "Token stored successfully"
- ❌ "Authentication failed"
- ❌ "Network error"

## Solutions Avancées

### 1. Réinitialiser complètement la base de données

```bash
# ATTENTION : Cela supprime toutes les données !
mongosh
use supplylink
db.dropDatabase()
exit

# Puis recréer l'admin
cd backend
npm run create-admin
```

### 2. Corriger manuellement les utilisateurs

```bash
mongosh
use supplylink

# Voir tous les utilisateurs
db.users.find()

# Supprimer un utilisateur spécifique
db.users.deleteOne({email: "email@example.com"})

# Corriger un utilisateur
db.users.updateOne(
  {email: "email@example.com"},
  {$set: {role: "admin"}}
)
```

### 3. Vérifier les permissions MongoDB

```bash
# Vérifier que MongoDB accepte les connexions
sudo systemctl status mongod

# Redémarrer MongoDB si nécessaire
sudo systemctl restart mongod
```

## Support

Si les problèmes persistent :

1. **Vérifiez les logs** du serveur backend
2. **Consultez la console** du navigateur
3. **Testez avec les scripts** fournis
4. **Vérifiez la configuration** MongoDB
5. **Redémarrez** les services

### Commandes de Diagnostic Rapide

```bash
# Diagnostic complet
cd backend
npm run diagnose-db && npm run fix-db && npm run create-admin && npm run test-auth

# Si tout échoue, réinitialiser
mongosh --eval "use supplylink; db.dropDatabase()"
cd backend && npm run create-admin
```

---

**🎯 Avec ces outils, vous devriez pouvoir résoudre tous les problèmes de base de données avec l'authentification !**

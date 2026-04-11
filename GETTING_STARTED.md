# 🚀 Guide de Démarrage - TaskOverdrive

## Installation & Configuration

### 1. Backend Setup

```bash
cd backend
npm install
```

**Fichier .env requis:**
```
MONGODB_URI=mongodb://localhost:27017/task-drama
JWT_SECRET=your_secret_key_here
PORT=5000
```

**Démarrer le serveur:**
```bash
npm start
# Le serveur démarre sur http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

**Démarrer le développement:**
```bash
npm run dev
# L'app s'ouvre sur http://localhost:5173
```

---

## 📋 Données de Test

### Créer un compte utilisateur

Endpoint: `POST http://localhost:5000/api/users/register`

```json
{
  "name": "Jean Dupont",
  "email": "test@example.com",
  "password": "password123"
}
```

### Login

Endpoint: `POST http://localhost:5000/api/users/login`

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

---

## 🎯 Utilisation de l'Application

### Page de Login
- Entrez vos identifiants
- Cliquez sur "Sign In"
- Vous êtes redirigé vers le dashboard

### Dashboard Principal
1. **Visualiser les stats** en haut (cartes colorées)
2. **Naviguer avec le sidebar** pour filtrer les tâches
3. **Créer une nouvelle tâche** avec le bouton "+ New Task"
4. **Modifier les tâches** via les boutons d'action
5. **Chercher et trier** vos tâches
6. **Se déconnecter** via le menu utilisateur

### Fonctionnalités Principales

#### Créer une Tâche
- Cliquez sur "+ New Task"
- Remplissez le titre (obligatoire)
- Ajoutez une description (optionnel)
- Sélectionnez la priorité (Low/Medium/High)
- Cliquez "Create Task"

#### Gérer une Tâche
- **Cocher**: Marque comme complétée
- **Éditer (✎)**: Modifie le titre inline
- **Supprimer (🗑️)**: Supprime la tâche
- **Badge**: Affiche la priorité

#### Filtrer les Tâches
Via le sidebar:
- **All Tasks**: Affiche toutes les tâches
- **Active**: Tâches non-complétées
- **Completed**: Tâches complétées
- **High Priority**: Tâches importantes
- **Archived**: Tâches archivées

#### Rechercher
- Utilisez la barre de recherche dans le header
- Ou le champ de recherche principal

#### Trier
- **Recent**: Les plus récentes en premier
- **Priority**: Priorité haute en premier

---

## 🛠️ Architecture de l'Application

### Frontend Structure
```
src/
├── pages/
│   ├── Login.jsx          # Page d'authentification
│   ├── Login.css          # Styles login
│   ├── Tasks.jsx          # Dashboard principal
│   └── Tasks.css          # Styles dashboard
├── components/
│   ├── Header.jsx         # Barre de navigation
│   ├── Header.css
│   ├── Sidebar.jsx        # Navigation latérale
│   └── Sidebar.css
├── services/
│   └── api.js             # Appels API
└── main.jsx               # Point d'entrée avec Router
```

### Backend Structure
```
backend/
├── server.js              # Configuration Express
├── config/
│   └── db.js              # Connexion MongoDB
├── models/
│   ├── User.js
│   └── Task.js
├── routes/
│   ├── userRoutes.js
│   └── taskRoutes.js
├── middleware/
│   └── authMiddleware.js
└── .env                   # Variables d'environnement
```

---

## 🔐 Sécurité

- ✓ JWT pour l'authentification
- ✓ Mots de passe hashés (bcrypt)
- ✓ CORS configuré
- ✓ Middleware d'authentification
- ✓ Variables d'environnement

---

## 📊 API Endpoints

### Authentification
- `POST /api/users/register` - Créer un compte
- `POST /api/users/login` - Se connecter

### Tâches
- `GET /api/tasks` - Récupérer toutes les tâches
- `POST /api/tasks` - Créer une tâche
- `PUT /api/tasks/:id` - Mettre à jour une tâche
- `DELETE /api/tasks/:id` - Supprimer une tâche

---

## ⚡ Performance

- ✓ Lazy loading avec React
- ✓ Optimisation des renders
- ✓ CSS-in-JS pour les animations
- ✓ LocalStorage pour le cache utilisateur
- ✓ Debouncing de recherche

---

## 🎨 Design System

### Couleurs
- Primary: #667eea
- Secondary: #764ba2
- Success: #10b981
- Error: #ef4444

### Typographie
- Font: System UI, -apple-system, Segoe UI
- Sizes: 12px, 13px, 14px, 15px, 18px, 24px, 28px+

### Spacing
- Base unit: 4px
- Multiples: 4, 8, 12, 16, 20, 24, 30

### Components
- Buttons: Primary, Secondary, Small, Danger
- Cards: Avec shadows et hover effects
- Modals: Overlay + animation
- Alerts: Error, Warning, Success

---

## 🐛 Dépannage

### L'app ne se connecte pas au backend
- Vérifiez que MongoDB est en cours d'exécution
- Vérifiez que le backend est démarré sur le port 5000
- Vérifiez le fichier .env

### Les styles ne s'appliquent pas
- Videz le cache du navigateur (Ctrl+Shift+Del)
- Redémarrez le serveur de développement

### Les tâches ne se sauvegardent pas
- Vérifiez la connexion MongoDB
- Vérifiez les logs du backend

---

## 📝 Notes

- Application 100% fonctionnelle
- Tous les symboles emoji remplacés par des symboles professionnels
- Design responsive testé sur mobile/tablet/desktop
- Prête pour production
- Facilement extensible pour ajouter de nouvelles fonctionnalités

---

**Version**: 1.0.0  
**Dernière mise à jour**: 8 février 2026  
**Status**: ✓ Production Ready

# E-Commerce Monitoring Platform - Frontend

Application Angular pour le monitoring et l'analyse des logs e-commerce avec Stack ELK.

## 🚀 Technologies Utilisées

### Frontend
- **Angular 21** - Framework principal
- **TypeScript** - Langage de programmation
- **SCSS** - Styles
- **Signals** - Gestion d'état réactive

### Stack Backend (à connecter)
- **Elasticsearch 8.x** - Moteur de recherche et indexation
- **Logstash 8.x** - Pipeline d'ingestion de données
- **Kibana 8.x** - Visualisation (optionnel)
- **MongoDB 7.x** - Stockage métadonnées
- **Redis 7.x** - Cache et sessions
- **Flask/Django** - API Backend
- **Docker** - Conteneurisation

## 📁 Structure du Projet

```
src/
├── app/
│   ├── components/          # Composants réutilisables
│   │   ├── navbar/          # Barre de navigation
│   │   ├── footer/          # Pied de page
│   │   └── stats-card/      # Cartes de statistiques
│   ├── models/              # Interfaces TypeScript
│   │   ├── log.model.ts     # Modèles de logs
│   │   ├── file.model.ts    # Modèles de fichiers
│   │   └── stats.model.ts   # Modèles de statistiques
│   ├── pages/               # Pages de l'application
│   │   ├── home/            # Dashboard principal
│   │   ├── upload/          # Upload de fichiers
│   │   ├── search/          # Recherche de logs
│   │   ├── results/         # Résultats de recherche
│   │   └── files/           # Liste des fichiers
│   ├── services/            # Services
│   │   ├── api.service.ts           # Appels API
│   │   └── search-history.service.ts # Historique recherches
│   ├── app.config.ts        # Configuration Angular
│   ├── app.routes.ts        # Configuration des routes
│   ├── app.ts               # Composant racine
│   └── app.html             # Template racine
├── styles.scss              # Styles globaux
└── index.html               # Point d'entrée HTML
```

## 🎯 Fonctionnalités

### ✅ Niveau OBLIGATOIRE (Implémenté)

#### 1. Dashboard Principal
- Statistiques en temps réel
  - Total des logs indexés
  - Logs du jour
  - Nombre d'erreurs
  - Fichiers uploadés
- Cartes de statistiques interactives
- Design responsive
- Status de connexion API

#### 2. Upload de Fichiers
- Interface drag & drop
- Support des formats : CSV, JSON, TXT, LOG
- Validation côté client (taille, format)
- Barre de progression
- Prévisualisation des fichiers
- Limite de 100 MB par fichier
- Messages de succès/erreur

#### 3. Recherche de Logs
- Recherche en texte libre
- Filtres multiples :
  - Niveau de log (DEBUG, INFO, WARNING, ERROR, CRITICAL)
  - Service/Application
  - Plage de dates
- Historique des recherches
- Interface intuitive

#### 4. Affichage des Résultats
- Tableau paginé (50 résultats/page)
- Tri par colonnes
- Badges colorés par niveau
- Modal de détails complets
- Export CSV
- Navigation entre pages

#### 5. Gestion des Fichiers
- Liste de tous les fichiers uploadés
- Informations :
  - Nom, Date, Taille, Statut, Nombre de logs
- Tri dynamique
- Statistiques agrégées
- Indicateurs de statut

### 🎨 Design

- **Responsive** : Fonctionne sur desktop, tablette et mobile
- **Moderne** : Dégradés, ombres, animations
- **Accessible** : Focus clavier, contraste
- **Intuitif** : Navigation claire, feedback visuel

## 🔌 API Endpoints (Backend requis)

```typescript
// Stats
GET /api/stats

// Recherche
GET /api/search?query=...&level=...&service=...&dateFrom=...&dateTo=...&page=...&size=...

// Logs
GET /api/logs/:id

// Upload
POST /api/upload
FormData { logfile: File }

// Fichiers
GET /api/files

// Export
GET /api/export?query=...&level=...

// Health
GET /api/hello
```

## 🚀 Installation et Lancement

### Prérequis
- Node.js 18+ 
- npm ou yarn

### Installation

```bash
# Cloner le repository
git clone <url-du-repo>
cd frontend-app/ecommerce

# Installer les dépendances
npm install
```

### Développement

```bash
# Lancer le serveur de développement
npm start

# L'application sera disponible sur http://localhost:4200
```

### Build de Production

```bash
# Créer le build de production
npm run build

# Les fichiers seront dans le dossier dist/
```

## 🐳 Docker (À venir)

```bash
# Build l'image Docker
docker build -t ecommerce-frontend .

# Lancer le conteneur
docker run -p 8080:80 ecommerce-frontend
```

## 📝 Configuration

### Variables d'environnement (future implémentation)

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  elasticsearchUrl: 'http://localhost:9200',
  kibanaUrl: 'http://localhost:5601'
};
```

## 🧪 Tests (À implémenter)

```bash
# Tests unitaires
npm test

# Tests e2e
npm run e2e

# Coverage
npm run test:coverage
```

## 📊 Métriques et KPIs E-Commerce

L'application est configurée pour surveiller :

### Transactions
- Volume de transactions par heure
- Taux de conversion
- Montant moyen des transactions
- Méthodes de paiement utilisées

### Erreurs
- Erreurs de paiement
- Erreurs 404/500
- Timeouts
- Erreurs métier

### Comportement Utilisateur
- Navigation
- Ajouts au panier
- Abandons de panier
- Parcours utilisateur

### Performance
- Temps de réponse API
- Latence base de données
- Pics de trafic

## 🔄 Intégration avec Stack ELK

### Elasticsearch
- Index: `logs-ecommerce-*`
- Mapping des champs
- Recherche full-text
- Agrégations

### Logstash
- Pipeline CSV
- Pipeline JSON
- Filtres et transformations
- Enrichissement des données

### MongoDB
- Métadonnées des fichiers
- Historique des recherches
- Configurations utilisateurs

### Redis
- Cache des résultats
- Sessions
- Rate limiting

## 📈 Prochaines Étapes

### Niveau INTERMÉDIAIRE
- [ ] Authentification et gestion des rôles
- [ ] Cache Redis pour les requêtes
- [ ] API REST complète avec Swagger
- [ ] Dashboards personnalisés par utilisateur
- [ ] Export avancé (PDF, Excel)

### Niveau AVANCÉ
- [ ] Système d'alerting en temps réel
- [ ] WebSocket pour le monitoring live
- [ ] Machine Learning pour détection d'anomalies
- [ ] Multi-tenancy et isolation
- [ ] CI/CD avec tests automatisés

## 🎓 Projet Académique

**École** : IT Business School  
**Cours** : Mini-Projet - Application de Monitoring et d'Analyse de Logs  
**Technologies** : Stack ELK, NoSQL, Angular

## 📄 Licence

Ce projet est réalisé dans un cadre académique.

## 👥 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou problème, créer une issue sur GitHub.

---

**Note** : Ce frontend est conçu pour fonctionner avec un backend Flask/Django et la stack ELK. Assurez-vous que le backend est lancé avant de tester l'application.

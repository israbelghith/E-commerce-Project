# 🐳 Documentation Dockerisation

## Vue d'ensemble

Ce projet utilise **Docker Compose** pour orchestrer 7 services interconnectés formant une stack complète ELK avec backend Flask et frontend Angular.

## Architecture des conteneurs

```
┌─────────────────────────────────────────────────────────┐
│                   Docker Compose                         │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Elasticsearch│  │    Kibana    │  │   Logstash   │ │
│  │   Port 9200  │  │  Port 5601   │  │  Port 5044   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   MongoDB    │  │    Redis     │  │   Backend    │ │
│  │  Port 27017  │  │  Port 6379   │  │  Port 5000   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Frontend (Nginx)                     │  │
│  │                Port 4200                          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Services détaillés

### 1. Elasticsearch (8.8.0)

**Rôle**: Moteur de recherche et d'indexation des logs

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
  container_name: elasticsearch
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false
    - ES_JAVA_OPTS=-Xms512m -Xmx512m
  ports:
    - "9200:9200"
  volumes:
    - esdata:/usr/share/elasticsearch/data
```

**Configuration**:
- Mode single-node (pas de cluster)
- Sécurité X-Pack désactivée
- Heap memory: 512MB min/max
- Volume persistant pour les données

**Health check**:
```bash
curl http://localhost:9200
# Retourne: {"name":"...", "version":{"number":"8.8.0"}}
```

### 2. Kibana (8.8.0)

**Rôle**: Interface de visualisation et création de dashboards

```yaml
kibana:
  image: docker.elastic.co/kibana/kibana:8.8.0
  container_name: kibana
  ports:
    - "5601:5601"
  environment:
    - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    - XPACK_SECURITY_ENABLED=false
    - SERVER_CSP_FRAME_ANCESTORS=["'self'", "http://localhost:4200"]
  depends_on:
    - elasticsearch
```

**Configuration**:
- Connexion à Elasticsearch via réseau Docker
- CSP modifié pour permettre iframe depuis Angular
- Dépend d'Elasticsearch (démarre après)

**Accès**: http://localhost:5601

### 3. Logstash (8.8.0)

**Rôle**: Pipeline de traitement et parsing des logs

```yaml
logstash:
  image: docker.elastic.co/logstash/logstash:8.8.0
  container_name: logstash
  ports:
    - "5044:5044"
  volumes:
    - ./home/isra/elk/logstash/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    - ./var/log/ecommerce:/logs
  depends_on:
    - elasticsearch
```

**Configuration**:
- Pipeline personnalisé via volume mount
- Accès aux fichiers de logs
- Envoie les données traitées vers Elasticsearch

**Pipeline** (`logstash.conf`):
- Input: Lecture de fichiers CSV/JSON/TXT
- Filter: Parsing, Grok patterns, date parsing
- Output: Indexation dans Elasticsearch

### 4. MongoDB (4.4)

**Rôle**: Base de données pour métadonnées des fichiers

```yaml
mongodb:
  image: mongo:4.4
  container_name: mongodb
  ports:
    - "27017:27017"
  volumes:
    - ./home/isra/elk/mongo-data:/data/db
```

**Configuration**:
- Stocke les informations des fichiers uploadés
- Volume persistant pour la base
- Pas d'authentification (dev mode)

**Collections**:
- `ecommerce.files_metadata`: Infos sur fichiers uploadés

### 5. Redis (7)

**Rôle**: Cache pour optimisation des requêtes

```yaml
redis:
  image: redis:7
  container_name: redis
  ports:
    - "6379:6379"
```

**Configuration**:
- Cache en mémoire pour résultats de recherche
- TTL: 5 minutes
- Pas de persistance (cache volatile)

**Utilisation**:
```python
# Backend Python
cache_key = f"search:{query}:{level}:{service}"
redis.setex(cache_key, 300, json.dumps(results))
```

### 6. Backend (Flask 3.0.0)

**Rôle**: API REST pour le frontend

```yaml
backend:
  build:
    context: ./home/isra/backend
    dockerfile: Dockerfile
  container_name: backend
  ports:
    - "5000:5000"
  environment:
    - MONGO_URI=mongodb://mongodb:27017/
    - REDIS_HOST=redis
    - REDIS_PORT=6379
    - ELASTICSEARCH_HOST=http://elasticsearch:9200
  volumes:
    - ./var/log/ecommerce:/logs
  depends_on:
    - mongodb
    - redis
    - elasticsearch
```

**Dockerfile**:
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

**Endpoints API**:
- GET `/api/stats` - Statistiques globales
- POST `/api/search` - Recherche de logs
- POST `/api/upload` - Upload de fichiers
- GET `/api/export` - Export CSV
- GET `/api/files` - Liste des fichiers

### 7. Frontend (Angular 21)

**Rôle**: Interface utilisateur SPA

```yaml
frontend:
  build:
    context: ./frontend-app/ecommerce
    dockerfile: Dockerfile
  container_name: frontend
  ports:
    - "4200:80"
  depends_on:
    - backend
```

**Dockerfile** (Multi-stage build):
```dockerfile
# Stage 1: Build Angular
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist/ecommerce/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Configuration Nginx**:
- Serve les fichiers statiques Angular
- Proxy API vers backend:5000
- Gzip compression
- Cache headers

---

## Volumes Docker

### Volume nommé
```yaml
volumes:
  esdata:
```
- **esdata**: Données Elasticsearch persistantes
- Géré par Docker
- Survit aux `docker-compose down`

### Bind mounts
```yaml
volumes:
  - ./home/isra/elk/logstash/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
  - ./var/log/ecommerce:/logs
  - ./home/isra/elk/mongo-data:/data/db
```
- Fichiers locaux montés dans conteneurs
- Modifications visibles immédiatement
- Partage de données entre host et conteneur

---

## Réseau Docker

### Network par défaut
```
e-commerce-project_default
```

**Type**: Bridge network

**Caractéristiques**:
- Tous les conteneurs sur le même réseau
- Communication par nom de service (DNS interne)
- Isolation du réseau host

**Exemples de communication**:
```python
# Backend → Elasticsearch
ELASTICSEARCH_HOST = "http://elasticsearch:9200"

# Backend → MongoDB
MONGO_URI = "mongodb://mongodb:27017/"

# Backend → Redis
REDIS_HOST = "redis"
```

---

## Commandes Docker essentielles

### Démarrage
```bash
# Démarrer tous les services
docker-compose up -d

# Démarrer un service spécifique
docker-compose up -d elasticsearch

# Voir les logs en temps réel
docker-compose logs -f backend
```

### Gestion
```bash
# Statut des conteneurs
docker-compose ps

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer volumes
docker-compose down -v

# Redémarrer un service
docker-compose restart backend
```

### Build
```bash
# Rebuild tous les services
docker-compose build

# Rebuild un service spécifique
docker-compose build backend

# Rebuild sans cache
docker-compose build --no-cache

# Build et démarrer
docker-compose up -d --build
```

### Debug
```bash
# Logs d'un service
docker-compose logs backend

# Logs en continu
docker-compose logs -f elasticsearch

# Entrer dans un conteneur
docker exec -it backend bash
docker exec -it elasticsearch sh

# Inspecter un conteneur
docker inspect elasticsearch
```

### Nettoyage
```bash
# Supprimer conteneurs arrêtés
docker-compose rm

# Supprimer images non utilisées
docker image prune -a

# Supprimer volumes non utilisés
docker volume prune

# Nettoyage complet
docker system prune -a --volumes
```

---

## Variables d'environnement

### Backend
```env
MONGO_URI=mongodb://mongodb:27017/
REDIS_HOST=redis
REDIS_PORT=6379
ELASTICSEARCH_HOST=http://elasticsearch:9200
```

### Elasticsearch
```env
discovery.type=single-node
xpack.security.enabled=false
ES_JAVA_OPTS=-Xms512m -Xmx512m
```

### Kibana
```env
ELASTICSEARCH_HOSTS=http://elasticsearch:9200
XPACK_SECURITY_ENABLED=false
SERVER_CSP_FRAME_ANCESTORS=["'self'", "http://localhost:4200"]
```

---

## Health checks

### Vérifier tous les services
```bash
# Elasticsearch
curl http://localhost:9200/_cluster/health

# Kibana
curl http://localhost:5601/api/status

# Backend
curl http://localhost:5000/api/stats

# MongoDB
docker exec -it mongodb mongosh --eval "db.adminCommand('ping')"

# Redis
docker exec -it redis redis-cli ping
```

---

## Optimisations Docker

### 1. Multi-stage builds
- Réduction taille image frontend: 1.2GB → 45MB
- Séparation build et runtime

### 2. Layer caching
- COPY package.json avant COPY code
- Rebuild plus rapides

### 3. .dockerignore
```
node_modules/
dist/
.git/
*.log
```

### 4. Ressources limitées
```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
```

---

## Dépannage Docker

### Problème: Port déjà utilisé
```bash
# Trouver le processus
sudo lsof -i :9200

# Tuer le processus
sudo kill -9 <PID>
```

### Problème: Out of memory
```bash
# Augmenter heap Elasticsearch
ES_JAVA_OPTS=-Xms1g -Xmx1g

# Augmenter limite Docker Desktop
# Settings → Resources → Memory: 4GB minimum
```

### Problème: Volume permissions
```bash
# Changer owner
sudo chown -R 1000:1000 ./home/isra/elk/mongo-data/

# Permissions lecture/écriture
chmod -R 755 ./var/log/ecommerce/
```

### Problème: Network issues
```bash
# Recréer le network
docker-compose down
docker network prune
docker-compose up -d
```

---

## Sécurité (Production)

### Checklist
- [ ] Activer X-Pack Security sur ELK
- [ ] Authentification MongoDB
- [ ] Redis password
- [ ] HTTPS avec certificats
- [ ] Secrets management (Docker Secrets)
- [ ] Network isolation
- [ ] Resource limits
- [ ] Regular updates

### Exemple avec secrets
```yaml
secrets:
  mongo_password:
    file: ./secrets/mongo_password.txt
    
services:
  mongodb:
    secrets:
      - mongo_password
    environment:
      MONGO_INITDB_ROOT_PASSWORD_FILE: /run/secrets/mongo_password
```

---

## Monitoring Docker

### Container stats
```bash
docker stats

# Stats d'un conteneur
docker stats elasticsearch
```

### Logs aggregation
```bash
# Tous les logs
docker-compose logs

# Filtrer par service
docker-compose logs backend | grep ERROR
```

### Healthchecks
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:9200/_cluster/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

---

## Sauvegarde et Restauration

### Elasticsearch
```bash
# Snapshot
curl -X PUT "localhost:9200/_snapshot/backup/snapshot_1?wait_for_completion=true"

# Restore
curl -X POST "localhost:9200/_snapshot/backup/snapshot_1/_restore"
```

### MongoDB
```bash
# Backup
docker exec mongodb mongodump --out /data/backup

# Restore
docker exec mongodb mongorestore /data/backup
```

---

## Conclusion

La dockerisation complète de ce projet permet :
- ✅ Déploiement en une commande
- ✅ Environnement reproductible
- ✅ Isolation des services
- ✅ Scalabilité facile
- ✅ Portabilité (dev → prod)

**Status**: ✅ Dockerisation 100% complète

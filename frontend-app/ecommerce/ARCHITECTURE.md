# Architecture Frontend E-Commerce Monitoring

## 🏗️ Architecture Globale du Projet

Votre application suit l'architecture ci-dessous pour le projet complet :

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Angular 21)                     │
│  - Dashboard, Upload, Search, Results, Files                │
│  - Service API, WebSocket (à venir)                         │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
                     │
┌────────────────────▼────────────────────────────────────────┐
│                      NGINX (Reverse Proxy)                   │
│  - Load Balancing                                            │
│  - SSL/TLS Termination                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
┌────────▼──────┐ ┌──▼────────┐ ┌▼──────────┐
│   Flask/      │ │ Logstash  │ │Elasticsear│
│   Django API  │ │ Pipeline  │ │    ch     │
│               │ │           │ │           │
│ - Upload      │ │ - Ingest  │ │ - Index   │
│ - Search      │ │ - Parse   │ │ - Search  │
│ - Export      │ │ - Transform│ │ - Analyze │
└───────┬───────┘ └───────────┘ └─────┬─────┘
        │                             │
        │         ┌───────────────────┘
        │         │
┌───────▼─────────▼─────┐
│      MongoDB          │
│  - File Metadata      │
│  - Search History     │
│  - User Config        │
└───────────────────────┘

┌───────────────────────┐
│      Redis            │
│  - Cache Results      │
│  - Sessions           │
│  - Rate Limiting      │
└───────────────────────┘

┌───────────────────────┐
│      Docker           │
│  Containerize All     │
└───────────────────────┘
```

## 📦 Stack Complète

### Frontend (Implémenté)
✅ **Angular 21**
- Components standalone
- Signals pour la réactivité
- Lazy loading des routes
- HttpClient pour les appels API

✅ **SCSS**
- Styles globaux et modulaires
- Responsive design
- Animations CSS

### Backend (À implémenter)
⏳ **Flask ou Django**
```python
# Exemple Flask
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/stats')
def get_stats():
    # Elasticsearch query
    return jsonify({
        'totalLogs': 15234,
        'logsToday': 423,
        'errorCount': 89,
        'filesUploaded': 12
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    file = request.files['logfile']
    # Save to Logstash input directory
    # Save metadata to MongoDB
    return jsonify({'message': 'File uploaded successfully'})
```

⏳ **Elasticsearch**
```json
// Mapping pour index logs-ecommerce-*
{
  "mappings": {
    "properties": {
      "timestamp": { "type": "date" },
      "level": { "type": "keyword" },
      "service": { "type": "keyword" },
      "message": { "type": "text" },
      "transaction_id": { "type": "keyword" },
      "user_id": { "type": "keyword" },
      "amount": { "type": "float" },
      "payment_method": { "type": "keyword" },
      "error_code": { "type": "keyword" },
      "ip_address": { "type": "ip" }
    }
  }
}
```

⏳ **Logstash**
```ruby
# conf/csv-pipeline.conf
input {
  file {
    path => "/logs/input/*.csv"
    start_position => "beginning"
  }
}

filter {
  csv {
    columns => ["timestamp","level","service","message","transaction_id","amount"]
    separator => ","
  }
  
  date {
    match => ["timestamp", "ISO8601"]
    target => "@timestamp"
  }
  
  mutate {
    convert => { "amount" => "float" }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "logs-ecommerce-%{+YYYY.MM.dd}"
  }
}
```

⏳ **MongoDB**
```javascript
// Collection: files
{
  "_id": ObjectId("..."),
  "filename": "transactions_2024.csv",
  "upload_date": ISODate("2024-12-12T18:00:00Z"),
  "size": 2048576,
  "status": "completed",
  "logs_count": 5234,
  "user_id": "admin"
}

// Collection: search_history
{
  "_id": ObjectId("..."),
  "user_id": "admin",
  "query": "error payment",
  "level": "ERROR",
  "service": "payment",
  "timestamp": ISODate("2024-12-12T18:30:00Z"),
  "result_count": 42
}
```

⏳ **Redis**
```redis
# Cache des résultats de recherche
SET search:query123 "{\"logs\": [...], \"total\": 150}" EX 300

# Session utilisateur
HSET session:user123 username "admin" last_activity 1702398000

# Rate limiting
INCR ratelimit:ip:192.168.1.1
EXPIRE ratelimit:ip:192.168.1.1 60
```

## 🐳 Docker Compose (À créer)

```yaml
version: '3.8'

services:
  # Frontend Angular
  frontend:
    build: ./frontend-app/ecommerce
    ports:
      - "8080:80"
    depends_on:
      - backend
    networks:
      - ecommerce-net

  # Backend API
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - ELASTICSEARCH_URL=http://elasticsearch:9200
      - MONGODB_URI=mongodb://mongodb:27017/ecommerce
      - REDIS_URL=redis://redis:6379
    depends_on:
      - elasticsearch
      - mongodb
      - redis
    networks:
      - ecommerce-net

  # Elasticsearch
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - es-data:/usr/share/elasticsearch/data
    networks:
      - ecommerce-net

  # Logstash
  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash/config:/usr/share/logstash/pipeline
      - ./logstash/logs:/logs
    depends_on:
      - elasticsearch
    networks:
      - ecommerce-net

  # Kibana (Optionnel)
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    networks:
      - ecommerce-net

  # MongoDB
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - ecommerce-net

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - ecommerce-net

volumes:
  es-data:
  mongo-data:
  redis-data:

networks:
  ecommerce-net:
    driver: bridge
```

## 🚦 Flux de Données

### 1. Upload de Fichier
```
User -> Frontend (Upload page)
     -> POST /api/upload (file)
     -> Backend API (Flask/Django)
     -> Save to /logs/input/
     -> Logstash watches directory
     -> Parse and transform
     -> Index to Elasticsearch
     -> Save metadata to MongoDB
     -> Return success to Frontend
```

### 2. Recherche de Logs
```
User -> Frontend (Search page)
     -> POST /api/search (params)
     -> Backend API
     -> Check Redis cache
     -> If not cached:
        -> Query Elasticsearch
        -> Cache result in Redis
        -> Save search to MongoDB
     -> Return results to Frontend
     -> Display in Results page
```

### 3. Dashboard Stats
```
Frontend (Home page)
     -> GET /api/stats
     -> Backend API
     -> Aggregation query to Elasticsearch
     -> Count from MongoDB
     -> Return combined stats
     -> Display in stats cards
```

## 📊 Endpoints API Requis

```typescript
// Stats
GET /api/stats
Response: {
  totalLogs: number,
  logsToday: number,
  errorCount: number,
  filesUploaded: number,
  transactionsPerHour: Array<{label: string, value: number}>,
  errorsByType: Array<{label: string, value: number}>,
  conversionRate: number,
  averageTransactionAmount: number
}

// Search
GET /api/search?query=...&level=...&service=...&page=...
Response: {
  logs: Log[],
  total: number,
  page: number,
  size: number
}

// Upload
POST /api/upload
Body: FormData { logfile: File }
Response: {
  message: string,
  fileId: string,
  filename: string
}

// Files
GET /api/files
Response: UploadedFile[]

// Export
GET /api/export?query=...
Response: CSV file (blob)

// Health
GET /api/hello
Response: { message: string }
```

## 🎯 Prochaines Étapes

### 1. Backend API (Flask/Django)
- [ ] Créer les endpoints API
- [ ] Connecter à Elasticsearch
- [ ] Connecter à MongoDB
- [ ] Connecter à Redis
- [ ] Implémenter upload de fichiers
- [ ] Implémenter recherche
- [ ] Implémenter export

### 2. Stack ELK
- [ ] Configurer Elasticsearch index templates
- [ ] Créer pipelines Logstash (CSV, JSON)
- [ ] Configurer Kibana dashboards
- [ ] Tester l'ingestion de données

### 3. Docker
- [ ] Créer docker-compose.yml
- [ ] Créer Dockerfile pour backend
- [ ] Créer Dockerfile pour frontend
- [ ] Tester le déploiement complet

### 4. Tests
- [ ] Tests unitaires frontend
- [ ] Tests unitaires backend
- [ ] Tests d'intégration
- [ ] Tests e2e

### 5. Documentation
- [ ] Documentation API (Swagger)
- [ ] Guide d'installation
- [ ] Guide utilisateur
- [ ] Architecture détaillée

## 📚 Ressources

- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Logstash Documentation](https://www.elastic.co/guide/en/logstash/current/index.html)
- [Angular Documentation](https://angular.dev/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)
- [Docker Documentation](https://docs.docker.com/)

## 🎓 Scénario E-Commerce - KPIs à Surveiller

1. **Transactions**
   - Volume par heure
   - Taux de réussite
   - Montant moyen

2. **Erreurs**
   - Erreurs de paiement
   - Codes d'erreur
   - Impact business

3. **Performance**
   - Temps de réponse
   - Latence API
   - Throughput

4. **Utilisateurs**
   - Parcours
   - Abandons de panier
   - Conversion

---

**Note** : L'application frontend est complète et fonctionnelle. Vous devez maintenant implémenter le backend et la stack ELK pour avoir une solution complète.

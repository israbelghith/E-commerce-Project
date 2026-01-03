"""
connections.py
Reusable MongoDB and Redis connection objects for Flask app
Docker defaults: MongoDB (mongodb://mongodb:27017), Redis (redis://redis:6379)
"""
from pymongo import MongoClient
import redis
import os

# MongoDB connection (Docker: service name 'mongodb')
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
mongo_client = MongoClient(MONGO_URI)
mongo_db = mongo_client[os.environ.get("MONGO_DB", "ecommerce")]  # default db: ecommerce

# Redis connection (Docker: service name 'redis')
REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)

# Usage example (in app.py):
# from connections import mongo_db, redis_client
# mongo_db.users.find_one({"email": "test@example.com"})
# redis_client.set("key", "value")

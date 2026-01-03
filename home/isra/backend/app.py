import os
from connections import redis_client
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import json
from elasticsearch import Elasticsearch
from connections import mongo_db  # Import MongoDB connection

app = Flask(__name__)
CORS(app)

es = Elasticsearch('http://elasticsearch:9200')

UPLOAD_FOLDER = os.path.expanduser("~/Documents/E-commerce-Project/var/log/ecommerce")
METADATA_FILE = os.path.expanduser("~/Documents/E-commerce-Project/var/log/files_metadata.json")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def load_metadata():
    # For backward compatibility, but not used anymore
    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, 'r') as f:
            return json.load(f)
    return []

def save_metadata(data):
    # For backward compatibility, but not used anymore
    with open(METADATA_FILE, 'w') as f:
        json.dump(data, f, indent=2, default=str)

@app.route("/api/upload", methods=["POST"])
def upload_log():
    print("FILES RECEIVED:", request.files)
    if "logfile" not in request.files:
        print("No FILE FOUND")
        return jsonify({"message": "No file uploaded"}), 400
    file = request.files["logfile"]
    print("FILENAME RECEIVED:", file.filename)
    if file.filename == '':
        return jsonify({"message": "No file selected"}), 400
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)
    print("FILE SAVED TO:", filepath)
    file_size = os.path.getsize(filepath)
    file_type = file.filename.split('.')[-1] if '.' in file.filename else 'unknown'
    records_count = 0
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            records_count = sum(1 for line in f if line.strip())
    except Exception as e:
        print(f"Error counting records: {e}")
        records_count = 0
    # Save metadata to MongoDB
    file_metadata = {
        "name": file.filename,
        "size": file_size,
        "type": file_type,
        "uploadDate": datetime.utcnow().isoformat() + "Z",
        "status": "processed",
        "recordsCount": records_count,
        "path": filepath
    }
    result = mongo_db.files.insert_one(file_metadata)
    file_metadata["id"] = str(result.inserted_id)
    print(f"✅ Metadata saved to MongoDB with id {file_metadata['id']}")
    # (Optional) Also update the JSON file for backward compatibility
    files_data = load_metadata()
    file_metadata_json = file_metadata.copy()
    files_data.append(file_metadata_json)
    save_metadata(files_data)
    return jsonify({"message": f"File {file.filename} uploaded successfully", "recordsCount": records_count}), 200

@app.route("/api/files", methods=["GET"])
def get_files():
    try:
        # Fetch all file metadata from MongoDB
        files_cursor = mongo_db.files.find({}, {'_id': 0})
        files_data = list(files_cursor)
        # If no files in MongoDB, fallback to JSON file (for backward compatibility)
        if not files_data:
            files_data = load_metadata()
        return jsonify(files_data), 200
    except Exception as e:
        print(f"Error fetching files: {e}")
        return jsonify([]), 200

@app.route("/api/files/sync", methods=["POST"])
def sync_files():
    try:
        files_data = load_metadata()
        existing_names = {f["name"] for f in files_data}

        new_files = []
        for filename in os.listdir(UPLOAD_FOLDER):
            filepath = os.path.join(UPLOAD_FOLDER, filename)

            if not os.path.isfile(filepath) or filename in existing_names:
                continue

            file_size = os.path.getsize(filepath)
            file_type = filename.split('.')[-1] if '.' in filename else 'unknown'
            file_mtime = datetime.fromtimestamp(os.path.getmtime(filepath))

            records_count = 0
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    records_count = sum(1 for line in f if line.strip())
            except:
                records_count = 0

            file_metadata = {
                "name": filename,
                "size": file_size,
                "type": file_type,
                "uploadDate": file_mtime.isoformat() + "Z",
                "status": "processed",
                "recordsCount": records_count,
                "path": filepath
            }

            # Save to MongoDB as well
            result = mongo_db.files.insert_one(file_metadata)
            file_metadata["id"] = str(result.inserted_id)
            new_files.append(file_metadata)

        if new_files:
            files_data.extend(new_files)
            save_metadata(files_data)
            print(f"✅ Synced {len(new_files)} new files")

        return jsonify({"message": f"Synced {len(new_files)} files", "files": new_files}), 200
    except Exception as e:
        print(f"Error syncing files: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/stats", methods=["GET"])
def get_stats():
    """Get comprehensive e-commerce statistics from Elasticsearch"""
    try:
        # Get total documents count
        total_response = es.count(index="ecommerce-logs")
        total_logs = total_response['count']

        # Count ERROR level logs
        error_response = es.count(
            index="ecommerce-logs",
            body={"query": {"term": {"level.keyword": "ERROR"}}}
        )
        error_logs = error_response['count']

        # Get logs from today
        today_response = es.count(
            index="ecommerce-logs",
            body={
                "query": {
                    "range": {
                        "@timestamp": {
                            "gte": "now/d",
                            "lte": "now"
                        }
                    }
                }
            }
        )
        logs_today = today_response['count']

        # Get transactions per hour (date histogram aggregation)
        transactions_agg = es.search(
            index="ecommerce-logs",
            body={
                "size": 0,
                "query": {
                    "range": {
                        "@timestamp": {
                            "gte": "now-24h",
                            "lte": "now"
                        }
                    }
                },
                "aggs": {
                    "transactions_per_hour": {
                        "date_histogram": {
                            "field": "@timestamp",
                            "fixed_interval": "1h"
                        }
                    }
                }
            }
        )

        transactions_per_hour = []
        if 'aggregations' in transactions_agg:
            buckets = transactions_agg['aggregations']['transactions_per_hour']['buckets']
            for bucket in buckets:
                hour = datetime.fromisoformat(bucket['key_as_string'].replace('Z', '+00:00'))
                transactions_per_hour.append({
                    "label": hour.strftime("%Hh"),
                    "value": bucket['doc_count']
                })

        # Get errors by type/reason
        errors_agg = es.search(
            index="ecommerce-logs",
            body={
                "size": 0,
                "query": {
                    "term": {"level.keyword": "ERROR"}
                },
                "aggs": {
                    "by_reason": {
                        "terms": {
                            "field": "reason.keyword",
                            "size": 5
                        }
                    }
                }
            }
        )

        errors_by_type = []
        if 'aggregations' in errors_agg:
            buckets = errors_agg['aggregations']['by_reason']['buckets']
            for bucket in buckets:
                errors_by_type.append({
                    "label": bucket['key'] if bucket['key'] else "Unknown",
                    "value": bucket['doc_count']
                })

        # Calculate average transaction amount
        avg_amount_agg = es.search(
            index="ecommerce-logs",
            body={
                "size": 0,
                "query": {
                    "exists": {"field": "amount"}
                },
                "aggs": {
                    "avg_amount": {
                        "avg": {"field": "amount"}
                    }
                }
            }
        )

        average_amount = 0
        if 'aggregations' in avg_amount_agg:
            average_amount = avg_amount_agg['aggregations']['avg_amount']['value'] or 0

        # Calculate conversion rate (success / total transactions)
        total_transactions = es.count(
            index="ecommerce-logs",
            body={"query": {"exists": {"field": "transaction_id"}}}
        )['count']

        successful_transactions = es.count(
            index="ecommerce-logs",
            body={"query": {"term": {"status.keyword": "success"}}}
        )['count']

        conversion_rate = (successful_transactions / total_transactions * 100) if total_transactions > 0 else 0

        # Get file stats from metadata
        files_cursor = mongo_db.files.find({}, {'_id': 0})
        files_data = list(files_cursor)
        total_files = len(files_data)

        return jsonify({
            "totalLogs": total_logs,
            "logsToday": logs_today,
            "errorCount": error_logs,
            "filesUploaded": total_files,
            "transactionsPerHour": transactions_per_hour,
            "errorsByType": errors_by_type,
            "conversionRate": round(conversion_rate, 2),
            "averageTransactionAmount": round(average_amount, 2)
        }), 200

    except Exception as e:
        print(f"Error fetching stats: {e}")
        import traceback
        traceback.print_exc()
        # Return default stats
        return jsonify({
            "totalLogs": 0,
            "logsToday": 0,
            "errorCount": 0,
            "filesUploaded": 0,
            "transactionsPerHour": [],
            "errorsByType": [],
            "conversionRate": 0,
            "averageTransactionAmount": 0
        }), 200

@app.route("/api/search", methods=["POST"])
def search_logs():
    """Search logs in Elasticsearch and save search history in MongoDB"""
    try:
        data = request.get_json() or {}
        cache_key = f"search:{json.dumps(data, sort_keys=True)}"
        cached = redis_client.get(cache_key)
        if cached:
            print("✅ Returning cached search result from Redis")
            return jsonify(json.loads(cached)), 200

        query_text = data.get('query', '')
        level = data.get('level', '')
        service = data.get('service', '')
        start_date = data.get('startDate', '')
        end_date = data.get('endDate', '')
        page = int(data.get('page', 1))
        page_size = int(data.get('pageSize', 50))

        must_clauses = []

        if query_text:
            must_clauses.append({
                "query_string": {
                    "query": query_text,
                    "fields": [
                        "message", "transaction_id", "user_id", "event.original", "reason", "status", "method",
                        "category", "currency", "product_id", "service", "type",
                        "ip", "brand", "cache", "endpoint", "order_id",
                        "name", "price", "quantity", "tags", "session_id",
                        "session_duration", "timeout_ms", "timestamp", "log.file.path",
                        "results", "original_tx", "duration", "msg", "country",
                        "username", "users_online"
                    ],
                    "default_operator": "AND"
                }
            })

        if level:
            must_clauses.append({"term": {"level.keyword": level}})

        if service:
            must_clauses.append({"term": {"service.keyword": service}})

        if start_date or end_date:
            date_range = {}
            if start_date:
                date_range["gte"] = start_date
            if end_date:
                date_range["lte"] = end_date
            must_clauses.append({
                "range": {"@timestamp": date_range}
            })

        es_query = {
            "query": {
                "bool": {
                    "must": must_clauses if must_clauses else [{"match_all": {}}]
                }
            },
            "sort": [{"@timestamp": {"order": "desc"}}],
            "from": (page - 1) * page_size,
            "size": page_size
        }

        print(f"🔍 Executing search query: {json.dumps(es_query, indent=2)}")

        response = es.search(
            index="ecommerce-logs",
            body=es_query
        )

        hits = response['hits']['hits']
        total = response['hits']['total']['value']

        results = []
        for hit in hits:
            source = hit['_source']
            results.append({
                'id': hit['_id'],
                'timestamp': source.get('@timestamp') or source.get('timestamp'),
                'level': source.get('level', 'INFO'),
                'service': source.get('service', 'unknown'),
                'message': source.get('message', ''),
                'transaction_id': source.get('transaction_id', ''),
                'user_id': source.get('user_id', ''),
                'amount': source.get('amount', ''),
                'status': source.get('status', ''),
                'method': source.get('method', ''),
                'country': source.get('country', ''),
                'reason': source.get('reason', ''),
                'ip': source.get('ip', ''),
                'details': source
            })

        print(f"✅ Found {total} results, returning page {page}")

        # Save search history in MongoDB
        search_history_doc = {
            "query": data,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        mongo_db.search_history.insert_one(search_history_doc)

        response_data = {
            'results': results,
            'total': total,
            'page': page,
            'pageSize': page_size,
            'totalPages': (total + page_size - 1) // page_size
        }
        # Cache the result in Redis for 2 minutes
        redis_client.setex(cache_key, 120, json.dumps(response_data))
        print("✅ Cached search result in Redis")
        return jsonify(response_data), 200

    except Exception as e:
        print(f"❌ Error searching logs: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'results': [], 'total': 0}), 500

@app.route("/api/hello", methods=["GET"])
def hello():
    return jsonify({"message": "Backend Flask OK!"})

@app.route("/api/export", methods=["GET"])
def export_csv():
    """Export search results to CSV"""
    try:
        query_text = request.args.get('query', '')
        level = request.args.get('level', '')
        service = request.args.get('service', '')
        start_date = request.args.get('startDate', '')
        end_date = request.args.get('endDate', '')

        must_clauses = []

        if query_text:
            must_clauses.append({
                "query_string": {
                    "query": query_text,
                    "fields": [
                        "message", "transaction_id", "user_id", "event.original", "reason", "status", "method",
                        "category", "currency", "product_id", "service", "type",
                        "ip", "brand", "cache", "endpoint", "order_id",
                        "name", "price", "quantity", "tags", "session_id",
                        "session_duration", "timeout_ms", "timestamp", "log.file.path",
                        "results", "original_tx", "duration", "msg", "country",
                        "username", "users_online"
                    ],
                    "default_operator": "AND"
                }
            })

        if level:
            must_clauses.append({"term": {"level.keyword": level}})

        if service:
            must_clauses.append({"term": {"service.keyword": service}})

        if start_date or end_date:
            date_range = {}
            if start_date:
                date_range["gte"] = start_date
            if end_date:
                date_range["lte"] = end_date
            must_clauses.append({
                "range": {"@timestamp": date_range}
            })

        es_query = {
            "query": {
                "bool": {
                    "must": must_clauses if must_clauses else [{"match_all": {}}]
                }
            },
            "sort": [{"@timestamp": {"order": "desc"}}],
            "size": 10000  # Limit export to 10000 results
        }

        response = es.search(
            index="ecommerce-logs",
            body=es_query
        )

        hits = response['hits']['hits']

        # Create CSV content
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['Timestamp', 'Level', 'Service', 'Message', 'Transaction ID', 'User ID', 'Amount', 'Status', 'Country', 'IP'])
        
        # Write data
        for hit in hits:
            source = hit['_source']
            writer.writerow([
                source.get('@timestamp') or source.get('timestamp', ''),
                source.get('level', ''),
                source.get('service', ''),
                source.get('message', ''),
                source.get('transaction_id', ''),
                source.get('user_id', ''),
                source.get('amount', ''),
                source.get('status', ''),
                source.get('country', ''),
                source.get('ip', '')
            ])

        output.seek(0)
        
        from flask import make_response
        response = make_response(output.getvalue())
        response.headers["Content-Disposition"] = f"attachment; filename=logs-export-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.csv"
        response.headers["Content-Type"] = "text/csv"
        return response

    except Exception as e:
        print(f"❌ Error exporting logs: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    print("🚀 Flask server starting...")
    print(f"📁 Upload folder: {UPLOAD_FOLDER}")
    print(f"📝 Metadata file: {METADATA_FILE}")
    print(f"🔍 Elasticsearch: http://elasticsearch:9200")

    try:
        info = es.info()
        print(f"✅ Elasticsearch connected: {info['version']['number']}")
    except Exception as e:
        print(f"⚠️  Elasticsearch connection failed: {e}")

    app.run(host="0.0.0.0", port=5000, debug=True)

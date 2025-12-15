# Fix at line 10 - Change Elasticsearch initialization
es = Elasticsearch(
    ['http://localhost:9200'],
    headers={"Accept": "application/json", "Content-Type": "application/json"}
)

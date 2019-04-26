'''
Creates an index names classify through the usage of the localhost port
for ElasticSearch. Additionally, provides the mapping required for classification
and an example of how to add a document to the index and how to conduct a more
like this query.
'''
from elasticsearch import Elasticsearch
ES_HOST = {"host" : "localhost", "port" : 9200}
es = Elasticsearch(hosts = [ES_HOST])
request_body = {
    "settings" : {
        "number_of_shards": 1,
        "number_of_replicas": 0
    }
}
res = es.indices.create(index = 'classify', body = request_body)
print(" response: '%s'" % (res))

for index in es.indices.get('*'):
    print(index)

MAPPING = {
  "properties":{
    "content":{
      "type":"text",
      "analyzer":"english"
    },
    "category":{
      "type":"text",
      "analyzer":"english",
      "fields":{
        "raw":{
          "type":"keyword"
        }
      }
    }
  }
}
res = es.indices.put_mapping(index = 'classify', body = MAPPING, doc_type = 'application/json')
print(" response '%s'" % (res))
print(es.indices.get_mapping('*'))

'''
DOCU = {
  "category":"News",
  "content":"This is a news website. When is the news on today? news 
News news"
}
for i in range(20):
    res = es.index(index='titanic', doc_type = 'application/json', 
    id=i, body = DOCU) print(" response '%s'" % (res))
SEARCH = {
  "query":{
    "more_like_this":{
      "fields":[
        "content",
        "category"
      ],
      "like":"news",
      "min_term_freq":1,
      "max_query_terms":20
    }
  }
}
res = es.search(body = SEARCH, index = 'classify', doc_type = 'application/json')
print((res))
'''

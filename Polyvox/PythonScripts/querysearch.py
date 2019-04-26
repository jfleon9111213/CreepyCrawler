import sys
from elasticsearch import Elasticsearch

#Instantiates elasticsearch session to be used
eshost = {"host" : "localhost", "port": 9200}
es = Elasticsearch(hosts = [eshost])

#Gets the key phrases and concatenates them together
query = ''
phraseLength = 12
for i in range(phraseLength):
    query = query + sys.argv[i+1] + ' '

#JSON document that will be sent into elasticsearch for a more-like-this-query
searchJSON = {
  "query":{
    "more_like_this":{
      "fields":[
        "content",
        "category"
      ],
      "like":query,
      "min_term_freq":1,
      "max_query_terms":100
    }
  }
}

res = es.search(body = searchJSON, index = 'classify', doc_type = 'application/json') #The actual call to the elasticsearch query
print((res))

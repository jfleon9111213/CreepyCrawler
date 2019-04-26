import scrapy
from elasticsearch import Elasticsearch

class QuotesSpider(scrapy.Spider):
    name = "gatherdata" #Name of the spider

    def start_requests(self):
        #Starting Links
        links = [
                'http://odp.org/News',
                'http://odp.org/Games',
                'http://odp.org/Arts'
        ]

        #Category of each starting link
        categories = [
                'News',
                'Games',
                'Arts'
                ]

        '''
        Iterating through each starting link while also sending metadata for future use:
        category: 	The category of the websites that will be crawled.
        level: 		A designated level to control how deep the crawler goes.
        currentLink: 	The link of the current website that will be used as the id of each index.
        '''
        for i in range(len(links)):
            yield scrapy.Request(url = links[i], callback = self.parse, meta = {'category':categories[i], 'level':0,'currentLink':links[i]})


    def parse(self, response):
        #Initiating elasticsearch session to be used
        esHost = {"host" : "localhost", "port" : 9200}
        indexName = 'classify'
        es = Elasticsearch(hosts = [esHost])


        category = response.meta['category']
        level = response.meta['level']
        onTrack = 'odp.org/' + category #This variable makes sure that the crawler doesn't crawl pages out of the category on odp.org

        '''
        Meant for pages that will be indexed (non-odp.org pages) Takes all the content of the page,
        formats it into a json file with its corresponding category and content, then indexes it into
        elasticsearch and prints out the response.
        '''
        if level == -1:
            content = ''
            for string in response.css('p::text').getall():
                content = content + string
            docu = {
                    "category":category,
                    "content":content
                    }
            res = es.index(index = indexName, doc_type = 'application/json', id = response.meta['currentLink'], body = docu)
            print(" response '%s'" % (res))

        '''
        Meant for odp.org pages. If another odp.org page is found that is relevant to the category, that page is put
        back to scrapy if it is only one level deep. If a content page is found, then that page is put back into scrapy
        to index. All other cases are ignored.
        '''
        elif level < 2:
            next_page = response.css('a::attr(href)').getall()
            for link in next_page:
                if link is not None:
                    link = response.urljoin(link)
                    if level == 0 and onTrack in link:
                        yield scrapy.Request(url = link, callback = self.parse, meta = {'category':category, 'level':level + 1, 'currentLink':link})
                    elif 'odp.org' not in link:
                        yield scrapy.Request(url = link, callback = self.parse, meta = {'category':category, 'level':-1,'currentLink':link})

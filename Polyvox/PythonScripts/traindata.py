import scrapy
import urllib
from elasticsearch import Elasticsearch

class QuotesSpider(scrapy.Spider):
    name = "gatherdata" #Name of the spider

    def start_requests(self):
        #Starting Links
        links = [
                'http://odp.org/World/Fran%C3%A7ais/Actualit%C3%A9',
                'http://odp.org/World/Fran%C3%A7ais/Jeux',
                'http://odp.org/World/Fran%C3%A7ais/Arts'
        ]

        #Category of each starting link
        categories = [
                'News',
                'Games',
                'Arts'
                ]

        foreignCategories = [
                urllib.parse.unquote_plus('World/Fran%C3%A7ais/Actualit%C3%A9'),
                urllib.parse.unquote_plus('World/Fran%C3%A7ais/Jeux'),
                urllib.parse.unquote_plus('World/Fran%C3%A7ais/Arts')
                ]

        '''
        Iterating through each starting link while also sending metadata for future use:
        category: 	The category of the websites that will be crawled.
        level: 		A designated level to control how deep the crawler goes.
        currentLink: 	The link of the current website that will be used as the id of each index.
        '''
        for i in range(len(links)):
            yield scrapy.Request(url = links[i], callback = self.parse, meta = {'category':categories[i], 'level':0,'currentLink':links[i], 'foreign':foreignCategories[i]})


    def parse(self, response):
        #Initiating elasticsearch session to be used
        esHost = {"host" : "localhost", "port" : 9200}
        indexName = 'classify'
        es = Elasticsearch(hosts = [esHost])


        category = response.meta['category']
        level = response.meta['level']

#This variable makes sure that the crawler doesn't crawl pages that aren't
#related to the topic.
        if level == -1:
            onTrack = response.url
        elif level < -1:
            onTrack = response.meta['baseurl']
        else:
            onTrack = 'odp.org/' + response.meta['foreign']

        '''
        Meant for pages that will be indexed (non-odp.org pages) Takes all the content of the page,
        formats it into a json file with its corresponding category and content, then indexes it into
        elasticsearch and prints out the response.
        '''
        if level < 0 and level > -3:
            content = ''
            for string in response.css('p::text').getall():
                content = content + string
            content = urllib.parse.unquote_plus(content)
            docu = {
                    "category":category,
                    "content":content
                    }
            if content != '':
                res = es.index(index = indexName, doc_type = 'application/json', id = response.meta['currentLink'], body = docu)
                print(" response '%s'" % (res))

            if level > -2:
                next_page = response.css('a::attr(href)').getall()
                for link in next_page:
                    if link is not None:
                        link = response.urljoin(link)
                        if onTrack in link:
                            yield scrapy.Request(url = link, callback = self.parse, meta = {'category':category, 'level': level - 1,'currentLink':link, 'baseurl':response.url})
        elif level < 2 and level > -1:
            next_page = response.css('a::attr(href)').getall()
            for link in next_page:
                if link is not None:
                    link = response.urljoin(link)
                    link = urllib.parse.unquote_plus(link)
                    if level == 0 and onTrack in link:
                        yield scrapy.Request(url = link, callback = self.parse, meta = {'category':category, 'level':level + 1, 'currentLink':link})
                    elif 'odp.org' not in link:
                        yield scrapy.Request(url = link, callback = self.parse, meta = {'category':category, 'level':-1,'currentLink':link})

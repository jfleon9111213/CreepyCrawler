/*
 * Gets all the text found in the body paragraphs of the current HTML file,
 * sends that text to the KeyPhrases Azure API, and then gets
 * relevant results.
 */ 

//SET DEFAULTS
var default_count = 10;
var default_market = "en-US";
var default_lang = "en";    //set language to english by default
var default_safe = "Strict";	//strict, moderate, or off. For simplicity, strict or off.

document.addEventListener('DOMContentLoaded', doSearch(default_count, default_market, default_lang, default_safe));
function doSearch(search_count, search_market, search_lang, search_safe){
    chrome.tabs.getSelected(null, function (tab) {
        chrome.tabs.sendMessage(tab.id, { method: "getText" }, function (response) {
        	if(response!=undefined){
	            var mainText = response.data.split(" ");
	            getKeyPhrases(response.data, mainText);
	        }
	        else{
	        	var res = document.getElementById("result_list");
	        	res.innerHTML = "Cannot analyze. Please refresh the page";
	        }
        });
    });

    /**
     * Gets the key phrases of an article by calling the Azure Key Phrases API.
     * Also cleans the response for URL calling.
     */
    function getKeyPhrases(articleText, mainText) {
        var documents = { documents: [{ language: "en", id: "1", text: articleText }] };
        var myJSON = JSON.stringify(documents);
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/keyPhrases", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Ocp-Apim-Subscription-Key", "55be3679b04f474c93a582763e6b5f21");
        xhr.send(myJSON);

        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                var response = xhr.responseText;
                var wordList = response.substring(response.lastIndexOf("keyPhrases\":[") + 13, response.lastIndexOf("]}],\"errors"));
                wordList = wordList.replace(/\"/g, "");
                wordList = wordList.replace(/,/g, "+");
                wordList = wordList.replace(/ /g, "+");
                var countKeyWords = wordList.split("+");
                rankKeyWords(countKeyWords, mainText);
            }
        }
    }

    function rankKeyWords(wordList, mainText) {
        var ranking = new Array(12);
        for (i = 0; i < ranking.length; i++) {
            ranking[i] = ["a" + i, 0];
        }
        var currentWord;
        for (i = 0; i < wordList.length; i++) {
            currentWord = [wordList[i], 0];
            for (j = 0; j < mainText.length; j++) {
                if (currentWord[0] == mainText[j]) {
                    currentWord[1]++;
                }
            }
            var sameWord = false;
            for (k = 0; k < ranking.length; k++) {
                if (currentWord[0] == ranking[k][0]) {
                    sameWord = true;
                }
                if (currentWord[1] > ranking[k][1] && !sameWord) {
                    if (currentWord[0] == ranking[k][0]) {
                        sameWord = true;
                    }
                    else {
                        var temp = currentWord;
                        currentWord = ranking[k];
                        ranking[k] = temp;
                    }
                }
            }

        }
        var wordQueue = "";
        for (i = 0; i < ranking.length - 1; i++) {
            wordQueue = wordQueue.concat(ranking[i][0] + "+");

        }
        wordQueue = wordQueue.concat(ranking[ranking.length - 1][0]);
        translateWords(wordQueue);
        //elasticSearch(wordQueue);
    }

    function elasticSearch(wordQueue) {
        var esRequest = new XMLHttpRequest();
        var reqBody = {
            "query": {
                "more_like_this": {
                    "fields": [
                        "content",
                        "category"
                    ],
                    "like": "News.",
                    "min_term_freq": 1,
                    "max_query_terms": 1
                }
            }
        }
        var payload = JSON.stringify(reqBody);
        esRequest.open("GET", "http://elasticsearchpolyglot.eastus.cloudapp.azure.com:9200/classify/_search", true);
        esRequest.setRequestHeader("Content-Type", "application/json");
        esRequest.send(payload);

        esRequest.onreadystatechange = function () {
            if (esRequest.readyState == 4) {
                var response = esRequest.responseText;
                alert(response);
            }
        }
    }

    function translateWords(wordList) {
        var translateRequest = new XMLHttpRequest();
        var toTranslate = [{ "Text": wordList }]
        var payload = JSON.stringify(toTranslate);
        var transReq_code = "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=" + search_lang;
        translateRequest.open("POST", transReq_code, true);
        translateRequest.setRequestHeader("Ocp-Apim-Subscription-Key", "a3f7217e330e4995b2e7ea7df80d5641");
        translateRequest.setRequestHeader("Content-Type", "application/json");
        //translateRequest.setRequestHeader("Content-Length", payload.length);
        translateRequest.send(payload);

        translateRequest.onreadystatechange = function () {
            if (translateRequest.readyState == 4) {
                var response = translateRequest.responseText;
                var translatedWords = response.substring(response.lastIndexOf("text\":\"") + 8, response.lastIndexOf("\",\"to"));
                translatedWords = translatedWords.replace(/ /g, "");
                getSearchResults(translatedWords);
            }
        }
    }

    /**
     * Sends a GET request to the Bing Search API to get back relevant results.
     * Alerts the list of URLs and the amount of total URLs received.
     */
    function getSearchResults(wordList) {
        var searchRequest = new XMLHttpRequest();
        wordList = encodeURI(wordList);
        searchRequest.open("GET", "https://api.cognitive.microsoft.com/bing/v7.0/search?q=" + wordList
        	+ "&count=" + search_count
        	+ "&mkt="+ search_market
        	+ "&safeSearch=" + search_safe, true);
        searchRequest.setRequestHeader("Ocp-Apim-Subscription-Key", "2af17dabe5aa4fbc986fd9b8aa7e25b3");
        searchRequest.send();

        searchRequest.onreadystatechange = function () {
            if (searchRequest.readyState == 4) {

            	/* Format results, given in this attribute order:
            		name, url, isFamilyFriendly, displayUrl, snippet
            	*/
                
                var nameList = searchRequest.responseText.match(/\"name\": \"(.*?)\"/g);
                var urlList = searchRequest.responseText.match(/\"url\": \"(.*?)\"/g);
                var ffList = searchRequest.responseText.match(/\"isFamilyFriendly\": \"(.*?)\"/g);
                var displayUrlList = searchRequest.responseText.match(/\"displayUrl\": \"(.*?)\"/g);
                var snippetList = searchRequest.responseText.match(/\"snippet\": \"(.*?)\"/g);

                formatStrings(nameList, "name:");
                formatStrings(urlList, "url:");
                formatStrings(displayUrlList, "displayUrl:");
                formatStrings(snippetList, "snippet:");

                function formatStrings(list, listType){
                	if(list==null){
                		alert("Null list " + list + " for " + listType);
                	}
    				for (i = 0; i < list.length; i++) {
    	                list[i] = list[i].replace(/\"/g, "");	//delete all double quotes
    	                list[i] = list[i].replace(/\\\/|\/\\/g, "/");	//replace \/ with /
    	                list[i] = list[i].replace(/\\/g, "");	//delete any remaining \
    	                list[i] = list[i].replace(listType, "");
    	            }
                }
                
                displayAttribute();
                
                function displayAttribute(){
                    /*PREP WINDOW FOR RESULTS DISPLAY*/
                    document.getElementById("mainwindow").style.height = 0;
                    var reslist = document.getElementById("result_list");       //ul element
                    reslist.innerHTML = "";  //clear current <ul> list
                    window.scrollTo(0, 0);
    	            for (i = 0; i < nameList.length; i++) {
    	                
	    	                var listelem = document.createElement("LI");
	    	                listelem.setAttribute("class", "result_elem")

                            var divelem = document.createElement("DIV");
                            divelem.setAttribute("class", "tooltip");
                            //ICON
                            iconRetrieve();
                            function iconRetrieve(){
                                var domhold = "";
                                if(urlList[i]!=undefined){
                                    if(urlList[i].includes(".com/"))
                                        domhold = urlList[i].indexOf(".com/");
                                    if(urlList[i].includes(".org/"))
                                        domhold = urlList[i].indexOf(".org/");
                                }

                                if(domhold!=""){
                                    var iconpath = urlList[i].substr(0, (domhold+5)) + "favicon.ico";
                                }
                                else{   //no icon found
                                    iconpath = "images/file_grey.png";
                                }
                                var imgNode = document.createElement("IMG");
                                imgNode.setAttribute("src", iconpath);
                                //put icons to left of URL
                                imgNode.setAttribute("style", "width: 16px; height: 16px; margin: 1px;");
                                divelem.appendChild(imgNode);
                            }

                            //URL
	    	                var node = document.createElement("A");                 // Create an <a> node
	    	                var nodeName = "result_" + i;
	    	                node.setAttribute("id", nodeName);
	    		            node.setAttribute("href", urlList[i]);
	                        node.setAttribute("target", "_blank");
                            //node.setAttribute("class", "tooltip");

                            //TITLE (part of URL)
	    		            if(nameList[i].replace(/\s/g, '').length)	//if name is not blank
	    		            	node.innerHTML = nameList[i];
	    		            else
	    		            	node.innerHTML = "No Title Available";
	    		            divelem.appendChild(node);                   //add link with title of article as text

                            //adding raw URL as tooltip
                            var urltoolnode = document.createElement("SPAN");
                            urltoolnode.setAttribute("class", "tooltiptext");
                            urltoolnode.innerHTML = urlList[i];
                            divelem.appendChild(urltoolnode);

                            listelem.appendChild(divelem);
                            
                            //PREVIEW TEXT
	    		            if(snippetList[i]!=null && (snippetList[i].replace(/\s/g, '').length)){	//if preview text is not null NOR blank
	    		            	node_snip = document.createElement("P");
	    		            	node_snip.innerHTML = snippetList[i];
	    		            	listelem.appendChild(node_snip);
	    		            	reslist.appendChild(listelem);
	    		            }
	    		        
    		        }
                }
            }
        }
    	var filters_var = document.getElementById("filters");

        //Handling filters dropdown
        var filters_tl = document.getElementById("filtertitle").addEventListener("click", function(){
            document.getElementById("filter_parts").setAttribute("style", "display:block");
        });

        //Handling language dropdown
        var lang_tl = document.getElementById("langbtn").addEventListener("click", function(){
            document.getElementById("lang_parts").setAttribute("style", "display:block");
        });

        // Close the dropdown menu if the user clicks outside of it
        window.onclick = function(event) {
          if (!document.getElementById("filters").contains(event.target)) {
            var dropdowns = document.getElementById("filter_parts");
            dropdowns.classList.remove('show');
            dropdowns.setAttribute("style", "display:none");
            }
        }

        //Handling safesearch check box
        var safe_btn = document.getElementById("safecheck");
        safe_btn.addEventListener("click", function(){
        	if(safe_btn.checked==true)
        		search_safe="Strict";
        	else
        		search_safe="Off";
        });

        //Handling language buttons in FILTERS tab
        var en_btn = document.getElementById("langPref_en");
        var es_btn = document.getElementById("langPref_es");
        var fr_btn = document.getElementById("langPref_fr");
        var zh_btn = document.getElementById("langPref_zh");
        en_btn.addEventListener("click", function(){
            search_lang = en_btn.value;
            search_market = "en-US";
            filters_var.value = "not_applied";
        });
        es_btn.addEventListener("click", function(){
            search_lang = es_btn.value;
            search_market = "es-MX";
            filters_var.value = "not_applied";
        });
        fr_btn.addEventListener("click", function(){
            search_lang = fr_btn.value;
            search_market = "fr-FR";
            filters_var.value = "not_applied";
        });
        zh_btn.addEventListener("click", function(){
            search_lang = zh_btn.value;
            search_market = "zh-CN";
            filters_var.value = "not_applied";
        });

        var change_notice = document.addEventListener('click', function (event) {
            if ( event.target.classList.contains('filter_change') ) {
                doSearch(search_count, search_market, search_lang, search_safe);
            }
        }, false);
    }


}



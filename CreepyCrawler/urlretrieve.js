/*
 * Gets all the text found in the body paragraphs of the current HTML file,
 * sends that text to the KeyPhrases Azure API, and then gets
 * relevant results.
 */ 

chrome.tabs.getSelected(null, function (tab) {
    chrome.tabs.sendMessage(tab.id, { method: "getText" }, function (response) {
        var mainText = response.data.split(" ");
        getKeyPhrases(response.data, mainText);
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
    xhr.setRequestHeader("Ocp-Apim-Subscription-Key", "7d859d1e1f8d46d6817308ac3da35494");
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
    var ranking = new Array(7);
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
}

function translateWords(wordList) {
    var translateRequest = new XMLHttpRequest();
    var toTranslate = [{ "Text": wordList }]
    var payload = JSON.stringify(toTranslate);
    translateRequest.open("POST", "https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=es", true);
    translateRequest.setRequestHeader("Ocp-Apim-Subscription-Key", "cf63aca23310409995299ac563491807");
    translateRequest.setRequestHeader("Content-Type", "application/json");
    //translateRequest.setRequestHeader("Content-Length", payload.length);
    translateRequest.send(payload);

    translateRequest.onreadystatechange = function () {
        if (translateRequest.readyState == 4) {
            var response = translateRequest.responseText;
            var translatedWords = response.substring(response.lastIndexOf("text\":\"") + 8, response.lastIndexOf("\",\"to"))
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
    searchRequest.open("GET", "https://api.cognitive.microsoft.com/bing/v7.0/search?q=" + wordList, true);
    searchRequest.setRequestHeader("Ocp-Apim-Subscription-Key", "f84f70e33c9c44dbbb0db4b5f86a0b60");
    searchRequest.send();

    searchRequest.onreadystatechange = function () {
        if (searchRequest.readyState == 4) {

        	/* Format results, given in this attribute order:
        		name, url, isFamilyFriendly, displayUrl, snippet
        	*/
            
            var nameList = searchRequest.responseText.match(/\"name\": \"(.*?)\"/g);
            var urlList = searchRequest.responseText.match(/\"url\": \"(.*?)\"/g);
            //var ffList = searchRequest.responseText.match(/\"isFamilyFriendly\": \"(.*?)\"/g);
            var displayUrlList = searchRequest.responseText.match(/\"displayUrl\": \"(.*?)\"/g);
            var snippetList = searchRequest.responseText.match(/\"snippet\": \"(.*?)\"/g);

            formatStrings(nameList, "name:");
            formatStrings(urlList, "url:");
            formatStrings(displayUrlList, "displayUrl:");
            formatStrings(snippetList, "snippet:");

            function formatStrings(list, listType){
            	if(list==null){
            		alert(list);
            	}
				for (i = 0; i < list.length; i++) {
	                list[i] = list[i].replace(/\"/g, "");	//delete all double quotes
	                list[i] = list[i].replace(/\\\/|\/\\/g, "/");	//replace \/ with /
	                list[i] = list[i].replace(listType, "");
	            }
            }

            displayAttribute();	//TODO: probably remove this useless function call
            
            function displayAttribute(){
	            for (i = 0; i < nameList.length; i++) {
	                var node = document.createElement("A");                 // Create an <a> node
	                node.setAttribute("id", "result_"+i);

	                var urlNode = document.createTextNode(urlList[i]);
		            node.setAttribute("href", urlNode);
		            var nameNode = document.createTextNode(nameList[i]);
		            node.innerHTML = "nameNode";

		            node_snip = document.createElement("P");
		            var snippetNode = document.createTextNode(snippetList[i]);
		            node_snip.innerHTML = snippetNode;
		        }
            }

            function displayAttributeAll(){
	            for (i = 0; i < nameList.length; i++) {
	                
	                var node = document.createElement("LI");                 // Create a <li> node
		            var textnode = document.createTextNode(nameList[i]
		            	+ "\n" + urlList[i]
		            	+ "\n" + displayUrlList[i]
		            	+ "\n" + snippetList[i]
		            	);      // Create a text node
		            node.appendChild(textnode);                              // Append the text to <li>
		            document.getElementById("result_list").appendChild(node);     // Append <li> to <ul> with id="myList"
		        }
            }


        }
    }
}
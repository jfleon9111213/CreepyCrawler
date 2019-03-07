/*
 * Gets all the text found in the body paragraphs of the current HTML file,
 * sends that text to the KeyPhrases Azure API, and then gets
 * relevant reults.
 */ 

chrome.tabs.getSelected(null, function (tab) {
    chrome.tabs.sendMessage(tab.id, { method: "getText" }, function (response) {
        alert(response.data);
        getKeyPhrases(response.data);
    });
    /*
    var link = document.createElement('a');
    link.href = tab.url;
    if (window.XMLHttpRequest) {
        var request = new XMLHttpRequest();
    } else {
        var request = new ActiveXObject("Microsoft.XMLHTTP");
    }
    var words = "";
    request.open("GET", link.href, true);
    request.send();
    */
    /*
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            document.open();
            document.write(request.responseText);
            var list = document.getElementsByTagName("P");
            document.close();
            var i;
            for (i = 0; i < list.length; i++) {
                words = words.concat(list[i].innerText + i + " ");
            }
            alert(words);
            getKeyPhrases(words);
        }
    };*/
});

/**
 * Gets the key phrases of an article by calling the Azure Key Phrases API.
 * Also cleans the response for URL calling.
 */
function getKeyPhrases(articleText) {
    var documents = { documents: [{ language: "en", id: "1", text: articleText }] };
    var myJSON = JSON.stringify(documents);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/keyPhrases", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Ocp-Apim-Subscription-Key", "51567aff9ae14b64b15f7540a32a54d9");
    xhr.send(myJSON);

    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            //alert(xhr.responseText);
            var response = xhr.responseText;
            var wordList = response.substring(response.lastIndexOf("keyPhrases\":[") + 13, response.lastIndexOf("]}],\"errors"));
            wordList = wordList.replace(/\"/g, "");
            wordList = wordList.replace(/,/g, "+");
            wordList = wordList.replace(/ /g, "+");
            //alert(wordList);
            getSearchResults(wordList);
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
    searchRequest.setRequestHeader("Ocp-Apim-Subscription-Key", "721a6802f8dd4b648522b2dec70687d8");
    searchRequest.send();

    searchRequest.onreadystatechange = function () {
        if (searchRequest.readyState == 4) {
            //alert(searchRequest.responseText);
            var urlList = searchRequest.responseText.match(/\"url\": \"(.*?)\"/g);

            for (i = 0; i < urlList.length; i++) {
                urlList[i] = urlList[i].replace(/\"/g, "");	//delete all double quotes
                urlList[i] = urlList[i].replace("url:", ""); //delete "url: " label
                urlList[i] = urlList[i].replace(/\\\/|\/\\/g, "/");	//replace \/ with /
            }
            //formatting URLs for printing
            var urlListString = urlList.toString().replace(/,/g, "\n\n");
            alert(urlList.length + " suggestions: \n" + urlListString);

        }
    }
}
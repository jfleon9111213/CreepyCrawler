/**
 * Gets the URL of a tab, then calls the Boilerpipe API to highlight
 * what is considered to be main text by the Boilerpipe algorithm.
 * Then retrieves the highlighted text
 */
chrome.tabs.getSelected(null, function (tab) {
    var link = document.createElement('a');
    link.href = tab.url;
    if (window.XMLHttpRequest) {
        var request = new XMLHttpRequest();
    } else {
        var request = new ActiveXObject("Microsoft.XMLHTTP");
    }
    var words = "";
    //alert(link.href);
    request.open("GET", "http://boilerpipe-web.appspot.com/extract?url=" + link.href, true);
    request.send();

    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            document.open();
            document.write(request.responseText);
            var list = document.getElementsByClassName("x-boilerpipe-mark1");
            document.close();
            for (i = 0; i < list.length; i++) {
                words = words.concat(list[i].innerText + " ");
            }
            //alert(words);
            if (words.length > 5120) {
                words = words.substring(0, 5119);
            }
            getKeyPhrases(words);
        }
    };
})

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
                urlList[i] = urlList[i].replace(/\"url\": /, "");
                urlList[i] = urlList[i].replace(/\"/g, "");
            }
            alert(urlList + "::::" + urlList.length);
        }
    }
}
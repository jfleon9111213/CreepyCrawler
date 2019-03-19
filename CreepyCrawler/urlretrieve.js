/*
 * Gets all the text found in the body paragraphs of the current HTML file,
 * sends that text to the KeyPhrases Azure API, and then gets
 * relevant reults.
 */ 

chrome.tabs.getSelected(null, function (tab) {
    chrome.tabs.sendMessage(tab.id, { method: "getText" }, function (response) {
        alert(response.data);
        var mainText = response.data.split(" ");
        alert(mainText[0]);
        getKeyPhrases(response.data, mainText);
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
            alert(xhr.responseText);
            var response = xhr.responseText;
            var wordList = response.substring(response.lastIndexOf("keyPhrases\":[") + 13, response.lastIndexOf("]}],\"errors"));
            wordList = wordList.replace(/\"/g, "");
            wordList = wordList.replace(/,/g, "+");
            wordList = wordList.replace(/ /g, "+");
            var countKeyWords = wordList.split("+");
            //alert(countKeyWords.length);
            rankKeyWords(countKeyWords, mainText);
            //getSearchResults(wordList);
        }
    }
}

function rankKeyWords(wordList, mainText) {
    alert("in here");
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
                    alert(currentWord[0] + " same word");
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



   /**for (i = 0; i < ranking.length; i++) {
        alert(ranking[i][0] + " one word " + ranking[i][1]);
    }*/
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
            alert(translateRequest.responseText);
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
            alert(searchRequest.responseText);
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
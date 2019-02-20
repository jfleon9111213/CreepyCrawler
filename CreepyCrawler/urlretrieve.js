//Retrieves the URL of the current tab, gets the html file
//of the boilerpipe extraction, retrieves the highlighted text, and
//sends it to the Key Phrases Azure API. Currently working on search API call.

chrome.tabs.getSelected(null, function (tab) {
    var link = document.createElement('a');
    link.href = tab.url;
    if (window.XMLHttpRequest) {
        var request = new XMLHttpRequest();
    } else {
        var request = new ActiveXObject("Microsoft.XMLHTTP");
    }
    var words = "";
    request.open("GET", "http://boilerpipe-web.appspot.com/extract?url=" + link.href, true);
    request.send();

    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            document.open();
            document.write(request.responseText);
            var list = document.getElementsByClassName("x-boilerpipe-mark1");
            document.close();
            var i;
            for (i = 0; i < list.length; i++) {
                words = words.concat(list[i].innerText + " ");
            }
            //alert(words);
            getKeyPhrases(words);
        }
    };
})

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
            wordList = wordList.replace(/,/g, " ");
            //alert(wordList);
            getSearchResults(wordList);
        }
    }  
}

function getSearchResults(wordList) {
    var searchRequest = new XMLHttpRequest();
    searchRequest.open("GET", "https://api.cognitive.microsoft.com/bing/v7.0/search", true);
    searchRequest.setRequestHeader("Ocp-Apim-Subscription-Key", "721a6802f8dd4b648522b2dec70687d8");
    searchRequest.send();

    searchRequest.onreadystatechange = function () {
        if (searchRequest.readyState == 4) {
            alert(searchRequest.responseText);
        }
    }
}
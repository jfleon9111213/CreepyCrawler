//Retrieves the URL of the current tab and prints it out
$(document).ready(function() {
    chrome.tabs.getSelected(null, function (tab) {
        var link = document.createElement('a');
        link.href = tab.url;
        var request = $.ajax({ url: link.href, success: function(data) { alert(data); } });
        //$('#host').html("HTML : " + request);
    })
    
    //sending HTML file to Key Phrase API call
    var documents =
    {
        "documents":[
            {
                language: "en",
                id: "1",
                text: request
            }
        ]
    };
    var myJSON = JSON.stringify(documents);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/keyPhrases", true);
    xhr.setRequestHeader("Content-Type","application/json");
    xhr.setRequestHeader("Ocp-Apim-Subscription-Key", "51567aff9ae14b64b15f7540a32a54d9");
    xhr.send(myJSON);
    xhr.onreadystatechange = function() {
        if(xhr.readyState == 4) {
            alert("Success:  " + xhr.responseText);
        }
    };

});

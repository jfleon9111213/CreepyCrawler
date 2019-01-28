//Retrieves the URL of the current tab and prints it out
$(document).ready(function() {
    chrome.tabs.getSelected(null, function (tab) {
        var link = document.createElement('a');
        link.href = tab.url;
        $('#host').html("URL : " + link.href);
    })
});
//Gets the HTML file of the current tab, and returns all text from body paragraphs.
chrome.runtime.onMessage.addListener(function (request, sender, response) {
    var list = document.getElementsByTagName("P");
    var words = "";
    for (var i = 0; i < list.length; i++) {
        words = words.concat(list[i].innerText + i + " ");
    }
    if (words.length > 5120) {
        words = words.substring(0, 5119);
    }
    response({ data: words });
});


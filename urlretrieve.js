//Retrieves the URL of the current tab, gets the html file
//of the boilerpipe extraction, retrieves the highlighted text, and
//ouputs it.
chrome.tabs.getSelected(null, function (tab) {
    var link = document.createElement('a');
    link.href = tab.url;
    if (window.XMLHttpRequest) {
        var request = new XMLHttpRequest();
    } else {
        var request = new ActiveXObject("Microsoft.XMLHTTP");
    }
    request.open("GET", " http://boilerpipe-web.appspot.com/extract?url=" + link.href, true);
    request.send();
    request.onreadystatechange = function() {
        if(request.readyState == 4) {
            document.open();
	    document.write(request.responseText);
	    var list = document.getElementsByClassName("x-boilerpipe-mark1");
            var i;
            var words = "";
            for(i = 0; i < list.length; i++) {
                words = words.concat(list[i].innerText + " ");
            }
            alert(words);
        };
    };
})
/*
 * Holds some URLs for UI testing.
 * Meant to emulate results of actual urlretrieve.js
*/

var fb= document.getElementById("filterbtn");
fb.addEventListener("click", function filterShow(){
    var fltrs = document.getElementById("filters");
    if(fltrs.value=="hidden"){
        fltrs.style.display = "block";
        fltrs.value = "shown";
    }
    else{
        fltrs.style.display = "none";
        fltrs.value = "hidden";
    }
});

//SAFESEARCH TOGGLE
var stb = document.getElementById("safeToggle");
stb.addEventListener("click", buttonChange(stb));
function buttonChange(elem)
{
    if (elem.value=="Safe Search is off") elem.value = "Safe Search is on";
    else elem.value = "Safe Search is off";
    //TODO: IMPLEMENT SAFESEARCH FILTER HERE
}

//LANGUAGE DROPDOWN MENU
/* When the user clicks on the dropdown menu button, 
toggle between hiding and showing the dropdown content */
var ddb = document.getElementById("langDropdown");
ddb.addEventListener("click", dropdownFunction);
function dropdownFunction() {
  document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}

//LANGUAGE DROPDOWN MENU CONT'D: INDIVIDUAL LANGUAGE BUTTONS
//TODO: debug dropdown choices not toggling
/*
var lsb = document.getElementsByClassName("lang_button");
for(var crnt_lsb = 0; crnt_lsb < lsb.length; crnt_lsb++){
	lsb[crnt_lsb].addEventListener("click", displayResult(lsb[crnt_lsb].id));
}
*/

document.getElementById("langPref_en").addEventListener("click", displayResult("langPref_en"));
document.getElementById("langPref_sp").addEventListener("click", displayResult("langPref_sp"));
document.getElementById("langPref_de").addEventListener("click", displayResult("langPref_de"));

function displayResult(hiddenClass) {
    //change button
    var elem = document.getElementById(hiddenClass);
    var lang_list = document.getElementsByClassName(hiddenClass.substr(10, 11));
    var lang_action = "";	//"none"(hide) or "block" (show)

//TODO: current for loop might not be viable for addEventListener, i.e. it might be implementing it immediately
//instead of on "click"
    if (elem.value=="Hide"){ 
        elem.value = "Show";
        //change links displayed
        lang_action = "none";
    }
    else{
        elem.value = "Hide";  
        //change links displayed
        lang_action = "block";
    }

    for (var i = 0; i < lang_list.length; i++) {
    		alert("action: " + lang_action);
            lang_list[i].style.display = lang_action;
        }
}
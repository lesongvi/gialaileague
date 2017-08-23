var show_part = new Array();
var show_title = new Array();
function showpart(obj,showid,n) {
	if (show_part[n]) show_part[n].style.display = "none";
	if (show_title[n]) show_title[n].className = "ui-tabs-disabled";
	obj.className = "actived";
	show_part[n] = document.getElementById(showid);
	show_part[n].style.display = "block";
	show_title[n] = obj;
}

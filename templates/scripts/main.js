var inject=function(ob) {
	var sb = document.getElementById('sidebar');
	var cb = document.getElementById('content-body');
	var cm = document.getElementById('content-menu');
	sb.innerHTML=ob.sb;
	cb.innerHTML=ob.cb;
	cm.innerHTML=ob.cm;
};

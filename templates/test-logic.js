var cvk = {
	g: function(id) {
		return document.getElementById(id);
	},
	wipe: function(ele) {
		while (ele.childNodes.length) {
			ele.removeChild(0);
		}
	}
};

var test = {
	overview: 'Hi, I\'m an overview',
	questions: [
		['How?','Now'],
		['Why?','Sky']
	]
};

var cBody = cvk.g('content-body'),
	cMenu = cvk.g('content-menu');
cvk.wipe(cBody);


var sys = require('sys'),
	//http=require('http'),
	fs=require('fs'),
	//url=require('url'),
	qs = require('querystring'),
	template = require('./lib/template'),
	nerve = require('./lib/nerve'),
	db = require('./db-access');

var simpleCat=function(filePath){
	return ''+fs.readFileSync(filePath);
};

var testCat=function(req, res) {
	res.writeHead(200,{'content-type':'text/html'});
	var t = simpleCat('./test.html');
	sys.puts(t);
	res.end(template.create(t,{word:"cat"}));
};

var getPostParams = function(req, callback) {
	var body='';
	req.addListener('data', function(chunk) {
		body+=chunk;
	})
	.addListener('end', function() {
		var obj=qs.parse(body.replace(/\+/g, ' '));
		callback(obj);
	});
};

var serveLesson = function(req, res, id) {
	db.getLesson(id, function(obj) {
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end(JSON.stringify(obj));
	})
};

var serveLessonList = function(req, res) {
	db.getLessonList(function(arr) {
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end(JSON.stringify(arr));
	});
};

var showLesson = function(req,res,l_id) {
	db.getLessonList(function(l_list) {
		db.getLesson(l_id, function(lesson) {
			var t = simpleCat('./lesson.html');
			res.writeHead(200, {'content-type':'text/html'});
			res.end(template.create(t,{lesson:lesson,l_id:l_id,l_list:l_list}));
		})
	})
};

var createLesson = function(req, res) {
	getPostParams(req, function(obj) {
		db.addLesson(obj, function() {
			res.respond('a-okay!');
		});
	});
};

// Nerve URL Routing
nerve.create([
	[ "/", serveLessonList ],
	[ "/cat/", testCat ],
	//[ nerve.post("/add-user"), addUser ],
	[ nerve.get(/^\/lesson\/([0-9]+)/), showLesson ],
	[ nerve.post("/add-lesson"), createLesson ]
]).listen(8000);

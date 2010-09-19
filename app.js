// Deps
var sys = require('sys'),
	//http=require('http'),
	fs=require('fs'),
	//url=require('url'),
	qs = require('querystring'),
	template = require('./lib/template'),
	nerve = require('./lib/nerve'),
	db = require('./db');

// Util
var qCat=function(filePath){
	return ''+fs.readFileSync(filePath);
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

// Admin
var createLesson = function(req, res) {
	getPostParams(req, function(obj) {
		db.addLesson(obj, function() {
			res.respond('a-okay!');
		});
	});
};

// Views
var showLesson = function(req,res,l_id) {
	db.getLessonList(function(l_list) {
		db.getLesson(l_id, function(lesson) {
			res.writeHead(200, {'content-type':'text/html'});
			res.end(template.create(qCat('./lesson.html'), {
				lesson:lesson,
				l_id:l_id,
				l_list:l_list
			}))
		})
	})
};

var attemptTest = function(req, res, l_id) {
	if (req.session['login'] == true) {
		db.getLessonList(function(l_list) {
			db.getLesson(l_id, function(lesson) {
				res.writeHead(200, {'content-type': 'text/html'});
				res.end(template.create(qCat('templates/test.html'), {
					lesson: lesson,
					l_id: l_id,
					l_list: l_list,
					u_id: req.session['uid'],
					u_name: req.session['uname']
				}))
			})
		});
	} else {
		//Redirect to home or maybe login or show lesson
	}
};

var processTest = function(req, res, results) {
	if (req.session['login'] == true) {
	} else {
	}
};

var showTestResults = function(req, res) {
};

var showAllResults = function(req, res) {
};

var tryLogin = function(req, res) {
	getPostParams(req, function(obj) {
		db.checkLogin(obj.uname, obj.pword, function(ok, id) {
			if (ok) {
				req.session['login'] = true;
				req.session['uid'] = id;
				req.session['uname'] = obj.uname;
			}
			// TEMP
			serveLessonList(req, res);
		})
	})
}

// Url
nerve.create([
	[ "/", serveLessonList ],
	//[ nerve.post("/add-user"), addUser ],
	[ nerve.get(/^\/lesson\/([0-9]+)/), showLesson ],
	[ nerve.post("/add-lesson"), createLesson ],
	[ nerve.post('/try-login/'), tryLogin ],
	[ '/display-login/', displayLogin ]
], {session_duration:3600000}).listen(8000);

/*
var displayLogin = function(req, res) {
	sys.puts(req.session['login']);
	if (req.session['login']==true) {
		res.writeHead(200, {'content-type':'text/html'});
		res.end('logged in')
	} else {
		res.writeHead(200, {'content-type':'text/html'});
		res.end('not logged in')
	}
};
*/

/*
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
	})
};
*/

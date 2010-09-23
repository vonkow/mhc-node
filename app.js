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
var qCat=function(filePath) {
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

var render = function(res, t, o) {
	res.writeHead(200, {'content-type':'text/html'});
	var tem = qCat(t);
	res.end(template.create(tem, o));
};

var serveHighcharts = function(req, res) {
	sys.puts('Serving Highcharts');
	res.writeHead(200, {'Content-Type':'application/javascript'});
	res.end(qCat('templates/js/highcharts.js'));
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
var serveLessonList = function(req, res) {
	db.getLessonList(function(arr) {
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end(JSON.stringify(arr));
	})
};

var showHome = function(req, res) {
	db.getLessonList(function(l_list) {
		sys.puts('Displaying Home');
		render(res, 'templates/base.html', {
			ctx:'home',
			u_id:(req.session['uid']||0),
			l_list: l_list
		})
	});
};

var showLesson = function(req,res,l_id) {
	db.getLessonList(function(l_list) {
		db.getLesson(l_id, function(lesson) {
			sys.puts('attempting render')
			render(res, 'templates/base.html', {
				ctx:'view',
				lesson:lesson,
				u_id:(req.session['uid']||0),
				l_id:l_id,
				l_list:l_list
			})
		})
	})
};

var attemptTest = function(req, res, l_id) {
	if (req.session['login'] == true) {
		db.getLessonList(function(l_list) {
			db.getLesson(l_id, function(lesson) {
				render(res, 'templates/base.html', {
					ctx:'attempt',
					lesson: lesson,
					l_id: l_id,
					l_list: l_list,
					u_id: req.session['uid'],
					u_name: req.session['uname']
				});
			})
		});
	} else {
		//Redirect to home or maybe login or show lesson
	}
};

var showTestResults = function(req, res, l_id) {
	if (req.session['login'] == true) {
		db.getLessonList(function(l_list) {
			db.getLesson(l_id, function(lesson) {
				db.getTestResults({
					uid: req.session['uid'],
					test: l_id
				}, function(results) {
						render(res, 'templates/base.html', {
							ctx:'results',
							results: results,
							lesson: lesson,
							l_id: l_id,
							l_list: l_list,
							u_id: req.session['uid'],
							u_name: req.session['uname']
						});
					//res.writeHead(200, {'Content-Type': 'text/html'});
					//res.end(JSON.stringify(results));
				})
			})
		})
	} else {
	}
};

var processTest = function(req, res) {
	sys.puts('Processing Test')
	//if (req.session['login'] == true) {
		getPostParams(req, function(obj) {
			db.addTestAttempt(obj, function() {
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.end('All Good');
			})
			//{u_id,l_id,results}
		});
	//} else {
	//}
};

var tryLogin = function(req, res) {
	getPostParams(req, function(obj) {
		db.checkLogin(obj.uname, obj.pword, function(ok, id) {
			if (ok) {
				req.session['login'] = true;
				req.session['uid'] = id;
				req.session['uname'] = obj.uname;
				sys.puts('login ok');
			}
			// TEMP
			//serveLessonList(req, res);
			redirectHome(res);
		})
	})
}

var redirectHome = function(res) {
	sys.puts('serving redirect');
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write("<!doctype html><html><body><script>window.location.replace('http://127.0.0.1:8000/');</script></body></html>\n", 'utf8');
	res.end();
}

// Url
nerve.create([
	//[ "/", serveLessonList ],
	//[ nerve.post("/add-user"), addUser ],
	[ '/', showHome ],
	[ nerve.get(/^\/lesson\/([0-9]+)/), showLesson ],
	[ nerve.post("/add-lesson"), createLesson ],
	[ nerve.post('/try-login/'), tryLogin ],
	[ nerve.post('/process-test'), processTest ],
	[ nerve.get(/^\/results\/([0-9]+)/), showTestResults ],
	[ nerve.get(/^\/test\/([0-9]+)/), attemptTest ],
	[ "/js/highcharts.js", serveHighcharts ]
	//[ '/display-login/', displayLogin ]
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

*/

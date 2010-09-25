// Deps
var sys = require('sys'),
	fs=require('fs'),
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

var serveLogo = function(req, res) {
	sys.puts('Serving Logo');
	res.writeHead(200, {'Content-Type':'image/gif'});
	res.end(fs.readFileSync('templates/images/dare-title.gif'));
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

var showHome = function(req, res, u_id) {
	if (!u_id) var u_id=0;
	db.getNameById(u_id, function(u_name) {
		db.getLessonList(function(l_list) {
			sys.puts('Displaying Home');
			sys.puts('User: '+u_id+'/'+u_name);
			render(res, 'templates/base.html', {
				ctx:'home',
				u_id:u_id,
				u_name: u_name,
				cur_test : 1,
				l_id: 0,
				l_list: l_list
			})
		})
	})
};

var showLesson = function(req,res, u_id,l_id) {
	db.getNameById(u_id, function(u_name) {
		db.getLessonList(function(l_list) {
			db.getLesson(l_id, function(lesson) {
				sys.puts('Showing Lesson: '+l_id+' to User: '+u_id);
				render(res, 'templates/base.html', {
					ctx:'view',
					lesson:lesson,
					u_id:u_id,
					u_name: u_name,
					l_id:l_id,
					l_list:l_list
				})
			})
		})
	})
};

var attemptTest = function(req, res, u_id, l_id) {
	//if (req.session['login'] == true) {
	if (u_id==0) {
		redirectHome(res, 0);
	} else {
			//req.session['cur_test'] = l_id;
		db.getNameById(u_id, function(u_name) {
			db.getLessonList(function(l_list) {
				db.getLesson(l_id, function(lesson) {
					sys.puts('Testing Lesson: '+l_id+' on User: '+u_id);
					render(res, 'templates/base.html', {
						ctx:'attempt',
						lesson: lesson,
						l_id: l_id,
						l_list: l_list,
						u_id: u_id,
						u_name: u_name
					});
				})
			})
		});
	}
};

var showTestResults = function(req, res, u_id, l_id) {
	//if (req.session['login'] == true) {
	if (u_id==0) {
		redirectHome(res, 0);
	} else {
		db.getNameById(u_id, function(u_name) {
			db.getLessonList(function(l_list) {
				db.getLesson(l_id, function(lesson) {
					db.getTestResults({
						uid: u_id,
						test: l_id
					}, function(results) {
						render(res, 'templates/base.html', {
							ctx:'results',
							results: results,
							lesson: lesson,
							l_id: l_id,
							l_list: l_list,
							u_id: u_id,
							u_name: u_name
						});
					})
				})
			})
		})

	}
};

var processTest = function(req, res) {
	sys.puts('Processing Test')
	getPostParams(req, function(obj) {
		db.addTestAttempt(obj, function() {
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.end('All Good');
		})
	});
};

var tryLogin = function(req, res) {
	getPostParams(req, function(obj) {
		db.getIdByName(obj.uname, function(id) {
		//db.checkLogin(obj.uname, obj.pword, function(ok, id, cur_test) {
			//if (ok) {
				//req.session['login'] = true;
				//req.session['uid'] = id;
				//req.session['uname'] = obj.uname;
				//req.session['cur_test'] = cur_test;
				//sys.puts('login ok');
			//}
			sys.puts('User: '+id+' Login');
			redirectHome(res, id);
		})
	})
}

var registerUser = function(req, res) {
	getPostParams(req, function(obj) {
		db.addUser(obj, function(obj) {
			db.checkLogin(obj.uname, obj.pword, function(ok, id) {
				//if (ok) {
					////req.session['login'] = true;
					//req.session['uid'] = id;
					//req.session['uname'] = obj.uname;
					//req.session['cur_test'] = 1;
					//sys.puts('login ok');
				//}
				sys.puts('User: '+id+' Added');
				redirectHome(res, id);
			})
		})
	})
};

var logOut = function(req, res) {
	sys.puts('User Logoff');
	//req.session['login'] = false;
	//req.session['uid'] = 0;
	//req.session['uname'] = '';
	redirectHome(res, 0);
};


var redirectHome = function(res, u_id) {
	sys.puts('Serving User: '+u_id+'Redirect');
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write("<!doctype html><html><body><script>window.location.href='http://'+window.location.host+'/"+u_id+"';</script></body></html>\n", 'utf8');
	res.end();
}

// Url
nerve.create([
	[ '/', showHome ],
	[ '/log-out/', logOut ],
	[ nerve.get(/^\/([0-9]+)\/lesson\/([0-9]+)/), showLesson ],
	[ nerve.post("/add-lesson"), createLesson ],
	[ nerve.post('/try-login/'), tryLogin ],
	[ nerve.post('/add-user/'), registerUser ],
	[ nerve.post('/process-test'), processTest ],
	[ nerve.get(/^\/([0-9]+)\/results\/([0-9]+)/), showTestResults ],
	[ nerve.get(/^\/([0-9]+)\/test\/([0-9]+)/), attemptTest ],
	[ nerve.get(/^\/([0-9]+)/), showHome ],
	[ "/images/logo.gif", serveLogo ],
	[ "/js/highcharts.js", serveHighcharts ]
], {session_duration:3600000}).listen(8000);


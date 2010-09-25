var redis = require('./lib/redis-client'),
	sys = require('sys');

// Getters
exports.checkLogin = function(uname, pword, callback) {
	var r = redis.createClient();
	r.stream.addListener('connect', function() {
		sys.puts(uname)
		r.get('user.by.uname:'+uname, function(err, id){
			if (!id) {
				callback(false, 0, 0);
			} else {
				sys.puts(id);
				r.get('user:'+id+':pword', function(err, dpword) {
					sys.puts(pword+' '+dpword);
					if (pword==dpword) {
						r.get('user:'+id+':cur.test', function(err, cur_test) {
							//We're good, save to session and redirect;
							sys.puts('cur test'+cur_test);
							callback(true, id, cur_test);
						});
					} else {
						// WRONG!!! Re-direct back to login
						callback(false, id, 0);
					};
				})
			};
		})
	})
};

exports.getLessonList = function(callback) {
	var r = redis.createClient();
	var arr = [];
	r.stream.addListener('connect', function() {
		r.get('cur.lesson.id', function(err, id) {
			id=parseInt(id);
			var len=id+1;
			for (var x=1;x<len;x++) {
				if (x+1!=len) {
					r.get('lesson:'+x+':name', function(err, name) {
						arr.push({'id':arr.length+1, 'name':''+name});
					})
				} else {
					r.get('lesson:'+x+':name', function(err, name) {
						arr.push({'id':arr.length+1, 'name':''+name});
						sys.puts('Got Lesson List');
						r.close();
					})
				}
			};
		});
	})
	.addListener('end', function() {
		callback(arr);
	});
}

exports.getIdByName = function(uname, callback) {
	sys.puts('Get Id by Uname: '+uname);
	var r = redis.createClient(),
		uid;
	r.stream.addListener('connect', function() {
		r.get('user.by.uname:'+uname, function(err, id) {
			sys.puts(uname+': '+id);
			uid=(id||0);
			r.close();
		})
	})
	.addListener('end', function() {
		sys.puts('Got Id: '+uid);
		callback(uid);
	});
};

exports.getNameById = function(uid, callback) {
	sys.puts('Get Uname by Id: '+uid);
	var r = redis.createClient(),
		uname;
	r.stream.addListener('connect', function() {
		r.get('user:'+uid+':uname', function(err, name) {
			uname=(name||0);
			r.close();
		})
	})
	.addListener('end', function() {
		sys.puts('Got Uname: '+uname);
		callback(uname);
	});
};

/**
 * Gets requested lesson by id <br>
 * @param id Id of lesson
 * @param callback Callback function
 * @returns Requested lesson in JSON
 */
exports.getLesson = function(id, callback) {
	var r = redis.createClient();
	var obj = {};
	r.stream.addListener('connect', function(){
		r.get('lesson:'+id+':name', function(err, name) {
			obj.name = ''+name;
			r.get('lesson:'+id+':intro', function(err, intro) {
				obj.intro = ''+intro;
				r.lrange('lesson:'+id+':q', 0, -1, function(err, q) {
					obj.q=q;
					r.lrange('lesson:'+id+':a', 0, -1, function(err, a) {
						obj.a=a;
						r.lrange('lesson:'+id+':k', 0, -1, function(err, k) {
							obj.k=k;
							r.close();
						})
					});
				});
			});
		});
	})
	.addListener('end', function() {
		sys.puts("Got Lesson: "+id);
		callback(obj);
	});
}

var getTest = function(r,obj,tot,cur,arr) {
	var s = 'user:'+obj.uid+':tests:'+obj.test+':attempts:'+cur;
	r.get(s+':date', function(err, test_date) {
		r.get(s+':total', function(err, total) {
			r.get(s+':correct', function(err, correct) {
				r.get(s+':results', function(err, results) {
					arr.push({
						test_date: ''+test_date,
						total: ''+total,
						correct: ''+correct,
						results: results
						//results: JSON.parse(results)
					});
					if (++cur<=tot) {
						getTest(r,obj,tot,cur,arr);
					} else {
						r.close();
					}
				})
			})
		})
	})
}

exports.getTestResults = function(obj, callback) {
	sys.puts('GET TEST RESULTS');
	sys.puts('User: '+obj.uid);
	sys.puts('Test: '+obj.test);
	var arr = [],
		r = redis.createClient();
	r.stream.addListener('connect', function() {
		r.get('user:'+obj.uid+':tests:'+obj.test+':cur.attempt', function(err, tot) {
			sys.puts('Attempts: '+tot);
			getTest(r,obj,tot,1,arr);
		})
	}).addListener('end', function() {
		callback(arr);
	})
};

// Setters
exports.addLesson = function(obj, callback) {
	var r = redis.createClient();
	r.stream.addListener('connect', function() {
		r.incr('cur.lesson.id', function(err, id) {
			r.set('lesson:'+id+':name', obj.name, function() {});
			r.set('lesson:'+id+':intro', obj.intro, function() {});
			for (var x=0;x<obj.q.length;x++) {
				r.rpush('lesson:'+id+':q', obj.q[x], function(){});
				r.rpush('lesson:'+id+':a', obj.a[x], function(){});
				if (x+1!=obj.q.length) {
					r.rpush('lesson:'+id+':k', obj.a[x], function(){});
				} else {
					r.rpush('lesson:'+id+':k', obj.a[x], function(){
						r.close();
					});
				}
			};
		})
	}).addListener('end', function() {
		callback();
	})
};


exports.addUser = function(obj, callback) {
	var r = redis.createClient();
	r.stream.addListener('connect', function() {
		r.incr('cur.user.id', function(err, id) {
			r.set('user:'+id+':uname', obj.uname, function() {
				r.set('user.by.uname:'+obj.uname, id, function(){
					r.set('user:'+id+':pword', ' ', function(){
						r.set('user:'+id+':cur.test', 1, function() {
							callback(obj);
						});
					});
				});
			});
		});
	});
};

exports.addTestAttempt = function(obj, callback) {
	var r = redis.createClient();
	r.stream.addListener('connect', function() {
		r.incr('user:'+obj.u_id+':tests:'+obj.l_id+':cur.attempt', function(err, att) {
			var s = 'user:'+obj.u_id+':tests:'+obj.l_id+':attempts:'+att;
			r.set(s+':date', new Date(), function() {
				r.set(s+':total', obj.total, function() {
					r.set(s+':correct', obj.correct, function() {
						r.set(s+':results', ''+JSON.stringify(obj.results), function() {
							r.set('user:'+obj.u_id+':cur.test', obj.l_id, function() {
								sys.puts('Set Test Attempt: '+att+', User: '+obj.u_id+', Test: '+obj.l_id);
								r.close();
							})
						})
					})
				})
			})
		})
	}).addListener('end', function() {
		callback();
	})
};

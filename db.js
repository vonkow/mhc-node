var redis = require('./lib/redis-client'),
	sys = require('sys');

// Getters
exports.checkLogin = function(uname, pword, callback) {
	var r = redis.createClient();
	r.stream.addListener('connect', function() {
		sys.puts(uname)
		r.get('user.by.uname:'+uname, function(err, id){
			sys.puts(id);
			r.get('user:'+id+':pword', function(err, dpword) {
				sys.puts(pword+' '+dpword);
				if (pword==dpword) {
					//We're good, save to session and redirect;
					callback(true, id);
				} else {
					// WRONG!!! Re-direct back to login
					callback(false, 0);
				};
			})
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
		});
		r.get('lesson:'+id+':intro', function(err, intro) {
			obj.intro = ''+intro;
		});
		r.lrange('lesson:'+id+':q', 0, -1, function(err, q) {
			obj.q=q;
		});
		r.lrange('lesson:'+id+':a', 0, -1, function(err, a) {
			obj.a=a;
			sys.puts("got lesson: "+id);
			r.close();
		});
	})
	.addListener('end', function() {
		callback(obj);
	});
}

var getTest = function(r,obj,tot,cur,arr) {
	var s = 'user:'+obj.uid+':tests:'+obj.test+':attempts:'+cur;
	r.get(s+':total', function(err, total) {
		r.get(s+':correct', function(err, correct) {
			r.get(s+':results', function(err, results) {
				sys.puts(results);
				arr.push({
					total: ''+total,
					correct: ''+correct,
					results: ''+results
				});
				if (++cur<=tot) {
					getTest(r,obj,tot,cur,arr);
				} else {
					r.close();
				}
			})
		})
	})
}

exports.getTestResults = function(obj, callback) {
	sys.puts(obj.uid+' '+obj.test+' u/t');
	var arr = [],
		r = redis.createClient();
	r.stream.addListener('connect', function() {
		r.get('user:'+obj.uid+':tests:'+obj.test+':cur.attempt', function(err, tot) {
			sys.puts(tot);
			getTest(r,obj,tot,1,arr);
				/*
			for (var x=1;x<tot+1;x++) {
				if (x+1!=tot) {
					var s = 'user:'+obj.uid+':tests:'+obj.test+':attempts:'+x;
					r.get(s+':total', function(err, total) {
						r.get(s+':correct', function(err, correct) {
							r.get(s+':results', function(err, results) {
								arr.push({
									total: total,
									correct: correct,
									results: JSON.stringify(results)
								});
							})
						})
					})
				} else {
					var s = 'user:'+obj.uid+':tests:'+obj.test+':attempts:'+x;
					r.get(s+':total', function(err, total) {
						r.get(s+':correct', function(err, correct) {
							r.get(s+':results', function(err, results) {
								arr.push({
									total: total,
									correct: correct,
									results: JSON.stringify(results)
								});
								r.close();
							})
						})
					})
				}
			}
			*/
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
				if (x+1!=obj.q.length) {
					r.rpush('lesson:'+id+':a', obj.a[x], function(){});
				} else {
					r.rpush('lesson:'+id+':a', obj.a[x], function(){
						r.close();
					});
				}
			};
			//callback();
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
					r.set('user:'+id+':pword', obj.pword, function(){
						callback();
					});
				});
			});
		});
	});
};

exports.addTestAttempt = function(obj, callback) {
	sys.puts(JSON.stringify(obj.results));
	var r = redis.createClient();
	r.stream.addListener('connect', function() {
		r.incr('user:'+obj.u_id+':tests:'+obj.l_id+':cur.attempt', function(err, att) {
			var s = 'user:'+obj.u_id+':tests:'+obj.l_id+':attempts:'+att;
			r.set(s+':total', obj.total, function() {
				r.set(s+':correct', obj.correct, function() {
					r.set(s+':results', ''+JSON.stringify(obj.results), function() {
						r.close();
						callback();
					})
				})
			})
		})
	})
};

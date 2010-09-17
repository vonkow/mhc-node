var redis = require('./lib/redis-client'),
	sys = require('sys');

exports.getLessonList = function(callback) {
	var r = redis.createClient();
	var arr = [];
	r.stream.addListener('connect', function() {
		r.get('cur.lesson.id', function(err, id) {
			id=parseInt(id);
			var len=id+1;
			sys.puts(len+' '+id);
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

exports.addLesson = function(obj, callback) {
	var r = redis.createClient();
	r.stream.addListener('connect', function() {
		r.incr('cur.lesson.id', function(err, id) {
			r.set('lesson:'+id+':name', obj.name, function() {});
			r.set('lesson:'+id+':intro', obj.intro, function() {});
			for (var x=0;x<obj.q.length;x++) {
				r.rpush('lesson:'+id+':q', obj.q[x], function(){});
				r.rpush('lesson:'+id+':a', obj.a[x], function(){});
			};
			callback();
		})
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

exports.checkLogin = function(uname, pword, callback) {
	var r = redis.createClient();
	r.stream.addListener('connect', function() {
		r.get('user.by.uname'+uname, function(err, id){
			r.get('user:'+id+':pword', function(err, dpword) {
				if (pword==dpword) {
					//We're good, save to session and redirect;
				} else {
					// WRONG!!! Re-direct back to login
				};
			})
		})
	})
};

exports.addTestAttempt = function(obj, callback) {
};

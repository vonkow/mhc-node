var sys = require('sys'),
	http=require('http'),
	fs=require('fs'),
	url=require('url'),
	qs = require('querystring'),
	template = require('../../node-template/lib/template'),
	nerve = require('../../nerve/lib/nerve'),
	redis = require('../../redis-node-client/lib/redis-client');

var createLesson = function(lesson,callback) {
};

http.createServer(function(req, res) {
	var u = url.parse(req.url),
		p = u.pathname.split('/'),
		len = p.length,
		r = redis.createClient();
	sys.puts(u.pathname);
	sys.puts(p.length);
	for (var x=0; x<len; x++) {
		sys.puts(x+': '+p[x]);
		if (x) r.rpush('tlist', p[x]);
	}
	r.lrange('tlist',0,-1,function(err, val) {
		var text = '';
		for (var x = 0; x<val.length; x++) {
			sys.puts(val[x]);
			text+=(val[x]+'<br>');
		};
		r.save();
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end(text);
	});
	/*
	r.lrange('tlist', 0, -1, function(err, values){
		sys.puts(values[x]);
		for (var x=0; x<values.length; x++) text+=(values[x]+'\n');
	});
	*/
	
}).listen(8000, "127.0.0.1");
sys.puts('Server Up!');

/*
r.set('foo', 'barr?!!', function() {
	sys.puts('okay?')
});

r.save();

r.info(function(err, info) {
	if (err) throw new Error(err);
	sys.puts("Redis Version is: "+info.redis_version);
	r.close();
});
*/

cur.lesson.id
lesson:x
	:name
	:intro
	:q
		[]
	:a
		[]
cur.user.id
user.by.uname:x
user:x
	:uname
	:pword
	(:user info)
	:tests:x
		:cur.attempt
		:attempts
			[
				:total
				:correct
				:results
					[
						:q
						:correct
					]
			]

/*
Function List
	db
		# Getters
		checkLogin(uname, pword, callback)

		getLessonList()

		getLesson(id, callback)

		getTestResults(obj, callback)

		# Setters
		addLesson(obj, callback)

		addUser(obj, callback)

		addTestAttempt(obj, callback)

	app
		# Util
		qCat(filePath)

		getPostParams(req, callback)

		render(res, t, o)

		# Admin
		createLesson(req, res)

		# Views
		serveLesson List(req, res)

		showLesson(req, res, l_id)

		attemptTest(req, ers, l_id)

		processTest(req, res)

		showTestResults(req, res, l_id)

		tryLogin(req, res)

Page List
	Home

	Intro

	Login

	Register

	View Tests

	Take Tests

	Show Results


*/

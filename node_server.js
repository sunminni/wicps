const bodyParser = require('body-parser')
const express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');
const app = express();
const path = require('path');
var MongoClient = require('mongodb').MongoClient;
var DB_URL = "mongodb://localhost:27017/";
var https = require('https');
var url = require('url');
const fs = require('fs');
const fsExtra = require('fs-extra');

//include JS folder
app.use(express.static(__dirname));
app.use(express.static(__dirname + '/js'));
app.use(express.static(__dirname + '/css'));
app.use(express.static(__dirname + '/sample'));

//use json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

// initialize cookie-parser to allow us access the cookies stored in the browser. 
app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
	key: 'user_sid',
	secret: 'somerandonstuffs',
	resave: false,
	saveUninitialized: false,
	cookie: {
		expires: 60000000
	}
}));

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
	if (req.cookies.user_sid && !req.session.user) {
		res.clearCookie('user_sid');
	}
	next();
});

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
	if (req.session.user && req.cookies.user_sid) {
		//console.log(req.session.is_developer);
		if (req.session.is_developer=='true'){
			// console.log('developer');
			res.sendFile(path.join(__dirname+'/developer.html'));
		}
		else{
			res.sendFile(path.join(__dirname+'/designer.html'));
		}
	} else {
		next();
	}    
};

// route for Home-Page
app.get('/', sessionChecker, (req, res) => {
	res.redirect('/login');
});

app.get('/login', sessionChecker, (req,res) => {
	res.sendFile(path.join(__dirname+'/login.html'));
});

app.get('/index', sessionChecker, (req,res) => {
	res.redirect('/login');
});

app.get('/logout', (req,res) => {
	res.clearCookie('user_sid');
	res.redirect('/login');
});


//handle AJAX(post) calls 
app.use(function (req, res, next) {
	var url_parts = url.parse(req.url, true);

	if (req.method == 'POST') {
		switch (url_parts.pathname) {
			case '/login':
				var req_id = req.body.id;
				var req_pw = req.body.password;
				// do something
				// console.log('client attempts to login');
				// console.log('id: '+req_id);
				// console.log('pw: '+req_pw);

				MongoClient.connect(DB_URL, { useUnifiedTopology: true }, function(err, db) {
					if (err) throw err;
					var dbo = db.db("mydb");
					dbo.collection("userinfo").findOne(req.body,function(err, result) {
						if (err) throw err;
						if (result==null){
							console.log("Login failed.");
							res.send(false);
						}
						else{
							console.log("Login success!");
							req.session.user = result.id;
							req.session.is_developer = result.is_developer;
							res.send(result);
						}
						res.end();
						db.close();
					});
				});
				break;

			case '/signup':
				var req_id = req.body.id;
				var req_pw = req.body.password;
				// do something
				// console.log('client attempts to signup');
				// console.log('id: '+req_id);
				// console.log('pw: '+req_pw);

				MongoClient.connect(DB_URL, { useUnifiedTopology: true }, function(err, db) {
					if (err) throw err;
					var dbo = db.db("mydb");
					dbo.collection("userinfo").findOne({id: req_id},function(err, result) {
						if (err) throw err;
						if (result==null){
							dbo.collection("userinfo").insertOne(req.body,function(err, result) {
								if (err) throw err;
								console.log("Sign up success!");
								res.send(true);
								res.end();
								db.close();
							});

						}
						else{
							console.log("Sign up failed.");
							res.send(false);
							res.end();
							db.close();
						}
					});
				});
				break;
			case '/save':
				MongoClient.connect(DB_URL, { useUnifiedTopology: true }, function(err, db) {
					if (err) throw err;
					var dbo = db.db("mydb");
					dbo.collection("versions").insertOne(req.body,function(err, result) {
						if (err) throw err;
						if (result.result.ok){
							console.log("Save success!");
							res.send(true);
						}
						else{
							console.log("Save failed.");
							res.send(false);
						}
						res.end();
						db.close();
					});
				});
				break;
			case '/load':
				MongoClient.connect(DB_URL, { useUnifiedTopology: true }, function(err, db) {
					if (err) throw err;
					var dbo = db.db("mydb");
					dbo.collection("versions").find(req.body).toArray(function(err, result) {
						if (err) throw err;
						console.log("Load success!");
						// console.log(result);
						res.send(result);
						res.end();
						db.close();
					});
				});
				break;
			case '/upload':
				//create or overwrite files
				if (!fs.existsSync(req.body.id)){
				    fs.mkdirSync(req.body.id);
				}
				fsExtra.emptyDirSync(req.body.id);

				MongoClient.connect(DB_URL, { useUnifiedTopology: true }, function(err, db) {
					if (err) throw err;
					var dbo = db.db("mydb");
					dbo.collection("userinfo").updateOne({id:req.body.id},{$set: {html_filename: req.body.html_filename}},{upsert:true});
				});
				

				fs.writeFile(req.body.id+'/'+req.body.html_filename, req.body.html, (err) => {
					if (err) throw err;
					// console.log('html saved!');
					fs.writeFile(req.body.id+'/'+req.body.css_filename, req.body.css, (err) => {
						if (err) throw err;
						// console.log('css saved!');
						fs.writeFile(req.body.id+'/'+req.body.js_filename, req.body.js, (err) => {
							if (err) throw err;
							// console.log('js saved!');
							console.log('html, css, js saved!');
							res.send(true);
							res.end();
						});
					});
				});
				break;
			case '/add_friend':
				MongoClient.connect(DB_URL, { useUnifiedTopology: true }, function(err, db) {
					if (err) throw err;
					var dbo = db.db("mydb");
					//console.log(req.body.pc);
					dbo.collection("userinfo").findOne({id:req.body.friend_id},function(err, result) {
						if (err) throw err;
						if (result==null){
							//id does not exist
							res.send(false);
						}
						else{
							//request sent
							res.send(true);
							var query = {	host_id: req.body.host_id,
											friend_id: req.body.friend_id};
							dbo.collection("add_requests").updateOne(query,{$set: req.body},{upsert:true});
						}
					});
				});
				break;
			case '/chat_upload':
				MongoClient.connect(DB_URL, { useUnifiedTopology: true }, function(err, db) {
					if (err) throw err;
					var dbo = db.db("mydb");
					dbo.collection("chat_log").insertOne(req.body,function(err, result) {
						if (err) throw err;
						if (req.body.msg == '(exited the chatroom)'){
							dbo.collection("add_requests").deleteOne({friend_id:req.body.id});
						}
						if (result.result.ok){
							dbo.collection("chat_log").find({host_id:req.body.host_id}).toArray(function(err, result) {
								if (err) throw err;
								res.send(result);
								res.end();
							});
						}
						else{
							res.send(false);
							res.end();
						}
					});
					
				});
				break;
			case '/chat_download':
				MongoClient.connect(DB_URL, { useUnifiedTopology: true }, function(err, db) {
					if (err) throw err;
					var dbo = db.db("mydb");
					dbo.collection("chat_log").find(req.body).toArray(function(err, result) {
						if (err) throw err;
						dbo.collection("userinfo").findOne({'id':req.body.host_id},function(err2, result2) {
							if (err2) throw err2;
							if (result2!=null){
								res.send(result.concat([result2.html_filename]));
								res.end();
								db.close();
							}
						});
					});
				});
				break;
			case '/check_request':
				MongoClient.connect(DB_URL, { useUnifiedTopology: true }, function(err, db) {
					if (err) throw err;
					var dbo = db.db("mydb");

					dbo.collection("add_requests").findOne({friend_id:req.body.id},function(err, result) {
						if (err) throw err;

						if (result==null){
							//request does not exist
							res.send(false);
						}
						else{
							//request exists
							res.send(result);
						}
					});
				});
				break;
			case '/clear_chat':
				MongoClient.connect(DB_URL, { useUnifiedTopology: true }, function(err, db) {
					if (err) throw err;
					var dbo = db.db("mydb");
					dbo.collection("chat_log").deleteMany({host_id:req.body.host_id});
				});
				break;
		}
	}
});

//start server: listen to port 3000!
https.createServer({
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
    passphrase: 'asdfasdf'
},app).listen(process.env.port || 3000);

console.log('Running at Port 3000');
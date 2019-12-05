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
const multer = require('multer');

//include JS folder
app.use(express.static(__dirname));
app.use(express.static(__dirname + '/js'));
app.use(express.static(__dirname + '/css'));
app.use(express.static(__dirname + '/sample'));

//use json
app.use(bodyParser.json({limit: '100mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true})); 

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

// -- ROUTER START --

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
	if (req.session.user && req.cookies.user_sid) {
		if (req.session.is_developer=='true'){
			res.sendFile(path.join(__dirname+'/developer.html'));
		}
		else{
			res.sendFile(path.join(__dirname+'/designer.html'));
		}
	} else {
		next();
	}    
};

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
// -- ROUTER END --


// -- FILE UPLOAD START --
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
 
var upload = multer({ storage: storage });

app.post('/upload_file', upload.single('myFile'), function (req, res, next) {
	//find file with filename and move file to host_id's folder
	fsExtra.move('./uploads/'+req.file.originalname, './'+req.body.host_id+'/files/'+req.file.originalname, function (err) {
		if (err) return console.error(err);
		res.send(true);
		res.end();
	});
	
});
// -- FILE UPLOAD END --

// -- FILE DOWNLOAD START --
app.get('/download_file', function (req, res) {
	res.download(__dirname+'/'+req.query.host_id+'/files/'+req.query.filename);
});
// -- FILE DOWNLOAD END --

// -- AJAX (POST) HANDLER START --
MongoClient.connect(DB_URL, { useUnifiedTopology: true }, function(err, db) {
	if (err) throw err;
	var dbo = db.db("mydb");

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
					});
					break;

				case '/signup':
					var req_id = req.body.id;
					var req_pw = req.body.password;
					var req_body = req.body;
					if (req.body.is_developer=='true'){
						req_body.room = {};
					}
					// do something
					// console.log('client attempts to signup');
					// console.log('id: '+req_id);
					// console.log('pw: '+req_pw);

					dbo.collection("userinfo").findOne({id: req_id},function(err, result) {
						if (err) throw err;
						if (result==null){
							dbo.collection("userinfo").insertOne(req_body,function(err, result) {
								if (err) throw err;
								console.log("Sign up success!");
								res.send(true);
							});
							res.end();

						}
						else{
							console.log("Sign up failed.");
							res.send(false);
							res.end();
						}
					});
					break;
				case '/save':
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
					});
					break;
				case '/load':
					dbo.collection("versions").find(req.body).toArray(function(err, result) {
						if (err) throw err;
						console.log("Load success!");
						// console.log(result);
						res.send(result);
						res.end();
					});
					break;
				case '/upload':
					//create or overwrite files
					if (!fs.existsSync(req.body.id)){
					    fs.mkdirSync(req.body.id);
					}
					fsExtra.emptyDirSync(req.body.id);

					dbo.collection("userinfo").updateOne({id:req.body.id},{$set: {html_filename: req.body.html_filename}},{upsert:true});

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
						res.end();
					});
					break;
				case '/chat_upload':
					dbo.collection("chat_log").insertOne(req.body,function(err, result) {
						if (err) throw err;
						if (req.body.msg == '(exited the chatroom)'){
							dbo.collection("add_requests").deleteOne({friend_id:req.body.id});
							dbo.collection("userinfo").findOne({id: req.body.host_id},function(err2,result2){
								if (err2) throw err2;
								var room_info = result2.room;
								delete room_info[req.body.id];
								dbo.collection("userinfo").updateOne({id: req.body.host_id},{$set: {room: room_info}},{upsert:true});
							});
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
					break;
				case '/chat_download':
					dbo.collection("chat_log").find(req.body).toArray(function(err, result) {
						if (err) throw err;
						dbo.collection("userinfo").findOne({id:req.body.host_id},function(err2, result2) {
							if (err2) throw err2;
							if (result2!=null){
								res.send(result.concat([result2.html_filename]).concat([result2.room]).concat([{host_mic:result2.host_mic,host_speaker:result2.host_speaker}]));
								res.end();
							}
						});
					});
					break;
				case '/check_request':
					dbo.collection("add_requests").findOne({friend_id:req.body.id},function(err, result) {
						if (err) throw err;

						if (result==null){
							//request does not exist
							res.send(false);
						}
						else{
							//request exists
							dbo.collection("userinfo").findOne({id:result.host_id},function(err, result2) {
								if (err) throw err;
								var room_info = result2.room;
								room_info[req.body.id] = {member_mic: false, member_speaker: false};
								dbo.collection("userinfo").updateOne({id: result.host_id},{$set: {room: room_info}},{upsert:true});
							});
							res.send(result);
						}
						res.end();
					});
					break;
				case '/clear_chat':
					dbo.collection("chat_log").deleteMany({host_id:req.body.host_id});
					res.end();
					break;
				case '/load_files':
					var dir_path = './'+req.body.host_id+'/files';
					if (!fs.existsSync(dir_path)){
					    fs.mkdirSync(dir_path);
					}
					var files_list = fs.readdir(dir_path,function(err,result){
						if (err) throw err;
						res.send(result);
						res.end();
					});
					break;
				case '/delete_file':
					fs.unlink(__dirname+'/'+req.body.host_id+'/files/'+req.body.filename,function(err,result){
						if (err) throw err;
						res.send(true);
						res.end();
					});
					break;
				case '/set_status':
					if(req.body.is_developer=='true'){
						dbo.collection("userinfo").updateOne({id: req.body.host_id},{$set: {host_mic: req.body.host_mic, host_speaker: req.body.host_speaker}},{upsert:true});
					}
					else{
						dbo.collection("userinfo").findOne({id:req.body.host_id},function(err, result) {
							if (err) throw err;
							if(req.body.member_id != undefined){
								var room_info = result.room;
								room_info[req.body.member_id] = {member_mic: req.body.member_mic, member_speaker: req.body.member_speaker};
								dbo.collection("userinfo").updateOne({id: req.body.host_id},{$set: {room: room_info}},{upsert:true});
							}
						});
					}
					res.end();
					break;
			}
		}
	});
});
// -- AJAX (POST) HANDLER END --


// -- INITIALIZE SERVER START --
https.createServer({
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
    passphrase: 'asdfasdf'
},app).listen(process.env.port || 3000);

console.log('Running at Port 3000');
// -- INITIALIZE SERVER END --


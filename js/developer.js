var html_CodeMirror;
var css_CodeMirror;
var js_CodeMirror;

var codes;
var loadingTimer;
var peer;
var mediaStream;

function initPeerJS(){
	navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function(MS){
		mediaStream = MS;
		mediaStream.getAudioTracks()[0].enabled = false;
	});

	peer = new Peer({key: 'lwjd5qra8257b9'});
	peer.on('open', function(peer_id) {
		console.log('My peer ID is: ' + peer_id);
		sessionStorage.setItem('peer_id',peer_id);
	});
	peer.on('call', function(call) {
		console.log('answered!');
		call.answer(mediaStream);
		
		call.on('stream', function(stream) {
			video = $('#localVideo')[0];
			video.srcObject = stream;
		});
	});
	
}

function load_codes(){
	var id_info = {id: sessionStorage.getItem('id')};
	// console.log(id_info);
	//bring all versions
	$.ajax({
		type: 'post',
		url: '/load',
		data: id_info,
		success: function (result) {
			if (result){
				console.log("load success!");
				g_codes = result;
				$('#versions').html('');
				result.forEach(function(e){
					var a  = new Date(0);
					a.setUTCMilliseconds(e.timestamp);
					var options = {year: 'numeric', month: 'long', day: 'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit'};
					var dateString = a.toLocaleString('en-US',options);
					$('#versions').prepend('<div class="version_row"><div class="timestamp" timestamp="'+e.timestamp+'">'+dateString+'</div></div>')
					// console.log(a);
				});

				//pick most recent (top) version
				$('.timestamp').first().addClass('selected');

				$('.timestamp').on('click',function(){
					$('.timestamp').removeClass('selected');
					$(this).addClass('selected');
					display_one();
				});

				//display
				display_one();
			}
			else{
				console.log("load fail.");
			}
		}
	});
}

function load_files(){
	$.ajax({
		type: 'post',
		url: '/load_files',
		data: {host_id: sessionStorage.getItem('id')},
		success: function (result) {
			if (result){
				console.log("files load success!");
				$('.file_row').remove();
				result.forEach(function(e){
					if (e.charAt(0)!='.'){
						$('#files_section').prepend('<div class="file_row"><div class="delete_file_btn">X</div><div class="filename_div">'+e+'</div></div>')
					}
				});

				$('.filename_div').on('click',function(){
					window.open('/download_file?host_id='+sessionStorage.getItem('id')+'&filename='+$(this).html());
				});
				$('.delete_file_btn').on('click',function(){
					$.ajax({
						type: 'post',
						url: '/delete_file',
						data: {	host_id: sessionStorage.getItem('id'),
								filename: $(this).parent().find('.filename_div').html()},
						success: function (result) {
							load_files();
						}
					});
				});
			}
			else{
				console.log("load fail.");
			}
		}
	});
}

function display_one(){
	var timestamp = $('.timestamp.selected').attr('timestamp');
	
	let one  = g_codes.find(e => e.timestamp === timestamp);
	$('#filename_html').text(one.html_filename);
	$('#filename_css').text(one.css_filename);
	$('#filename_js').text(one.js_filename);
	html_CodeMirror.setValue(one.html);
	css_CodeMirror.setValue(one.css);
	js_CodeMirror.setValue(one.js);

}

function save_codes(){
	var codes =	{	html_filename: $('#filename_html').text(),
					css_filename: $('#filename_css').text(),
					js_filename: $('#filename_js').text(),
					html: html_CodeMirror.getValue(),
					css: css_CodeMirror.getValue(),
					js: js_CodeMirror.getValue(),
					id: sessionStorage.getItem('id'),
					timestamp: Date.now()};
	$.ajax({
		type: 'post',
		url: '/save',
		data: codes,
		success: function (result) {
			if (result){
				console.log("save success!");
				load_codes();
			}
			else{
				console.log("save fail.");
			}
		}
	});

}

function chat_upload(chat_msg){
	$.ajax({
		type: 'post',
		url: '/chat_upload',
		data: {	msg: chat_msg, 
				timestamp: Date.now(),
				id: sessionStorage.getItem('id'),
				host_id: sessionStorage.getItem('id')},
		success: function (result) {
			if (result){
				load_chat(result);
			}
			else{
				console.log("upload fail.");
			}
		}
	});
}

function init_animation(){
	$.fn.extend({
		animateCss: function(animationName, callback) {
			var animationEnd = (function(el) {
				var animations = {
					animation: 'animationend',
					OAnimation: 'oAnimationEnd',
					MozAnimation: 'mozAnimationEnd',
					WebkitAnimation: 'webkitAnimationEnd',
				};
				for (var t in animations) {
					if (el.style[t] !== undefined) {
				  		return animations[t];
					}
				}
			})(document.createElement('div'));
			this.addClass('animated ' + animationName).one(animationEnd, function() {
				$(this).removeClass('animated ' + animationName);

				if (typeof callback === 'function') callback();
			});
			return this;
		},
	});
}

window.onresize = function(event) {
	var left = $('#load_btn').offset().left + $('#load_btn').outerWidth()/2 - $('#versions').outerWidth()/2;
	$('#versions').css('left',left);

	$('.waiting').css('padding-top',window.innerHeight/2);
};

$(document).ready(function(){

	init_animation();

	var settings = {	lineWrapping: true,
						tabSize: 2,
						lineNumbers: true };

	var html_settings = JSON.parse(JSON.stringify(settings));
	html_settings.mode = 'xml';
    html_settings.htmlMode = true;

	var css_settings = JSON.parse(JSON.stringify(settings));
	css_settings.mode = 'css';

	var js_settings = JSON.parse(JSON.stringify(settings));
	js_settings.mode = 'javascript';

	html_CodeMirror = CodeMirror(document.getElementById('html'),html_settings);
	css_CodeMirror = CodeMirror(document.getElementById('css'),css_settings);
	js_CodeMirror = CodeMirror(document.getElementById('js'),js_settings);
	
	coding_resize();

	init_buttons();
	
	load_codes();
	
	$('.filename').on('click',function(){
		var filename = $(this).text().split(".")[0];
		var filetype = $(this).text().split(".")[1];
		$(this).text(filename);
		var width = $(this).outerWidth();
		$(this).text('.'+filetype);
		$(this).before('<input type="text" class="namechange_input" maxlength="20"></input>');
		$(this).css('padding-left',0);
		$('.namechange_input').focus();
		$('.namechange_input').val(filename);
		$('.namechange_input').width(width-10);
		$('.namechange_input').focusout(function(){
			var new_fn = $(this).val();
			if (new_fn==''){
				new_fn = 'untitled';
			}
			$(this).parent().find('.filename').text(new_fn+'.'+$(this).parent().parent().attr('id'));
			$('.filename').css('padding-left','10px');
			$(this).remove();
		});
		$('.namechange_input').select();
		$('.namechange_input').keydown(function(e){
			if (e.which==13){
				$(this).blur();
			}
			else if (e.which==32){
				return false;
			}
		});
	});

	$('.chat_input').keydown(function(e){
		if (e.which==13 && !e.shiftKey){
			//send
			var chat_msg = $(this).val();
			if (chat_msg != ''){
				chat_upload(chat_msg);
			}
			$(this).val('');
			return false;
			// $(this).focus();
		}
	});

	readChatTimer();
	sessionStorage.setItem('host_id',sessionStorage.getItem('id'));
	sessionStorage.removeItem('chat_timestamp');

	initPeerJS();
});


function readChatTimer(){
	loadingTimer = setInterval(function(){
		$.ajax({
			type: 'post',
			url: '/chat_download',
			data: {	host_id: sessionStorage.getItem('host_id') },
			success: function (result) {
				if (result){
					var chat_results = result.slice(0,result.length-3);
					var html_filename = result.slice(result.length-3,result.length-2)[0];
					var room = result.slice(result.length-2,result.length-1)[0];
					var host_status = result.slice(result.length-1,result.length)[0];

					$('.room_info').html('');
					var host_mic = "<div class='mic_icon'>🎤</div>";
					var host_speaker = "<div class='speaker_icon'>🔈</div>";

					if(host_status.host_mic=='true'){
						host_mic = "<div class='mic_icon on'>🎤</div>";
					}
					if(host_status.host_speaker=='true'){
						host_speaker = "<div class='speaker_icon on'>🔈</div>";
					}
					var host_div = $("<div class='host_info'>"+sessionStorage.getItem('host_id')+host_mic+host_speaker+"</div>");
					$('.room_info').append(host_div);
					for (member in room){
						var mic = "<div class='mic_icon'>🎤</div>";
						var speaker = "<div class='speaker_icon'>🔈</div>";
						if(room[member]['member_mic']=='true'){
							mic = "<div class='mic_icon on'>🎤</div>";
						}
						if(room[member]['member_speaker']=='true'){
							speaker = "<div class='speaker_icon on'>🔈</div>";
						}
						var member_div = $("<div class='member_info'><div class='member_id'>"+member+"</div>"+mic+speaker+"</div>");
						$('.room_info').append(member_div);
					}

					sessionStorage.setItem('html_filename',html_filename);
					load_chat(chat_results);
				}
				else{
					console.log("chat read fail.");
				}
			}
		});

		$.ajax({
			type: 'post',
			url: '/set_status',
			data: {	is_developer: true,
					host_id: sessionStorage.getItem('host_id'),
					host_mic: $('#mic_btn').hasClass('clicked'),
					host_speaker: $('#speaker_btn').hasClass('clicked')}
		});

	},1000);
}

function load_chat(result){
	if (result.length>0){
		if (sessionStorage.getItem('chat_timestamp')==null||sessionStorage.getItem('chat_timestamp')!=result[result.length-1].timestamp){
			$('.chat_log').html('');
			result.forEach(function(e,i,array){
				var a  = new Date(0);
				a.setUTCMilliseconds(e.timestamp);
				var options = {hour:'2-digit', minute:'2-digit'};
				var dateString = a.toLocaleString('en-US',options);
				$('.chat_log').append('<div class="single_chat"><div class="ID">'+e.id+'</div><div class="time_stamp">'+dateString+'</div><div class="msg">'+e.msg+'</div></div>');
				$(".chat_log").scrollTop($(".chat_log")[0].scrollHeight);
			});
			sessionStorage.setItem('chat_timestamp',result[result.length-1].timestamp);
		}
	}
	else{
		$('.chat_log').html('');
	}
}

function coding_resize(){
	$('.iframe').css('width',1280);
	var b = [0,1260,625,413.3];
	if ($('.chatting').css('display')=='block'){
		$('.iframe').css('width',1080);
		b = [0,1060,525,346.3];
	}

	$('.code').css('width',b[$('.checkbox.clicked').size()]);
	html_CodeMirror.setSize(b[$('.checkbox.clicked').size()], 600);
	css_CodeMirror.setSize(b[$('.checkbox.clicked').size()], 600);
	js_CodeMirror.setSize(b[$('.checkbox.clicked').size()], 600);
	$('.code').css('display','none');
	if($('#html_checkbox').hasClass('clicked')){
		$('#html.code').css('display','inline-block');
	}
	if($('#css_checkbox').hasClass('clicked')){
		$('#css.code').css('display','inline-block');
	}
	if($('#js_checkbox').hasClass('clicked')){
		$('#js.code').css('display','inline-block');
	}
}

function init_buttons(){
	$('#save_btn').on('click',function(){
		if(!$('#save_btn').hasClass('saving')){
			$('#save_btn').addClass('saving');
			console.log('saving');
			save_codes();
			setTimeout(function(){
				$('#save_btn').removeClass('saving');
			}, 1000);
		}
	});

	//place versions pop-up centered below the load button
	var left = $('#load_btn').offset().left + $('#load_btn').outerWidth()/2 - $('#versions').outerWidth()/2;
	$('#versions').css('left',left);
	$('#load_btn').on('click',function(){
		if ($('#file_btn').hasClass('clicked')){
			$('#file_btn').click();
		}
		if ($(this).hasClass('clicked')){
			if (!$('#versions').hasClass('animated')){
				$(this).removeClass('clicked');
				$('#versions').animateCss('slideOutUp',function(){
					$('#versions').css('display','none');
				});
			}
			
		}
		else{
			$('#versions').css('display','block');
			if (!$('#versions').hasClass('animated')){
				$(this).addClass('clicked');
				$('#versions').animateCss('slideInDown',function(){

				});
			}
		}
	});

	$('#play_btn').on('click',function(){
		if ($(this).hasClass('clicked') && !$('.iframe').hasClass('animated')){
			$(this).removeClass('clicked');
			$('.iframe').animateCss('slideOutUp',function(){
				//hide iframe
				$('.iframe').css('display','none');
			});
			
		}
		else{
			if (!$('.iframe').hasClass('animated')){

				$(this).addClass('clicked');

				//upload codes
				var codes =	{	id: sessionStorage.getItem('id'),
								html_filename: $('#filename_html').text(),
								css_filename: $('#filename_css').text(),
								js_filename: $('#filename_js').text(),
								html: html_CodeMirror.getValue(),
								css: css_CodeMirror.getValue(),
								js: js_CodeMirror.getValue()};
				console.log(codes);
				$.ajax({
					type: 'post',
					url: '/upload',
					data: codes,
					success: function (result) {
						if (result){
							console.log("upload success!");
							//show iframe
							$('.iframe').css('display','block');
							$('#iframeid').attr('src',sessionStorage.getItem('id')+'/'+$('#filename_html').text());
							$('.iframe').animateCss('slideInDown',function(){});
						}
						else{
							console.log("upload fail.");
						}
					}
				});

				//reload iframe
				document.getElementById('iframeid').src += '';
			}
			
		}
	});

	$('.checkbox').on('click',function(){
		if($('.checkbox.clicked').size()>1 || !$(this).hasClass('clicked')){
			$(this).toggleClass('clicked');
			coding_resize();
			
		}
	});

	$('#chat_btn').on('click',function(){
		$(this).toggleClass('clicked');
		if ($(this).hasClass('clicked')){
			$('.chatting').css('display','block');
		}
		else{
			$('.chatting').css('display','none');
		}
		coding_resize();
	});

	$('#add_friend_btn').on('click',function(){
		$(this).addClass('clicked');
		$(this).after('<input type="text" class="add_friend_input" maxlength="20"></input>');
		$('.message').remove();
		$('.add_friend_input').focus();
		$('.add_friend_input').focusout(async function(){
			var friend_id = $(this).val();
			if (friend_id==sessionStorage.getItem('id')){
				$(this).after('<div style="color:red" class="message">(Unable to add yourself)</div>');
				setTimeout(function(){
					$('.message').remove();
				},2000);
				$(this).remove();
			}
			else if (friend_id!=''){
				$.ajax({
					type: 'post',
					url: '/add_friend',
					data: {	host_id: sessionStorage.getItem('id'),
							friend_id: friend_id,
							peer_id: sessionStorage.getItem('peer_id')},
					success: function (result) {
						if (result){
							$('.add_friend_input').after('<div style="color:white" class="message">(Invitation sent)</div>');
						}
						else{
							$('.add_friend_input').after('<div style="color:red" class="message">(ID does not exist)</div>');
						}
						setTimeout(function(){
							$('.message').remove();
						},2000);
						$('.add_friend_input').remove();
					}
				});
			}
			else{
				$(this).remove();
				$('#add_friend_btn').removeClass('clicked');
			}
		});
		$('.add_friend_input').keydown(function(e){
			if (e.which==13){
				$('#add_friend_btn').removeClass('clicked');
				$(this).blur();
			}
			else if (e.which==32){
				return false;
			}
		});
	});

	$('#clear_btn').on('click',function(){
		$('.chat_log').html('');
		$.ajax({
			type: 'post',
			url: '/clear_chat',
			data: {	host_id: sessionStorage.getItem('id')}
		});
	});

	$('#file_input').change(function(e){
		$('#host_id_input').val(sessionStorage.getItem('id'));

		var form = $('#file_form')[0];
        var formData = new FormData(form);

		$.ajax({
	        url:'/upload_file',
	        processData: false,
            contentType: false,
	        type:'post',
	        data:formData,
	        enctype:'multipart/form-data',
	        success: function(result){
	        	load_files();
	        }
	    });
	    $(this).val('');
	});

	$('#upload_btn').on('click',function(){
		$('#file_input').click();
	});
	$('#mic_btn').on('click',function(){
		$(this).toggleClass('clicked');
		mediaStream.getAudioTracks()[0].enabled = $(this).hasClass('clicked');
	});
	$('#speaker_btn').on('click',function(){
		$(this).toggleClass('clicked');
		if($(this).hasClass('clicked')){
			$('#localVideo')[0].play();
		}
		else{
			$('#localVideo')[0].pause();
		}
	});
	$('#file_btn').on('click',function(){
		if ($('#load_btn').hasClass('clicked')){
			$('#load_btn').click();
		}
		if (!$('#files_div').hasClass('animated')){
			$(this).toggleClass('clicked');
			if ($(this).hasClass('clicked')){
				load_files();
				$('#files_div').css('display','block');
				$('#files_div').animateCss('slideInRight',function(){
				});
			}
			else{
				$('#files_div').css('display','block');
				$('#files_div').animateCss('slideOutRight',function(){
					$('#files_div').css('display','none');
				});
			}
		}
	});

	$('#logout_btn').on('click',function(){
		sessionStorage.removeItem('id');
		window.location.href = window.location.href.replace(window.location.pathname,'')+'/logout';
	});

}


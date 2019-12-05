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
}

function call(){
	console.log(mediaStream);
	console.log(sessionStorage.getItem('host_peer_id'),sessionStorage.getItem('peer_id'));
	var call = peer.call(sessionStorage.getItem('host_peer_id'),mediaStream);
	call.on('stream', function(stream) {
		video = $('#remoteVideo')[0];
		video.srcObject = stream;
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

function refresh_iframe(){
	$('#iframeid').attr('src',sessionStorage.getItem('host_id')+'/'+sessionStorage.getItem('html_filename'));
}

function wait_for_request(){
	var i = 0;
	loadingTimer = setInterval(function(){
		var load_string = "■ ".repeat(i);
		$('.waiting').html("Waiting for developer to connect...<br>"+load_string);
		i++;
		i=i%4;
		$.ajax({
			type: 'post',
			url: '/check_request',
			data: {	id: sessionStorage.getItem('id') },
			success: function (result) {
				if (result){
					clearInterval(loadingTimer);
					console.log("chat join success.");
					console.log(result);
					sessionStorage.setItem('host_id',result.host_id);
					chat_upload('(joined the chatroom)');
					$('.waiting').css('display','none');
					$('.chatting').css('display','block');
					$('.iframe').css('display','block');
					$('#chat_btn').addClass('clicked');

					sessionStorage.setItem('host_peer_id',result.peer_id);

					readChatTimer();

					call();
				}
				else{
					console.log("chat join fail.");
				}
			}
		});
	},1000);
}

function readChatTimer(){
	loadingTimer = setInterval(function(){
		if ($('#reload_btn').hasClass('clicked')){
			refresh_iframe();
		}

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
			data: {	is_developer: false,
					host_id: sessionStorage.getItem('host_id'),
					member_id: sessionStorage.getItem('id'),
					member_mic: $('#mic_btn').hasClass('clicked'),
					member_speaker: $('#speaker_btn').hasClass('clicked')}
		});

	},1000);
}

function load_chat(result){
	if (result.length>0){
		if (sessionStorage.getItem('chat_timestamp')==null || sessionStorage.getItem('chat_timestamp')!=result[result.length-1].timestamp){
			$('.chat_log_designer').html('');
			result.forEach(function(e,i,array){
				var a  = new Date(0);
				a.setUTCMilliseconds(e.timestamp);
				var options = {hour:'2-digit', minute:'2-digit'};
				var dateString = a.toLocaleString('en-US',options);
				$('.chat_log_designer').append('<div class="single_chat"><div class="ID">'+e.id+'</div><div class="time_stamp">'+dateString+'</div><div class="msg">'+e.msg+'</div></div>');
				$(".chat_log_designer").scrollTop($(".chat_log_designer")[0].scrollHeight);
			});
			sessionStorage.setItem('chat_timestamp',result[result.length-1].timestamp);
		}
	}
	else{
		$('.chat_log_designer').html('');
	}
}

function chat_upload(chat_msg){
	$.ajax({
		type: 'post',
		url: '/chat_upload',
		data: {	msg: chat_msg, 
				timestamp: Date.now(),
				id: sessionStorage.getItem('id'),
				host_id: sessionStorage.getItem('host_id')},
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


function load_files(){
	$.ajax({
		type: 'post',
		url: '/load_files',
		data: {host_id: sessionStorage.getItem('host_id')},
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
					window.open('/download_file?host_id='+sessionStorage.getItem('host_id')+'&filename='+$(this).html());
				});
				$('.delete_file_btn').on('click',function(){
					$.ajax({
						type: 'post',
						url: '/delete_file',
						data: {	host_id: sessionStorage.getItem('host_id'),
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

$(document).ready(function(){
	$('.waiting').html("Waiting for developer to connect...<br>");
	$('.waiting').css('padding-top',$(window).height()/2);
	$('.iframe').css('display','none');
	$('.iframe').css('width',1080);
	$('.code').css('display','none');
	$('.chatting').css('display','none');

	sessionStorage.removeItem('chat_timestamp');

	wait_for_request();

	init_animation();

	init_buttons();

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

	initPeerJS();
});


function init_buttons(){
	
	$('#mic_btn').on('click',function(){
		$(this).toggleClass('clicked');
		mediaStream.getAudioTracks()[0].enabled = $(this).hasClass('clicked');
	});

	$('#speaker_btn').on('click',function(){
		$(this).toggleClass('clicked');
		if($(this).hasClass('clicked')){
			$('#remoteVideo')[0].play();
		}
		else{
			$('#remoteVideo')[0].pause();
		}
	});

	$('#reload_btn').on('click',function(){
		$(this).toggleClass('clicked');
	});

	$('#logout_btn').on('click',function(){
		chat_upload('(exited the chatroom)');
		window.location.href = window.location.href.replace(window.location.pathname,'')+'/logout';
	});

	$('#exit_btn').on('click',function(){
		chat_upload('(exited the chatroom)');
		clearInterval(loadingTimer);
		sessionStorage.removeItem('chat_timestamp');
		sessionStorage.removeItem('host_id');
		$('.waiting').css('display','block');
		$('.iframe').css('display','none');
		$('.chatting').css('display','none');
		$('#chat_btn').removeClass('clicked');
		wait_for_request();
	});

	$('#file_btn').on('click',function(){

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

	$('#upload_btn').on('click',function(){
		$('#file_input').click();
	});

	$('#file_input').change(function(e){
		$('#host_id_input').val(sessionStorage.getItem('host_id'));

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
}
var html_CodeMirror;
var css_CodeMirror;
var js_CodeMirror;

var codes;

function post_link(){
	var link = $($('.togetherjs-share-link')[0]).val();
	return link;
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
				codes = result;
				$('#versions').html('');
				result.forEach(function(e){
					var a  = new Date(0);
					a.setUTCMilliseconds(e.timestamp);
					var options = {year: 'numeric', month: 'long', day: 'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit'};
					dateString = a.toLocaleString('en-US',options);
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

function display_one(){
	var timestamp = $('.timestamp.selected').attr('timestamp');
	
	let one  = codes.find(e => e.timestamp === timestamp);
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
	
	init_buttons();
	
	load_codes();
	// TogetherJS(this);
	//$('#togetherjs-share').css('display','none');


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

});

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
		if ($(this).hasClass('clicked')){
			$(this).removeClass('clicked');
			if (!$('.iframe').hasClass('animated')){
				$('.iframe').animateCss('slideOutUp',function(){
					//hide iframe
					$('.iframe').css('display','none');
				});
			}
			
		}
		else{
			$(this).addClass('clicked');

			//upload codes
			var codes =	{	html_filename: $('#filename_html').text(),
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
						if (!$('.iframe').hasClass('animated')){
							$('.iframe').animateCss('slideInDown',function(){
								
							});
						}
					}
					else{
						console.log("upload fail.");
					}
				}
			});

			//reload iframe
			document.getElementById('iframeid').src += '';
			
		}
	});

	$('#logout_btn').on('click',function(){
		sessionStorage.removeItem('id');
		window.location.href = window.location.href.replace(window.location.pathname,'')+'/logout';
	});

}
$(document).ready(function(){
	// Extend jQuery for animation calls
	init_animation();

	// Initialize tab switching, login/signup btns
	init_interface();
});

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

function init_interface(){
	
	// Button press for tab/mode switch
	$('.switch_tab').on('click', function(){
		$('.switch_tab').removeClass("selected");
		$(this).addClass("selected");
		if($(this).is('#a0')){
			$('#signup_tab').css("display","none");
			$('#login_tab').css("display","block");
		}
		else{
			$('#login_tab').css("display","none");
			$('#signup_tab').css("display","block");
		}
	});

	// Button press for login/signup
	$('.login_page_button#login').on('click',function(){
		validateLogin();
	});
	$('.login_page_button#signup').on('click',function(){
		validateSignup();
	});

	$('.developer_checkbox').on('click',function(){
		$(this).toggleClass('clicked');
	});

	// Enter key for login/signup
	$('.login_page_input').keypress(function(event){
		if (event.which==13){
			validateLogin();
		}
	});
	
}

function setMessage(a, success=false){
	
	if ($('.show_message').css('display')!='block'){
		$('.show_message').html(a);
		$('.show_message').css('display','block');

		if (success){
			$('.show_message').css('color','#6EC181');
		}
		else{
			$('.show_message').css('color','#F25F5C');
		}
		setTimeout(function(){
			if (!$('.show_message').hasClass('animated')){
				$('.show_message').animateCss('fadeOut',function(){
					$('.show_message').css('display','none');
					if (success){
						sessionStorage.setItem('id',success.id);
						sessionStorage.setItem('is_developer',success.is_developer);
						console.log(window.location.href.replace(window.location.pathname,'')+'/'+success.next);
						window.location.href = window.location.href.replace(window.location.pathname,'')+'/'+success.next;
					}
				});
			}
		}, 1000);
	}
}

function validateLogin(){
	var ID = $('#login_id').val();
	var PW = $('#login_pw').val();

	if(ID.length<1){
		setMessage('Please enter your ID.');
	}
	else if(PW.length<1){
		setMessage('Please enter your password.');
	}
	else{
		$.ajax({
			type: 'post',
			url: '/login',
			data: {'id' : ID, 'password' : PW},
			success: function (result) {
				if (result){
					console.log("login success");
					setMessage("Login success!",{id:ID,is_developer:result.is_developer,next:"index"});
				}
				else{
					console.log("login fail");
					setMessage("Login failed.");
				}
			}
		});
	}
}

function validateSignup(){
	var ID = $('#signup_id').val();
	var PW = $('#signup_pw').val();
	var is_developer = $('.developer_checkbox').hasClass('clicked');

	if(ID.length<5){
		setMessage('Please enter an ID (at least 5 characters).');
	}
	else if(PW.length<8){
		setMessage('Please enter a password (at least 8 characters).');
	}
	else{
		$.ajax({
			type: 'post',
			url: '/signup',
			data: {'id' : ID, 'password' : PW, 'is_developer': is_developer},
			success: function (result) {
				if (result){
					console.log("signup success");
					setMessage("Signup success!",{id:ID,next:"index"});
				}
				else{
					console.log("signup fail");
					setMessage("ID already exists.");
				}
			}
		});
	}
}

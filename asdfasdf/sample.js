var angle = 0;
var clockwise = true;
var i=0;
var j=0;

$(document).ready(function(){
  
  $('#mario1').attr('src','https://i.ibb.co/SRQct6N/mario1.png');
  $('#mario2').attr('src','https://i.ibb.co/MGd5djn/mario2.png');
  $('#mario3').attr('src','https://i.ibb.co/fq4ycxB/mario3.png');
  $('#mario4').attr('src','https://i.ibb.co/1JDTg2K/mario4.png');

  setInterval(function(){
    if (j%10==0){
      $('.mario').css('display','none');
      $('#mario'+(i%4+1)).css('display','block');
      i++;
    }
    j++;
    $('.mario_container').css('left',j*2%1300-100);
  },20);
  
  $('.mario').css('transform','scale(3.0)');
  
  setInterval(function(){
    $('.h1').css('transform','scale('+(1+Math.abs(angle/50))+') rotate(' + angle + 'deg)');
    if (angle<-5){
      clockwise = true;
    }
    else if (angle>5){
    	clockwise = false; 
    }
    if (clockwise){
    	angle+=0.4;
    }
    else{
    	angle-=0.4;
    }
    
  },20);
  
  
});
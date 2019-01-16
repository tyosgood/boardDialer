var count = 0;
var num
var dialstring = "";
var socket = io();
var callID, callObj;


function reset(){
 $('.dialing').hide();
 $('.connected').hide();
 $('.inCallBotrow').hide();
 $('#dialer').show();
 $('.numbertodial').remove();
 $('.digit').removeClass('dtmf');
 $('#output').show();
 $('.botrow').show();
 $('#mute').css('background-color','');
 dialstring = "";
 count=0;
}



$(".digit").on('click', function() {
  num = ($(this).clone().children().remove().end().text());
  console.log(num + " pressed");
  if (count < 15) {
    $("#output").append('<span class="numbertodial">' + num.trim() + '</span>');
    dialstring += num.trim();
    count++
  }
});

//have to bind the click listener to the row class since the .digit.dtmf class doesn't exist at launch
$(".row").on('click', ".digit.dtmf", function() {
  console.log('dtmf pressed');
  var digit = ($(this).clone().children().remove().end().text());
  socket.emit('dtmf', 
    {
      digit: digit.trim(),
      callID: callID
    });
});


$('.fa-long-arrow-left').on('click', function() {
  $('#output span:last-child').remove();
  count--;
  dialstring = dialstring.slice(0, -1);
});


$('#disconnect').on('click', function() {
  socket.emit('hangup', callID);

});

$('#numberPad').on('click', function() {
      $('.connected').hide();
      $('#callBottomRow').hide();
      $('#output').hide();
      $('.botrow').hide();
      //this adds the dtfm class to the digit class so we can emit the dtmf digits one at a time
      $('.digit').toggleClass('dtmf');
      $('#dtmfBottomRow').show();
      $('#dialer').show();
});

$('#back').on('click', function() {
      $('.connected').show();
      $('#callBottomRow').show();
      $('#output').show();
      $('.botrow').show();
      //this adds the dtfm class to the digit class so we can emit the dtmf digits one at a time
      $('.digit').toggleClass('dtmf');
      $('#dtmfBottomRow').hide();
      $('#dialer').hide();
});


$('#mute').on('click', function() {
  socket.emit('mute', callID);

});



//new way using ajax

$('#call').on('click', function() {
 console.log(dialstring);
 
 $.post( "/dial", { dialString: dialstring + "@cisco.com"  })
  console.log("dialing " + dialstring);
  //$('.numbertodial').remove();
  //dialstring ="";
  //count=0;
  });


socket.on('newCall', function(call){
  console.log('New call', call);

//Catches remote hangups and failed call attempts
 if (call.ghost){
    console.log(`Ghost call: ${call.id}`);
    reset();
  }


  switch (call.Status) {
                case "Ringing":
                   
                    return;

                case "Connected":
                    console.log(`Connected call: ${call.id} to ${call.DisplayName} `);
                    callID = call.id;
                    $('.dialingNumber').text(`Connected to: ${call.DisplayName}`);
                    $('#dialer').hide();
                    $('.dialing').hide();
                    $('.connected').css('display','flex');
                    //$('.inCallBotrow').css('display','flex');
                    $('#callBottomRow').css('display', 'flex');
                    return;
                
                case "Disconnecting":
                    console.log(`Disconnecting call: ${call.id}`);
                    reset();
                    return;
                    

                case "Idle":
                    console.log(`Idle call: ${call.id}`);
                     reset();
                    return;

                case "Dialling":
                    $('#dialer').hide();
                    $('.dialingNumber').text('Dialling: ' + dialstring);
                    $('.dialing').css('display','flex');
                    return;

                default:
                    //console.log("DEBUG: ignoring event");
                    return;
            }

 

});

socket.on('muteStatus', function(muteStatus){
  console.log('MuteStatus', muteStatus);
  if (muteStatus == 'On'){
    $('#mute').css('background-color','red')
  }
  else {$('#mute').css('background-color', '');}
});
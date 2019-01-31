var count = 0;
var num;
var dialstring = "";
var socket = io();
var callID, callDisplayName;

//this is the popup for incoming calls
var modal = new tingle.modal({
    footer: true,
    stickyFooter: false,
    closeMethods: ['escape'],
    closeLabel: "Close",
    cssClass: ['dialog'],
    onOpen: function() {
        console.log('modal open');
    },
    onClose: function() {
        console.log('modal closed');
    }  
});
// add answer button
modal.addFooterBtn('Answer', 'tingle-btn tingle-btn--primary', function() {
    //tell codec to answer
    socket.emit('answer', callID );
    modal.close();
});
// add decline button
modal.addFooterBtn('Decline', 'tingle-btn tingle-btn--danger', function() {
    // tell the codec to decline
    socket.emit('decline', callID );
    modal.close();
});


//function to set dialer back to initial state
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


//logic to handle digit clicks and add them to the number to be dialed
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

//disconnect connected call
$('#disconnect').on('click', function() {
  socket.emit('hangup', callID);
});

//cancel while dialing
$('#cancel').on('click', function() {
  socket.emit('hangup', callID);
});

//display numberpad while in call - to send DTMFs
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

//hide dtmf numberpad
$('#back').on('click', function() {
      $('.connected').show();
      $('#callBottomRow').show();
      $('#output').show();
      $('.botrow').show();
      //this removes the dtfm class from the digit class 
      $('.digit').toggleClass('dtmf');
      $('#dtmfBottomRow').hide();
      $('#dialer').hide();
});


//signal codec to mute when mute clicked
$('#mute').on('click', function() {
  socket.emit('mute', callID);
});



//dial the call - using ajax - could also do this via socket.io but for now this works (so I'm not messing with it)
$('#call').on('click', function() {
 console.log(dialstring);
  $.post( "/dial", { dialString: dialstring + "@cisco.com"})
  console.log("dialing " + dialstring);
});


//main logic for handling call events
socket.on('newCall', function(call){
  console.log('New call', call);
  callID = call.id;

 //Catches remote hangups and failed call attempts
 if (call.ghost){
    console.log(`Ghost call: ${call.id}`);
    if (modal.isOpen()){modal.close();}
    reset();
  }

  //switch on call status
  switch (call.Status) {
                case "Ringing":
                    // set content
                    callDisplayName = call.DisplayName;
                    modal.setContent('<h1>Incoming Call</h1><p>from ' +call.DisplayName+ ' </p>'  );
                    modal.open();
                    return;

                case "Connected":
                    console.log(`Connected call: ${call.id} to ${call.DisplayName} `);
                    $('.dialingNumber').text(`Connected to: ${callDisplayName}`);
                    $('#dialer').hide();
                    $('.dialing').hide();
                    $('.connected').css('display','flex');
                    $('#callBottomRow').css('display', 'flex');
                    if (modal.isOpen()){modal.close();}
                    return;
                
                case "Disconnecting":
                    console.log(`Disconnecting call: ${call.id}`);
                    reset();
                    return;               

                case "Dialling":
                    callDisplayName = dialstring;
                    $('#dialer').hide();
                    $('.dialingNumber').text('Dialling: ' + dialstring);
                    $('.dialing').css('display','flex');
                    return;

                default:
                    //console.log("DEBUG: ignoring event");
                    return;
            }

 

});


//listen for mute status changes and toggle color of mute button to reflect mute state
socket.on('muteStatus', function(muteStatus){
  console.log('MuteStatus', muteStatus);
  if (muteStatus == 'On'){
    $('#mute').css('background-color','red')
  }
  else {$('#mute').css('background-color', '');}
});









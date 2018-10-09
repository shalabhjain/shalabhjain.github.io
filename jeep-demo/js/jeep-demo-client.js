var content;
var input;
var status;
var tableContent;

$(function () {
    "use strict";

    // for better performance - to avoid searching in DOM
    content = $('#content');
    input = $('#input');
    status = $('#status');
    tableContent = $("#table-content");

    // $(".busCCAN").attr("onclick", "probeBus('busCCAN')");
    // $(".busBCAN").attr("onclick", "probeBus('busBCAN')");
    // $(".busLIN").attr("onclick", "probeBus('busLIN')");

    $(".busCCAN").on("click", function(e){
      e.preventDefault();
      probeBus('busCCAN');
      console.log("Probing CCAN bus");
    });

    $(".busBCAN").on("click", function(e){
      e.preventDefault();
      probeBus('busBCAN');
      console.log("Probing BCAN bus");
    });

    $(".busLIN").on("click", function(e){
      e.preventDefault();
      probeBus('busLIN');
      console.log("Probing LIN bus");
    });

    $(".keypad_digit").on("click", function(e){
      e.preventDefault();
      processKeypadNum($(this).attr('id'));
      //alert("The digit is "  + $(this).attr('id'));
    });

  //alert("height is " + abc);
  //  $("#jeep-container").height($(window).height());
   //$("#jeep-container").attr("background-color", "blue");
   //$(window).height());
   initCCANMessageArray();
   initBCANMessageArray();
   initLINMessageArray();
});

/**
 * Add message to the chat window
 */
// function addMessage(dt, canID, mesg) {
//     content.prepend('<p>' + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
//          + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes()) +
//          + (dt.() < 10 ? '0' + dt.getMinutes() : dt.getMinutes()) +
//
//          + ': ' + message + '</p>');
// }

function addMessage(dt, canID, mesg) {
    //content.prepend('<p>' + dt + ' ' + canID + ' ' + mesg + '</p>');
    tableContent.prepend("<tr><td>" + dt/1000 + "</td><td>" + canID + "</td><td>" + mesg + "</td></tr>")
}

function probeBus(busName) {
  //alert(busName);
  $("#content").html("");
  var oldBusName = $("#logbus").val();
  if(oldBusName != '') {
    console.log("Removing existing probe");
    closeNav();
  }

  $("#sidelogwin").width("400px");
  //$("sidelogwin").style.visible = "400px"
  $("#logbus").val(busName);

  switch(busName) {
    case 'busCCAN':
      addCCANprobe();
      break;
    case 'busBCAN':
      addBCANprobe();
      break;
    case 'busLIN':
      addLINprobe();
      break;
    default:
      console.log("Bus: " + busName + " not found");
  }
  //connection.send(JSON.stringify( { type: 'probeon', data: busName} ));
  //document.getElementById("mySidenav").style.width = "400px";
  //$("#jeep-container").width($(window).width()-400);
}

// add check for busName not being null
function closeNav() {
  var busName = $("#logbus").val();
  console.log('Removing probe for ' + busName)
  $("#sidelogwin").width(0);
  $("#content").html("");
  $("#logbus").val('');

  switch(busName) {
    case 'busCCAN':
      removeCCANprobe();
      break;
    case 'busBCAN':
      removeBCANprobe();
      break;
    case 'busLIN':
      removeLINprobe();
      break;
    default:
      console.log("Bus: " + busName + " not found");
  }
  //connection.send(JSON.stringify( { type: 'probeoff', data: busName} ));
}

var digitNum = 1;
var code = '';
var unlockCode = '3212';
function processKeypadNum(val) {
  $("#disp-dig-"+digitNum).html(val);
  code = code + val;
  if(++digitNum > 4) {
//    alert("Input 4 digits: " + code);
    //connection.send(JSON.stringify( { type: 'code', data: code} ));
    sendCodeChallenge(code);
    verifyCode(code,0);
    for(var j = 1; j <= 4; j++) {
          $("#disp-dig-" + j).html("=");
    }
    code = '';
    digitNum = 1;
  }
}

function verifyCode(code, pos) {
  console.log('verify: ' + code + ' ' + pos + ' ' + performance.now());
  if(code[pos] == unlockCode[pos]) {
    pos++;
    if(pos >= code.length) {
      sendCodeResponse('1');
    } else {
      setTimeout(function() {
        verifyCode(code, pos)
      }, 2000);
    }
  } else {
    sendCodeResponse('0');
  }
}

function sendCodeChallenge(code) {
  if($("#logbus").val() != 'busBCAN') {
    return;
  }
  busBCANContents.push([
      performance.now(),
      '0x100',
      code.split('').map(i => '0' + i).join(' ')
  ]);
}

function sendCodeResponse(resp) {
  if(resp == '1') {
    $("#disp-dig-status").css("background-color", "rgba(0,200,0,0.75)")
  } else {
    $("#disp-dig-status").css("background-color", "rgba(200,0,0,0.75)")
  }

  if($("#logbus").val() != 'busBCAN') {
    return;
  }
  busBCANContents.push([
      performance.now(),
      '0x200',
      '0' + resp
  ]);
}

//////////////////////////
// CCAN message structures
//////////////////////////
var busCCANContents = [ ];
var busCCANmesgs = [ ];
var busCCANinterval = [ ];
// Add all messages
function initCCANMessageArray() {
  busCCANmesgs.push([
    function () {
      busCCANContents.push([
          performance.now(),
          '0x12c',
          Math.random().toString(16).slice(-6).match(/.{2}/g).join(' ')
      ]);
    }, 2000
  ]);

  console.log("Added " + busCCANmesgs.length + " CCAN messages");
}

// Add all probes
function addCCANprobe() {
  for(var j = 0; j < busCCANmesgs.length; j++) {
    busCCANinterval[j] = setInterval(busCCANmesgs[j][0], busCCANmesgs[j][1]);
  }

  busCCANinterval[j] = setInterval(function() {
    var mesgQLen = busCCANContents.length;
    for(var k = 0; k < mesgQLen; k++) {
        addMessage(busCCANContents[k][0], busCCANContents[k][1], busCCANContents[k][2]);
    }
    busCCANContents.splice(0, mesgQLen);
  }, 1500);
}

// Remove all probes
function removeCCANprobe() {
  for(var j = 0; j < busCCANinterval.length; j++) {
    clearInterval(busCCANinterval[j]);
  }
  busCCANinterval = [ ];
  busCCANContents = [ ];
}


//////////////////////////
// BCAN message structures
//////////////////////////
var busBCANContents = [ ];
var busBCANmesgs = [ ];
var busBCANinterval = [ ];
// Add all messages
function initBCANMessageArray() {
  busBCANmesgs.push([
    function () {
      busBCANContents.push([
          performance.now(),
          '0x02c',
          Math.random().toString(16).slice(-6).match(/.{2}/g).join(' ')
      ]);
    }, 2000
  ]);

  console.log("Added " + busBCANmesgs.length + " BCAN messages");
}

// Add all probes
function addBCANprobe() {
  for(var j = 0; j < busBCANmesgs.length; j++) {
    busBCANinterval[j] = setInterval(busBCANmesgs[j][0], busBCANmesgs[j][1]);
  }

  busBCANinterval[j] = setInterval(function() {
    var mesgQLen = busBCANContents.length;
    for(var k = 0; k < mesgQLen; k++) {
        addMessage(busBCANContents[k][0], busBCANContents[k][1], busBCANContents[k][2]);
    }
    busBCANContents.splice(0, mesgQLen);
  }, 1500);
}

// Remove all probes
function removeBCANprobe() {
  for(var j = 0; j < busBCANinterval.length; j++) {
    clearInterval(busBCANinterval[j]);
  }
  busBCANinterval = [ ];
  busBCANContents = [ ];
}


//////////////////////////
// LIN message structures
//////////////////////////
var busLINContents = [ ];
var busLINmesgs = [ ];
var busLINinterval = [ ];
// Add all messages
function initLINMessageArray() {
  busLINmesgs.push([
    function () {
      busLINContents.push([
          performance.now(),
          '0xa2c',
          Math.random().toString(16).slice(-6).match(/.{2}/g).join(' ')
      ]);
    }, 2000
  ]);

  console.log("Added " + busLINmesgs.length + " LIN messages");
}

// Add all probes
function addLINprobe() {
  for(var j = 0; j < busLINmesgs.length; j++) {
    busLINinterval[j] = setInterval(busLINmesgs[j][0], busLINmesgs[j][1]);
  }

  busLINinterval[j] = setInterval(function() {
    var mesgQLen = busLINContents.length;
    for(var k = 0; k < mesgQLen; k++) {
        addMessage(busLINContents[k][0], busLINContents[k][1], busLINContents[k][2]);
    }
    busLINContents.splice(0, mesgQLen);
  }, 1500);
}

// Remove all probes
function removeLINprobe() {
  for(var j = 0; j < busLINinterval.length; j++) {
    clearInterval(busLINinterval[j]);
  }
  busLINinterval = [ ];
  busLINContents = [ ];
}

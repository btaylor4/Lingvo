import React from "react";
import {localStream} from "./video"
var socket = io.connect('https://' + document.domain + ':' + location.port);
var remoteStream;
var peerConn;
var loggedUser;
var connectedUser;

var mediaConstraints = {
  'mandatory': {
    'offerToReceiveAudio':true,
    'offerToRecieveVideo':true
  }
};

socket.on('message', onMessage);

function onMessage(evt) {
  console.log("Client has recieved a message");
  console.log(evt);
  switch(evt.type) {
    case 'offer':
      // We reieve a call
      onOffer(evt);
      break;
    
    case 'answer':
      // We answer the call
      onAnswer(evt.answer);
      break;
    
    case 'candidate':
    if(evt.candidate != null) {
      onCandidate(evt.candidate);
    }
      break;
    
    default:
      break;
  }
}

function onOffer(evt) {
  connectedUser = evt.name; // not in use yet
  
  peerConn.setRemoteDescription(new RTCSessionDescription(evt.offer)); // sets the discription of the other person calling us
  
  peerConn.createAnswer(function (answer) {
    console.log("Creating answer");
    peerConn.setLocalDescription(answer);
    sendClientMessage({
      type: "answer",
      answer: answer
    });
  }, errorCallback, 
     mediaConstraints);
}

function onAnswer(evt) {
  console.log("Answer event");
  peerConn.setRemoteDescription(new RTCSessionDescription(evt)); // sets the discription of the other person calling us
}

function onCandidate(evt) {
  console.log("Candidate event");
  if(evt!= null) {
    var candidate = new RTCIceCandidate(evt);
    peerConn.addIceCandidate(candidate);
  }
}

function sendClientMessage(message) {
  message.name = "jo";
  socket.emit('message', message);
}

export function createPeerConnection() {
  console.log("Creating PeerConnection")
  var pc_config = {"iceServers" :[]};

  peerConn = new RTCPeerConnection();

  peerConn.onicecandidate = function(evt) {
    if(evt.candidate != null) {
      sendClientMessage({
          type: 'candidate', 
          candidate: evt.candidate
      });
    }
  };

  var remotevid = document.getElementById('remoteVideo');

  peerConn.onaddstream = function(evt) {
    console.log("remote stream added");
    remotevid.src = window.URL.createObjectURL(evt.stream);
    remoteStream = evt.stream;
  };

  peerConn.addStream(localStream);
}

export default class ConnectButton extends React.Component {
  render() {
    return <button type="button" onClick={this.connectWithJo}>Call Jo</button>
  }

// We want to make call
  connect() {
    peerConn.createOffer(function (offer) {
      peerConn.setLocalDescription(offer);
      sendClientMessage({
        type: "offer",
        offer: offer
      });
    }, 
      errorCallback, 
      mediaConstraints);
  }
  
  // This method was going to be to test we can call different people, not tested or in use like it should yet
  connectWithJo() {
    // We want to make a call to some one else
    peerConn.createOffer(function (offer) {
      peerConn.setLocalDescription(offer);
      sendClientMessage({
        type: "offer",
        offer: offer
      });
    }, 
      errorCallback, 
      mediaConstraints);
  }
}
import React from "react";
import {localStream} from "./video"
var socket = io.connect('localhost:5000');
var remoteStream;
var peerConn;
var connectedUser;

var mediaConstraints = {
  'mandatory': {
    'offerToReceiveAudio':true,
    'offerToRecieveVideo':true
  }
};

socket.on('connect', onChannelOpened);
function onChannelOpened(evt) {
  console.log("Channel has been opened");
}

socket.on('message', onMessage);
function onMessage(evt) {
  console.log("Client has recieved a message");
  switch(evt.type) {
    case 'offer':
      onOffer(evt);
      break;
    
    case 'answer':
      onAnswer(evt.answer);
      break;
    
    case 'canidate':
      onCanidate(evt.candidate);
      break;
    
    default:
      break;
  }
}

// function onOffer(evt) {
//   connectedUser = evt.name;
//   console.log(connectedUser);
//   peerConn.setRemoteDescription(new RTCSessionDescription(evt.offer));
//   peerConn.createAnswer(function (answer) {
//     console.log("Creating answer");
//     peerConn.setLocalDescription(answer);
//     sendClientMessage({
//       type: "answer",
//       answer: answer
//     });
//   }, errorCallback, 
//      mediaConstraints);
// }

function onOffer(evt) {
  connectedUser = evt.name;
  console.log(connectedUser);
  peerConn.setRemoteDescription(new RTCSessionDescription(evt.offer));
  peerConn.createAnswer(
    setLocalAndSend, 
    errorCallback, 
    mediaConstraints
  );
}

function setLocalAndSend(description) {
  peerConn.setRemoteDescription(new RTCSessionDescription(description));
  sendClientMessage(description);
}

function onAnswer(evt) {
  console.log("Answer event");
  peerConn.setRemoteDescription(new RTCSessionDescription(evt));
}

function onCanidate(evt) {
  console.log("Canidate event");
  var candidate = new RTCIceCandidate(evt.candidate);
  peerConn.addIceCandidate(candidate);
}

function sendClientMessage(message) {
  message.name = connectedUser;
  socket.emit('message', message);
}

export function createPeerConnection() {
  console.log("Creating PeerConnection")
  var pc_config = {"iceServers" :[]};

  peerConn = new RTCPeerConnection();

  peerConn.onicecandidate = function(evt) {
    sendClientMessage({
        type: 'candidate', 
        candidate: evt.candidate
    });
  };

  var remotevid = document.getElementById('remoteVideo');

  peerConn.onaddstream = function(evt) {
    console.log("remote stream added");
    remotevid.src = window.URL.createObjectURL(evt.stream);
    remoteStream = evt.stream;
  };

  peerConn.addStream(localStream);
}

function errorCallback() {
  alert('This done fucked up');
}

export default class ConnectButton extends React.Component {
  render() {
    return <button type="button" onClick={this.connectWithJo}>Call Jo</button>
  }

// We want to make call
  connect() {
    peerConn.createOffer(function (offer) {
      console.log(offer);
      peerConn.setLocalDescription(offer);
      sendClientMessage({
        type: "offer",
        offer: offer
      });
    }, 
      errorCallback, 
      mediaConstraints);
  }
  
  // connectWithJo() {
  //   peerConn.createOffer(function (offer) {
  //     console.log(offer);
  //     peerConn.setLocalDescription(offer);
  //     connectedUser = "jo";
  //     sendClientMessage({
  //       type: "offer",
  //       offer: offer
  //     }, offer);
  //   }, 
  //     errorCallback, 
  //     mediaConstraints);
  // }
  
  connectWithJo() {
    peerConn.createOffer(
      setLocalAndSend,
      errorCallback, 
      mediaConstraints
    );
  }
}
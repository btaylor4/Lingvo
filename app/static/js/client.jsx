import React from "react";
import io from 'socket.io-client'

var socket = io.connect('localhost:5000');
var channelReady = false;
var started = false;
var remoteStream;
var localStream;
var peerConn;

var mediaConstraints = {
  'mandatory': {
    'offerToReceiveAudio':true,
    'offerToRecieveVideo':true
  }
};

socket.on('connect', onChannelOpened);

function onChannelOpened(evt) {
  console.log("Channel has been opened");
  channelReady = true;
}

socket.on('message', onMessage);

function onMessage(evt) {
  console.log("Client has recieved a message");
  if(evt.type === 'offer') {
    if(!started) {
      createPeerConnection();
      started = true;
      $.notify('Call from User 1');
    }
    peerConn.setRemoteDescription(new RTCSessionDescription(evt));
    peerConn.createAnswer(setLocalAndSendMessage,
                          errorCallback, 
                          mediaConstraints);
  } else if(evt.type === 'answer' && started) {
    peerConn.setRemoteDescription(new RTCSessionDescription(evt));
  } else if(evt.type === 'candidate' && evt.candidate != null && started) {
    console.log("Add candidate");
    console.log(evt);
    var candidate = new RTCIceCandidate(evt.candidate);
    peerConn.addIceCandidate(candidate);
  }
}

function sendClientMessage(message) {
  console.log("Client is sending message");
  socket.emit('message', message);
}

function createPeerConnection() {
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

function setLocalAndSendMessage(sessionDescription) {
  console.log(sessionDescription);
  peerConn.setLocalDescription(sessionDescription);
  sendClientMessage(sessionDescription);
}

function errorCallback() {
  alert('This done fucked up');
}

export default class ConnectButton extends React.Component {
  render() {
    return <button type="button" onClick={this.connect}>Connect</button>
  }
  
  connect() {
    createPeerConnection();  
    peerConn.createOffer(setLocalAndSendMessage, 
      errorCallback, 
      mediaConstraints);
  }
}
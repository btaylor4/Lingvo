// App.jsx
import React from "react";
import {createPeerConnection} from "./client"
import io from 'socket.io-client';

export var localStream;
navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

var mediaRecorder;
var socket = io.connect('localhost:5000/test');
    
export default class StartVideo extends React.Component {
  render () {
    return <div>
      <button type="button" onClick={this.startVideo}>Start</button>
    <button type="button" onClick={this.enableTranslation}>Enable Translation</button>
    <button type="button" onClick={this.disableTranslation}>Disable Translation</button>
    </div>
  }
  
  startVideo() {
    var constraints = {
      audio: true,
      video: true
    };

    function successCallback(stream) {
      var video = document.getElementById('sourceVideo');
      video.src = window.URL.createObjectURL(stream);
      localStream = stream;
      createPeerConnection();
    }

    function errorCallback(error) {
      console.log('navigator.getUserMedia error: ', error);
    }

    navigator.getUserMedia(constraints, 
      successCallback, 
      errorCallback);
  }

  enableTranslation() {
    // Get local audio stream
    var audioStream = new MediaStream(localStream.getAudioTracks());

    // Set recorder on audiostream
    mediaRecorder = new MediaRecorder(audioStream);

    // Chunk into 100 ms blobs
    mediaRecorder.start(100);

    mediaRecorder.ondataavailable = function(e) {
      console.log(e);
      // Sending over just the blob
      socket.emit('audio', {data:e.data})
    }
  }

  disableTranslation() {
    mediaRecorder.stop();
  }
}

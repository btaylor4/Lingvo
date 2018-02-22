// video.jsx
import React from "react";
import io from 'socket.io-client';
import Translation from './translate';

var localStream;
navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

var socket = io.connect('localhost:5000/test');
    
export default class StartVideo extends React.Component {
  render () {
    return <div>
      <button type="button" onClick={this.startVideo}>Start</button>
      <Translation></Translation>
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
    }

    function errorCallback(error) {
      console.log('navigator.getUserMedia error: ', error);
    }

    navigator.getUserMedia(constraints, 
      successCallback, 
      errorCallback);
  }
}

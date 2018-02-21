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
  constructor() {
    super()
    this.state = {
      interim_text : "",
      final_text : "",
      recognition : {}
    }
    this.enableTranslation = this.enableTranslation.bind(this);
  }

  componentDidMount() {
    if (!('webkitSpeechRecognition' in window)) {
      console.log('Upgrade browser');
    } else {
      var recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = event => {
        for (var i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            var finalText = this.state.final_text;
            this.setState({final_text: finalText + event.results[i][0].transcript});
          } else {
            var interimText = this.state.interim_text;
            this.setState({interim_text: interimText + event.results[i][0].transcript});
          }
        }
      }

      this.setState({recognition: recognition});
    }
  }

  render () {
    return <div>
      <button type="button" onClick={this.startVideo}>Start</button>
    <button type="button" onClick={this.enableTranslation}>Enable Translation</button>
    <button type="button" onClick={this.disableTranslation}>Disable Translation</button>
    <hr></hr>
    <p>Interim text: {this.state.interim_text}</p>
    <p>Final text: {this.state.final_text}</p>
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
    this.state.recognition.start();
  }
  
  disableTranslation() {
    recognition = this.state.recognition.stop();
  }
}

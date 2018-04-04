// video.jsx
import React from "react";
import {createPeerConnection} from "./client"
import Translation from './translate';
import {EndVideo} from "./client"

export var localStream;
navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    
export default class StartVideo extends React.Component {
    constructor() {
        super();
        this.state = {
          started: false
        };
        this.startVideo = this.startVideo.bind(this);
      }
  
    render () {
        const started = this.state.started;
    return <div>
      {started? (null): (<button type="button" className="btn btn-success" onClick={this.startVideo}>Start Local Video</button>)}
      </div>
  }
  
  startVideo() {
    var constraints = {
      audio: true,
      video: true
    };

    this.setState({started: true});

    function successCallback(stream) {
      var video = document.getElementById('sourceVideo');
      video.src = window.URL.createObjectURL(stream);
      video.muted = true;
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
}

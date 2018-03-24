//translate.jsx
import React from "react";
import io from 'socket.io-client';
import axios from 'axios';
import {getDataChannel} from './client' 

var socket = io.connect('http://' + document.domain + ':' + location.port);
var dataChannel = '';

export default class Translation extends React.Component {
  constructor() {
    super()
    this.state = {
      interim_text : "",
      final_text : "",
      recognition : {}
    }
    this.enableTranslation = this.enableTranslation.bind(this);
    this.translateText = this.translateText.bind(this);
    this.testTranslateText = this.testTranslateText.bind(this);
  }

  componentDidMount() {
    if (!('webkitSpeechRecognition' in window)) {
      console.log('Upgrade browser');
    } else {
      var recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      var username = window.localStorage.getItem('username');

      recognition.onresult = event => {
        for (var i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            var finalText = this.state.final_text;
            this.setState({final_text: finalText + event.results[i][0].transcript});
            var obj = {
                username: username,
                lang: recognition.lang,
                text: this.state.final_text
            }
            dataChannel.send(JSON.stringify(obj));
            // this.translateText('en', event.results[i][0].transcript, 'es');
          } else {
            var interimText = this.state.interim_text;
            this.setState({interim_text: event.results[i][0].transcript});
          }
        }
      }

      this.setState({recognition: recognition});
    }
  }

  testTranslateText() {
    this.translateText('en', 'Hello my name is rob', 'es');
  }

  // Format to automatically set handlers
  translateText(sourceLang, sourceText, targetLang) {
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" 
    + sourceLang + "&tl=" + targetLang + "&dt=t&q=" + encodeURI(sourceText);

    axios.get(url).then(response => {
      if(response.data != null){
        var result = response.data;
        var translatedText = result[0][0][0];

        var data = {
          user: '1',
          sourceText: sourceText,
          translatedText : translatedText
        }

        dataChannel.send({data: data});
      }
      });
  }

  render () {
    return <div>    <button type="button" onClick={this.enableTranslation}>Enable Translation</button>
    <button type="button" onClick={this.disableTranslation}>Disable Translation</button>
    <hr></hr>
    <p>Interim text: {this.state.interim_text}</p>
    <p>Final text: {this.state.final_text}</p>
    <button type="button" onClick={this.testTranslateText}>Test Translation Text</button></div>
  }


  enableTranslation() {
    this.state.recognition.start();
    dataChannel = getDataChannel();
  }
  
  disableTranslation() {
    recognition = this.state.recognition.stop();
  }
}
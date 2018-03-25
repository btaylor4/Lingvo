//translate.jsx
import React from "react";
import io from 'socket.io-client';
import axios from 'axios';
import {getDataChannel} from './client'
import Select from 'react-select';

var protocol = 'https://'
if (location.hostname === "localhost" || location.hostname === "127.0.0.1"){
    protocol = 'http://'
}
socket = io.connect(protocol + document.domain + ':' + location.port);
var dataChannel = '';

// Get language information
var languages = [{'English': 'en-US'}, {'Dutch':'nl-NL'}, {'Spanish':'es'}]

var selectedLanguage = '';

export function translateText(sourceLang, sourceText) {
  var url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" 
  + sourceLang + "&tl=" + selectedLanguage + "&dt=t&q=" + encodeURI(sourceText);

  axios.get(url).then(response => {
    if(response.data != null){
      var result = response.data;
      console.log(result);
      var translatedText = result[0][0][0];
      console.log(translatedText);

      //Change overlaid text html here
      $('.video-overlay').text(translatedText);
    }
    });
}


export default class Translation extends React.Component {
  constructor() {
    super()
    this.state = {
      interim_text : "",
      final_text : "",
      recognition : {},
      selectedLanguage: ''
    }
    this.enableTranslation = this.enableTranslation.bind(this);
    this.handleLanguageChange = this.handleLanguageChange.bind(this);
  }

  componentDidMount() {
    $('#overlays').text('some random text to display');
    if (!('webkitSpeechRecognition' in window)) {
      console.log('Upgrade browser');
    } else {
      var recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      var username = window.localStorage.getItem('username');

      recognition.onresult = event => {
        for (var i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            var finalText = this.state.final_text;
            this.setState({final_text: finalText + event.results[i][0].transcript});
            // var obj = {
            //     username: username,
            //     lang: selectedLanguage,
            //     text: this.state.final_text
            // }
            // dataChannel.send(JSON.stringify(obj));
            // this.translateText('en', event.results[i][0].transcript, 'es');
          } else {
            var interimText = this.state.interim_text;
            this.setState({interim_text: event.results[i][0].transcript});
            var obj = {
                username: username,
                lang: selectedLanguage,
                text: this.state.interim_text
            }
            dataChannel.send(JSON.stringify(obj));
          }
        }
      }

      this.setState({recognition: recognition});
    }
  }

  handleLanguageChange (e) {
      console.log(e);
      this.setState({selectedLanguage: e.value});
      selectedLanguage = e.value;
  }

  render () {

    const value = this.state.selectedLanguage;

    return <div>    <button type="button" onClick={this.enableTranslation}>Enable Translation</button>
    <button type="button" onClick={this.disableTranslation}>Disable Translation</button>
    <hr></hr>
    <Select
        name="select-language"
        value={value}
        onChange={this.handleLanguageChange}
        options={languages.map(x => {
            return {value: x[Object.keys(x)[0]], label: Object.keys(x)[0]}
        })}
        />
    <p>Interim text: {this.state.interim_text}</p>
    <p>Final text: {this.state.final_text}</p></div>
  }


  enableTranslation() {
    this.state.recognition.start();
    dataChannel = getDataChannel();
  }
  
  disableTranslation() {
    recognition = this.state.recognition.stop();
  }
}
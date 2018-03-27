//translate.jsx
import React from "react";
import axios from "axios";
import { getDataChannel } from "./client";
import Select from "react-select";

var dataChannel = "";
var recognition = {};

// Get language information
var languages = [{ English: "en-US" }, { Dutch: "nl-NL" }, { Spanish: "es" }];

var selectedLanguage = "en-US";

export function translateText(sourceLang, sourceText, interim) {
  var url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=" +
    sourceLang +
    "&tl=" +
    selectedLanguage +
    "&dt=t&q=" +
    encodeURI(sourceText);

  axios.get(url).then(response => {
    if (response.data != null) {
      var result = response.data;
      var translatedText = result[0][0][0];

      // Get current text
      var currentFinalCaption = $(".video-overlay--final").text();
      console.log(currentFinalCaption);
      if (interim) {
        $(".video-overlay--interim").text(translatedText);
      } else {
        //Change overlaid text html here
        $(".video-overlay--final").text(
          currentFinalCaption + " " + translatedText
        );
      }
    }
  });
}

// De reactifying

if (!("webkitSpeechRecognition" in window)) {
    console.log("Upgrade browser");
} else {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    var username = window.localStorage.getItem("username");

    recognition.onresult = event => {
    var interimText = "";
    for (var i = event.resultIndex; i < event.results.length; ++i) {
        console.log(event.results);
        if (event.results[i].isFinal) {
        var finalText = this.state.final_text;
        var obj = {
            username: username,
            lang: selectedLanguage,
            text: this.state.final_text,
            interim: false
        };
        console.log("final-text: " + event.results[i][0].transcript);
        dataChannel.send(JSON.stringify(obj));
        this.restartRecognition();
        } else {
        interimText = interimText + " " + event.results[i][0].transcript;
        var obj = {
            username: username,
            lang: selectedLanguage,
            text: interimText,
            interim: true
        };
        console.log("interim-text: " + interimText);
        dataChannel.send(JSON.stringify(obj));
        }
    }
    };

    recognition.onerror = event => {
    console.log("Speech Recognition error: " + event.message);
    };

    recognition.onstart = event => {
    console.log("Starting translation");
    };

    recognition.onpause = event => {
    console.log("Speech paused");
    // this.restartRecognition();
    }

    recognition.onend = event => {
    console.log("Speech ended: " + event.message);
    // this.restartRecognition();
    recognition.start();
    };
}

  function restartRecognition() {
    console.log("Restarting speech recognition");
    recognition.stop();
    console.log('temporary call between stop and start');
    recognition.start();
  }


export default class Translation extends React.Component {
  constructor() {
    super();
    this.state = {
      final_text: "",
      recognition: {},
      selectedLanguage: "en-US"
    };
    this.enableTranslation = this.enableTranslation.bind(this);
    this.disableTranslation = this.disableTranslation.bind(this);
    this.handleLanguageChange = this.handleLanguageChange.bind(this);
    this.restartRecognition = this.restartRecognition.bind(this);
  }

  // De-reactifying 

  handleLanguageChange(e) {
    console.log(e);
    this.setState({ selectedLanguage: e.value });
    selectedLanguage = e.value;
  }

  render() {
    const value = this.state.selectedLanguage;
    return (
      <div>
        <button type="button" onClick={this.enableTranslation}>
          Enable Translation
        </button>
        <button type="button" onClick={this.disableTranslation}>
          Disable Translation
        </button>
        <hr />
        <Select
          name="select-language"
          value={value}
          onChange={this.handleLanguageChange}
          options={languages.map(x => {
            return { value: x[Object.keys(x)[0]], label: Object.keys(x)[0] };
          })}
        />
      </div>
    );
  }

  enableTranslation() {
    recognition.start();
    dataChannel = getDataChannel();
  }

  disableTranslation() {
    recognition.abort();
  }
}


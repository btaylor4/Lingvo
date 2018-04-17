//translate.jsx
import React from "react";
import axios from "axios";
import { getDataChannel } from "./client";
import Select from "react-select";

var dataChannel = "";
var recognition = {};
var interimText = "";
var finalText = "";

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

      var captions = currentFinalCaption.split(" ");
      console.log(currentFinalCaption);
      if (!interim) {
        if (captions.length > 20) {
          $(".video-overlay--final").text(
            currentFinalCaption.split(" ", 10).join(" ") + " " + translatedText
          );
        } else {
          $(".video-overlay--final").text(
            currentFinalCaption + " " + translatedText
          );
        }
        //Clear interim text
        $(".video-overlay--interim").text('');
      } else {
        $(".video-overlay--interim").text(translatedText);
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
    interimText = "";
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      console.log(event.results);
      if (event.results[i].isFinal) {
        var obj = {
          username: username,
          lang: selectedLanguage,
          text: event.results[i][0].transcript,
          interim: false
        };
        console.log("final-text: " + event.results[i][0].transcript);
        dataChannel.send(JSON.stringify(obj));
        restartRecognition();
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

  recognition.onspeechend = event => {
    console.log("Speech paused");
    // this.restartRecognition();
  };

  recognition.onend = event => {
    console.log("Speech ended: " + event.message);
    // this.restartRecognition();
    recognition.start();
  };
}

function restartRecognition() {
  console.log("Restarting speech recognition");
  recognition.stop();
  console.log("temporary call between stop and start");
  recognition.start();
}

export function enableSpeechToText() {
    recognition.start();
    window.setInterval(function() {
      recognition.stop();
      console.log("Audio interrupt");
      console.log("starting recognition");
      recognition.start();
    }, 10000);
    dataChannel = getDataChannel();
}

export default class Translation extends React.Component {
  constructor() {
    super();
    this.state = {
      final_text: "",
      selectedLanguage: "en-US",
      enabled: false
    };
    this.enableTranslation = this.enableTranslation.bind(this);
    this.disableTranslation = this.disableTranslation.bind(this);
    this.handleLanguageChange = this.handleLanguageChange.bind(this);
  }

  // De-reactifying

  handleLanguageChange(e) {
    console.log(e);
    this.setState({ selectedLanguage: e.value });
    selectedLanguage = e.value;
  }

  render() {
    const value = this.state.selectedLanguage;
    const enabled = this.state.enabled;
    return (
      <div>
        {enabled ? (
          <button type="button" className="btn btn-secondary btn-sm" onClick={this.disableTranslation}>
            Disable Translation
          </button>
        ) : (
          <button type="button" className="btn btn-primary btn-sm" onClick={this.enableTranslation}>
            Enable Translation
          </button>
        )}
        {/* <button type="button" className="btn btn-primary btn-lg" onClick={enableSpeechToText}>Enable Speech to Text
        </button> */}
        <hr />
        <h6>Select your understood and spoken language</h6>
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
    this.setState({enabled: true});
    // Clear translation
    $(".video-overlay--final").text('');
    $(".video-overlay--interim").text('');
    $(".video-overlay--final").removeClass('hidden');
    $(".video-overlay--interim").removeClass('hidden');
  }

  disableTranslation() {
    this.setState({ enabled: false });
    $(".video-overlay--final").addClass('hidden');
    $(".video-overlay--interim").addClass('hidden');
  }
}

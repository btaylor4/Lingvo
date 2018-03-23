// index.jsx
import React from "react";
import ReactDOM from "react-dom";
import Search from "./client"
import App from "./App";
import StartVideo from "./video"
//import ConnectButton from "./client"
ReactDOM.render(<StartVideo />, document.getElementById("sourceVideoContent"));
//ReactDOM.render(<ConnectButton />, document.getElementById("remoteVideoContent"));

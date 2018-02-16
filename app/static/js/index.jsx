// index.jsx
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import ShowVideo from "./video"
import ConnectButton from "./client"
ReactDOM.render(<ShowVideo />, document.getElementById("sourceVideoContent"));
ReactDOM.render(<ConnectButton />, document.getElementById("remoteVideoContent"));
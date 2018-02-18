import React from "react";
import ReactDOM from "react-dom";
import {localStream} from "./video"
var socket = io.connect('http://' + document.domain + ':' + location.port);
var remoteStream;
var peerConn;
var loggedUser;
var connectedUser;

var mediaConstraints = {
  'mandatory': {
    'offerToReceiveAudio':true,
    'offerToRecieveVideo':true
  }
};

socket.on('message', onMessage);

function onMessage(evt) {
  console.log("Client has recieved a message");
  console.log(evt);
  switch(evt.type) {
    case 'offer':
      // We reieve a call
      onOffer(evt);
      break;
    
    case 'answer':
      // We answer the call
      onAnswer(evt.answer);
      break;
    
    case 'candidate':
    if(evt.candidate != null) {
      onCandidate(evt.candidate);
    }
      break;
    
    default:
      break;
  }
}

function onOffer(evt) {
  connectedUser = evt.name; // not in use yet
  
  peerConn.setRemoteDescription(new RTCSessionDescription(evt.offer)); // sets the discription of the other person calling us
  
  peerConn.createAnswer(function (answer) {
    console.log("Creating answer");
    peerConn.setLocalDescription(answer);
    sendClientMessage({
      type: "answer",
      answer: answer
    });
  }, errorCallback, 
     mediaConstraints);
}

function onAnswer(evt) {
  console.log("Answer event");
  peerConn.setRemoteDescription(new RTCSessionDescription(evt)); // sets the discription of the other person calling us
}

function errorCallback() {
  console.log("Error occured");
}

function onCandidate(evt) {
  console.log("Candidate event");
  if(evt!= null) {
    var candidate = new RTCIceCandidate(evt);
    peerConn.addIceCandidate(candidate);
  }
}

function sendClientMessage(message) {
  message.name = "jo";
  socket.emit('message', message);
}

export function createPeerConnection() {
  console.log("Creating PeerConnection")
  var pc_config = {"iceServers" :[]};

  peerConn = new RTCPeerConnection();

  peerConn.onicecandidate = function(evt) {
    if(evt.candidate != null) {
      sendClientMessage({
          type: 'candidate', 
          candidate: evt.candidate
      });
    }
  };

  var remotevid = document.getElementById('remoteVideo');

  peerConn.onaddstream = function(evt) {
    console.log("remote stream added");
    remotevid.src = window.URL.createObjectURL(evt.stream);
    remoteStream = evt.stream;
  };

  peerConn.addStream(localStream);
}

class ConnectButton extends React.Component {
  render() {
    return <button type="button" onClick={this.connectWithJo}>Call Jo</button>
  }

// We want to make call
  connect() {
    peerConn.createOffer(function (offer) {
      peerConn.setLocalDescription(offer);
      sendClientMessage({
        type: "offer",
        offer: offer
      });
    }, 
      errorCallback, 
      mediaConstraints);
  }
  
  // This method was going to be to test we can call different people, not tested or in use like it should yet
  connectWithJo() {
    // We want to make a call to some one else
    peerConn.createOffer(function (offer) {
      peerConn.setLocalDescription(offer);
      sendClientMessage({
        type: "offer",
        offer: offer
      });
    }, 
      errorCallback, 
      mediaConstraints);
  }
}

var users;

socket.on('message', onMessage);

function onMessage(evt) {
  switch (evt.type) {
    case 'gotUsers':
      users = evt.users;
      console.log(users);
      break;
    default:
      break;
  }
}

class Card extends React.Component {
  call() {
    connectedUser = this.props.username;
    
    // We want to make a call to some one else
    peerConn.createOffer(function (offer) {
      peerConn.setLocalDescription(offer);
      sendClientMessage({
        type: "offer",
        offer: offer,
        id: this.props.id
      });
    }, 
      errorCallback, 
      mediaConstraints);    
  }
  
  render() {
    return <div className="card" id={this.props.id}>
              <div className="card-block">
                <h4>{this.props.name}</h4> 
                <p> This is where a partial bio would go! </p>
                <button type="button" onClick={this.call}> Call {this.props.name}</button>
              </div>
            </div>
  }
}

class FriendCards extends React.Component {
  render() {
    var list = [];
    
    for(var i = 0; i < users.length; i++) {
      console.log(users[i].username);
      list.push(<Card key={i} name={users[i].username}></Card>);
    }
    
    return <div>{list}</div>;
  }
}

class SearchBar extends React.Component {
  onTextChange() {
    this.props.onUserInput(this.refs.filterTextInput);
  }
  
  render() {
    socket.emit('message', {
      type: 'getUsers'
    });
    
    return <form>
        <input
          type="text"
          placeholder="Search..."
          ref="filterTextInput"
          onChange={this.onTextChange}
        />
      </form>
  }
}

class FilteredCards extends React.Component {
  getInitialState() {
    return{
      filteredText: ''
    };
  }
  
  handleUserInput(text) {
    this.setState({
      filterText: text
    })
  }
  
  render() {
    return <div>
      <SearchBar>
        onUserInput ={this.handleUserInput}
      </SearchBar>
      <FriendCards>
        listedUsers={this.props.listedUsers}
      </FriendCards>
    </div>
  }
}

export default class Search extends React.Component {
  render() {
    socket.emit('message', {
      type: 'getUsers'
    });
    return <form>
        <input
          type="text"
          placeholder="Search..."
          onChange={this.onTextChange}
          value=""
        />
    </form>
  }
  
  onTextChange() {
    var list = [];
    
    for(var i = 0; i < users.length; i++) {
      list.push(<Card key={i} name={users[i].username} id={users[i]._id.$oid}></Card>);
    }
    
    const element = <div>{list}</div>;
    ReactDOM.render(element, document.getElementById('cardholder'));
  }
}

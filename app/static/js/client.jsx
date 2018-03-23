// imports
import React from "react";
import ReactDOM from "react-dom";
import {localStream} from "./video";
import StartVideo from "./video"

// variables
var socket = io.connect('http://' + document.domain + ':' + location.port);
var remoteStream;
var peerConn;
var connectedUser;
var users;
var sid;
var session = window.localStorage;
var username;

var mediaConstraints = {
  'mandatory': {
    'offerToReceiveAudio':true,
    'offerToRecieveVideo':true
  }
};

// Components
class LoginButton extends React.Component {
  handleClick() {
    window.localStorage.setItem('username', document.getElementById('username').value);
  }
  
  render() {
    return <button className="btn btn-default" onClick={this.handleClick}> Login </button>
  }
}

class LoginForm extends React.Component {  
  render() {
    return <form method="POST">
      <input id="username" type="text" placeholder="Username" name="username"/>
        
      <input id="password" type="password" placeholder="Password" name="password"/>
        
      <LoginButton></LoginButton>
    </form>
  }
}

socket.on('connect', onConnection)
function onConnection() {
  if(window.location.pathname == "/login") {
    ReactDOM.render(<LoginForm />, document.getElementById("login-button"));
  }
  
  else if(window.location.pathname == "/user-portal") {
    ReactDOM.render(<StartVideo />, document.getElementById("sourceVideoContent"));
    ReactDOM.render(<Search />, document.getElementById("searchbar"));
    sendClientMessage({
      type: 'getSession',
      user: session.getItem('username')
    });
    
    sendClientMessage({
      type: 'getUsers',
      user: session.getItem('username')
    });
  }
}

socket.on('message', onMessage)
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
    
    case 'gotUsers':
      users = evt.users;
      console.log(users);
      break;
      
    case 'session':
      console.log("Got session")
      sid = evt.sid;
      username = session.getItem('username');
      break;
        
    default:
      break;
  }
}

function onOffer(evt) {
  connectedUser = evt.username;
  console.log("We recieved a call from " + connectedUser);
  
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
  message.id = connectedUser;
  socket.emit('message', message);
}

export function createPeerConnection() {
  console.log("Creating PeerConnection")
  var pc_config = {
    'iceServers' :[{
    'url': 'stun:stun2.l.google.com:19302'
    }]
  };

  peerConn = new RTCPeerConnection(pc_config);

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

class Card extends React.Component {
  call(name) {
    connectedUser = name;
    
    // We want to make a call to some one else
    peerConn.createOffer(function (offer) {
      peerConn.setLocalDescription(offer);
      sendClientMessage({
        type: "offer",
        offer: offer,
        id: name, // who we want to talk to (username)
        username: session.getItem('username') // who we are
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
                <button type="button" onClick={ (e) => this.call(this.props.name, e) }> Call {this.props.name}</button>
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
    return <form>
        <input
          type="text"
          placeholder="Search..."
          onChange={this.onTextChange}
        />
    </form>
  }
  
  onTextChange() {
    setTimeout(function() {
      var list = [];
    
      for(var i = 0; i < users.length; i++) {
        list.push(<Card key={i} name={users[i].username} id={users[i]._id.$oid}></Card>);
      }
    
      const element = <div>{list}</div>;
      ReactDOM.render(element, document.getElementById('cardholder'));
    }, 100);
  }
}

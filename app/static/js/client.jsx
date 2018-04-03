// imports
import React from "react";
import ReactDOM from "react-dom";
import {localStream} from "./video";
import StartVideo from "./video"
import {translateText} from "./translate"
import io from 'socket.io-client';

// variables
var protocol = 'https://'
if (location.hostname === "localhost" || location.hostname === "127.0.0.1"){
    protocol = 'http://'
}
var socket = io.connect(protocol + document.domain + ':' + location.port);
var remoteStream;
var peerConn;
var dataChannel;
var connectedUser;
var users;
var sid;
var session = window.localStorage;
var username;
var remotevid;
var friendsList;
var friend_requests;

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

    sendClientMessage({
      type: 'getFriends',
      user: session.getItem('username')
    });

    sendClientMessage({
      type: 'getRequests',
      user: session.getItem('username')
    });

    $("#view-friends").click(function() {
      
    });
  }
}

function notify(evt) {
  $.notify.addStyle('answer', {
    html: 
      "<div>" +
        "<div>" +
          "<div class='title' data-notify-html='title'/>" +
          "<div class='buttons'>" +            
            "<button class='yes' data-notify-text='button'></button>" +
            "<button class='no'>Cancel</button>" +
          "</div>" +
        "</div>" +
      "</div>"
  });
  
  //listen for click events from this style
  $(document).on('click', '.notifyjs-answer-base .no', function() {
    $(this).trigger('notify-hide');
  });
  $(document).on('click', '.notifyjs-answer-base .yes', function() {
    $(this).trigger('notify-hide');
    onOffer(evt);
  });

  $.notify({
    title: 'Accept call from ' + evt.username + '?',
    button: 'Confirm'
  }, { 
    style: 'answer',
    autoHide: false,
    clickToHide: false
  });
}

function notifyFriendRequest(evt) {
  $("#friend-request-counter").text(" " + evt.requests.length);
  $("#friend-request-counter").notify('New Friend Request');
}

function handleFriendAccept() {
  sendClientMessage({
    type: "accept_request"
  })
}

socket.on('message', onMessage)
function onMessage(evt) {
  console.log("Client has recieved a message");
  console.log(evt);
  switch(evt.type) {
    case 'offer':
      // We reieve a call
      notify(evt);
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
      // console.log(users);
      break;
      
    case 'session':
      // console.log("Got session")
      sid = evt.sid;
      username = session.getItem('username');
      break;

    case 'leave':
      // caller wants to leave us
      connectedUser = null;
      closeCall();
      break; 
        
    case 'friend_request': // we receive a friend request
      friend_requests = evt.requests;
      notifyFriendRequest(evt);
      break;

    case 'notifications':
      friend_requests = evt.requests;

      var list = [];
    
      for(var i = 0; i < friend_requests .length; i++) {
        list.push(<FriendRequest key={i} name={friend_requests[i]}></FriendRequest>);
      }

      const element = <div>{list}</div>;

      ReactDOM.render(element, document.getElementById("dropdown-friends"));
      break;

    default:
      break;
  }
}

function onOffer(evt) {
  connectedUser = evt.username;
  // console.log("We recieved a call from " + connectedUser);

  if(peerConn == null) {
    createPeerConnection();
  }
  
  peerConn.setRemoteDescription(new RTCSessionDescription(evt.offer)); // sets the discription of the other person calling us
  
  peerConn.createAnswer(function (answer) {
    // console.log("Creating answer");
    peerConn.setLocalDescription(answer);
    sendClientMessage({
      type: "answer",
      answer: answer
    });
  }, errorCallback, 
     mediaConstraints);
}

function onAnswer(evt) {
  // console.log("Answer event");
  peerConn.setRemoteDescription(new RTCSessionDescription(evt)); // sets the discription of the other person calling us
}

function errorCallback() {
  console.log("Error occured");
}

function onCandidate(evt) {
  // console.log("Candidate event");
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
  // console.log("Creating PeerConnection")
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
  
  remotevid = document.getElementById('remoteVideo');

  peerConn.onaddstream = function(evt) {
    // console.log("remote stream added");
    remotevid.src = window.URL.createObjectURL(evt.stream);
    remoteStream = evt.stream;

    // Change css 
    $('.inner-container').attr('class','inner-container__after-call');
    $('.outer-container').attr('class','outer-container__after-call');
  };

  peerConn.addStream(localStream);

    //Set data channel here

    dataChannel = peerConn.createDataChannel('translation', {reliable: true});
    
      dataChannel.onerror = function (error) {
        console.log("Data Channel Error:", error);
      };
      
      dataChannel.onmessage = function (event) {
        console.log(event);
        console.log("Got Data Channel Message:", event.data);
        var data = JSON.parse(event.data);
        // Check if it's coming from the right source
        if (data.lang != null && data.text != null && data.interim != null){
            translateText(data.lang, data.text, data.interim);
        }
      };
      
      dataChannel.onopen = function () {
        dataChannel.send("Hello World!");
        console.log('Data channel opened');
      };
      
      dataChannel.onclose = function () {
        console.log("The Data Channel is Closed");
      };

      peerConn.ondatachannel = function (e) {
        console.log(e);
        dataChannel = e.channel;
        dataChannel.onerror = function (error) {
            console.log("Data Channel Error:", error);
          };
          
          dataChannel.onopen = function () {
            dataChannel.send("Hello World!");
            console.log('Data channel opened');
          };
          
          dataChannel.onclose = function () {
            console.log("The Data Channel is Closed");
          };
        console.log('peerConn.ondatachannel event fired.');
        };
}

export function getDataChannel() {
    return dataChannel;
}

function closeCall() {
  peerConn = null;
  if(remotevid != null) {
    remotevid.src = null; 
    remoteStream = null;
  }
}

class Card extends React.Component { //these will now be sending friend requests
  sendFriendRequest(name) {
    sendClientMessage({
      type: "friend_request",
      requester: session.getItem('username'),
      receiver: name
    });
  }

  render() {
    return <div className="card" id={this.props.id}>
              <div className="card-block">
                <h4>{this.props.name}</h4> 
                <p> This is where a partial bio would go! </p>
                <button type="button" onClick={ (e) => this.sendFriendRequest(this.props.name, e) }> Send Friend Request</button>
              </div>
            </div>
  }
}

class FriendCards extends React.Component {
  call(name) {
    if(peerConn == null) {
      console.log("Peer connection is null!");
      createPeerConnection();
    }

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
    return <div className="col-sm-12">

        <div className="col-sm-2">
            <h3 className="fa fa-user fa-3x"></h3>
        </div>

        <div className="col-sm-8">
          <h4>{this.props.name}</h4>
        </div>

        <div className="col-sm-2">
          <br/>
          <button type="button" onClick={ (e) => this.call(this.props.name, e) }> Call {this.props.name}</button>
        </div>

      </div>
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

class FriendRequest extends React.Component {
  acceptRequest() {

  }

  denyRequest() {

  }
  
  render() {
    return <div>
      {this.props.name}
        <div className="button-options">
          <button onClick={this.acceptRequest()}> Accept </button>
          <button onClick={this.denyRequest()}> Decline </button>
        </div>
      </div>
  }
}

export class EndVideo extends React.Component {
  render() {
    return <div>
      <button type="button" onClick={this.endVideo}> End Call</button>
      </div>
  }

  endVideo() { // we want to end the call
    if(peerConn != null) {
      peerConn.close();
      sendClientMessage({
        type: "leave",
        id: connectedUser
      });

      connectedUser = null;
      peerConn = null;
      console.log("Peer connection is set to null!");
    }

    closeCall();
  }
}
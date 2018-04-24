// imports
import React from "react";
import ReactDom from "react-dom";
import {localStream} from "./video";
import StartVideo from "./video"
import {translateText, enableSpeechToText} from "./translate"
import io from 'socket.io-client';
import NavBar from './nav';
import Translation from './translate';

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

socket.on('connect', onConnection)
function onConnection() {
  if(window.location.pathname == "/user-portal") {
    ReactDom.render(<StartVideo />, document.getElementById("sourceVideoContent"));
    ReactDom.render(<Search />, document.getElementById("searchbar"));
    ReactDom.render(<NavBar />, document.getElementById('nav'));
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
  }
}

class CallModal extends React.Component {
    handleAccept(evt) {
        console.log('handle accept: ');
        console.log(evt);
        onOffer(evt);
        $('#callModal').modal('hide');
    }
    
    render () {
        const evt = this.props.evt;
        const caller = this.props.caller;

        console.log(evt);

return (<div><div className="modal fade" id="callModal" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div className="modal-dialog" role="document">
    <div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title" id="exampleModalLabel">Incoming call from {caller}</h5>
        <button type="button" className="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" data-dismiss="modal">Dismiss Call</button>
        <button type="button" className="btn btn-primary" onClick={ (e) => this.handleAccept(evt, e)}>Accept call from {caller}</button>
      </div>
    </div>
  </div>
</div>
</div>)

    }
}

function notify(evt) {
  const element = <CallModal evt={evt} caller={evt.username}/>
  ReactDom.render(element, document.getElementById('modal'));
  $('#callModal').modal('show');
}

function notifyFriendRequest(evt) {
  $("#friend-request-counter").text(" " + evt.requests.length);
  // $("#friend-request-counter").notify('New Friend Request');
}

socket.on('message', onMessage)
function onMessage(evt) {
  console.log("Client has recieved a message");
  console.log(evt);
  switch(evt.type) {
    case 'offer':
      // We reieve a call
      onOffer(evt); // test
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

    case 'getFriends':
      friendsList = evt.friends;
      createFriendList();
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
      createDropdown();
      break;

    case 'notifications':
      friend_requests = evt.requests;
      createDropdown();  
      break;

    default:
      break;
  }
}

function createFriendList() {
  const line = <hr/>
  var list = [];
    
  for(var i = 0; i < friendsList.length; i++) {
    list.push(<FriendCard key={i} name={friendsList[i]}></FriendCard>);
    list.push(line);
  }

  const element = <div>{list}</div>;

  ReactDOM.render(element, document.getElementById("friends-list"));
}

function createDropdown() {
  const line = <hr/>
  var list = [];
    
  for(var i = 0; i < friend_requests.length; i++) {
    list.push(<FriendRequest key={i} name={friend_requests[i]}></FriendRequest>);
    list.push(line);
  }

  const element = <div>{list}</div>;

  ReactDOM.render(element, document.getElementById("dropdown-friends"));

  //Update number of friends in notification
  $('#friend-request-counter').text(friend_requests.length);
}

function onOffer(evt) {
  // console.log("We recieved a call from " + connectedUser);
  connectedUser = evt.username;

  if(peerConn == null) {
    createPeerConnection();
  }
  
  peerConn.setRemoteDescription(new RTCSessionDescription(evt.offer)); 

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
    var candidate = new RTCIceCandidate({ candidate: evt.candidate });
    peerConn.addIceCandidate(candidate,
      function(success) {
        console.log("Succeess add ice candidate");
        console.log(success);
      },
      function(error) {
        console.log("Error on add ice candidate");
        console.log(error);
      });
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
    'url': 'stun:stun.services.mozilla.com:3478'
    },      {
      'url': 'turn:turn.anyfirewall.com:443?transport=tcp',
      'credential': 'webrtc',
      'username': 'webrtc'
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
    $('#remote-visibility').removeClass('hidden');
    // Change incallbuttons

    // Todo make work
    // Render translation
    ReactDom.render(<InCallButtons/>, document.getElementById('duringCallButtons'));
  };


  // TODO: Make work
  class InCallButtons extends React.Component { 
    render() {
        return <div>  
            <div className="float-right"><EndVideo></EndVideo></div>
            <div className="float-left"><Translation></Translation></div>
        </div>
    }
  }


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
        console.log(data);
        if (data.lang != null && data.text != null && data.interim != null){
            translateText(data.lang, data.text, data.interim);
        }
      };
      
      dataChannel.onopen = function () {
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
            console.log('Data channel opened');
            enableSpeechToText();

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
    return (<div className="card" id={this.props.id}>
              <div className="card-body">
                <h6 className="card-title">{this.props.name}</h6>
                <p> This is where a partial bio would go! </p>
                <button type="button" className="btn btn-success btn-sm" onClick={ (e) => this.sendFriendRequest(this.props.name, e) }> Send Friend Request</button>
              </div>
            </div>)
  }
}

class FriendCard extends React.Component {
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
    return (<div className="card" id={this.props.id}>
        <div className="card-body">
        <h6 className="card-title">{this.props.name}</h6>
        <p className="card-text"> This is where a partial bio would go! </p>
        <button type="button" className="btn btn-info btn-sm" onClick={ (e) => this.call(this.props.name, e) }>Call {this.props.name}</button>
        </div>
    </div>)
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
          className="input-group-text"
        />
      </form>
  }
}

export class Search extends React.Component {
  render() {
    return <form>
        <input
          type="text"
          placeholder="Search..."
          onChange={this.onTextChange}
          id="searchQuery"
        />
    </form>
  }
  
  onTextChange() {
    setTimeout(function() {
      var list = [];
      var value =  document.getElementById("searchQuery").value;

      for(var i = 0; i < users.length; i++) {
        if(users[i].username.includes(value) && value != "" && !users[i].username.includes(username))
          list.push(<Card key={i} name={users[i].username} id={users[i]._id.$oid}></Card>);
      }
    
      const element = <div>{list}</div>;
      ReactDom.render(element, document.getElementById('cardholder'));
    }, 100);
  }
}

class FriendRequest extends React.Component {
  acceptRequest(name) {
    sendClientMessage({
      type: "accept_friend_request",
      acceptor: session.getItem("username"),
      receiver: name
    })
  }

  denyRequest(name) {
    sendClientMessage({
      type: "decline_friend_request",
      denier: session.getItem("username"),
      receiver: name
    })
  }
  
  render() {
    return <div className="pl-2 pr-2">
      <h4>{this.props.name}</h4><p>wants to be your friend</p>
        <div className="button-options">
          <button type="button" className="btn btn-outline-primary btn-sm mr-2" onClick={(e) => this.acceptRequest(this.props.name, e)}> Confirm </button>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={(e) => this.denyRequest(this.props.name, e)}> Deny </button>
        </div>
      </div>
  }
}

export class EndVideo extends React.Component {
  render() {
    return <div>
      <button type="button" className="btn btn-danger" onClick={this.endVideo}> End Call</button>
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
    revertUI();
  }
}

function revertUI() {
    // Change css 
    $('.inner-container').attr('class','inner-container');
    $('.outer-container').attr('class','outer-container');
    $('#remote-visibility').addClass('hidden');  
    $('#sourceVideoContent').removeClass('hidden');
    $('#duringCallButtons').addClass('hidden');
}

function closeCall() {
  peerConn = null;
  if(remotevid != null) {
    remotevid.src = null; 
    remoteStream = null;
  }
}

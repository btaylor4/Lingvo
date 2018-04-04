// imports
import React from "react";
import ReactDom from "react-dom";
import {localStream} from "./video";
import StartVideo from "./video"
import {translateText} from "./translate"
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

var mediaConstraints = {
  'mandatory': {
    'offerToReceiveAudio':true,
    'offerToRecieveVideo':true
  }
};

// Components

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
    $('#remote-visibility').removeClass('hidden');

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

class Card extends React.Component {
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
    return <div className="card" id={this.props.id}>
              <div className="card-body">
                <h6 className="card-title">{this.props.name}</h6> 
                <p className="cart-text"> This is where a partial bio would go! </p>
                <button type="button" className="btn btn-info btn-sm" onClick={ (e) => this.call(this.props.name, e) }> Call {this.props.name}</button>
              </div>
            </div>
  }
}

class FriendCards extends React.Component {
  render() {
    var list = [];
    
    for(var i = 0; i < users.length; i++) {
      // console.log(users[i].username);
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
          className="input-group-text"
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

export class Search extends React.Component {
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
      ReactDom.render(element, document.getElementById('cardholder'));
    }, 100);
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

    // Unmount mounted components
    // ReactDom.unmountComponentAtNode(<InCallButtons />)

    // Rerender start call functionality
    ReactDom.render(<StartVideo/>, document.getElementById("sourceVideoContent"))
}

function closeCall() {
  peerConn = null;
  if(remotevid != null) {
    remotevid.src = null; 
    remoteStream = null;
  }
}

// export default class ClientView extends React.Component {
//     render() {
//         return(<div>
//             <NavBar></NavBar>
//             <div className="container">
//                 <div className="row">
//                     <div className="col">
//                         <Search></Search>
//                         <div className="row-4" id="cardholder"></div>
//                     </div>
//                     <div className="col-8">
//                     <div className="outer-container">
//                         <div id='remotevideo'>
//                             <div className="video-overlay">
//                                 <div className="video-overlay--final"></div>
//                                 <div className="video-overlay--interim"></div>
//                             </div>
//                             <video autoPlay id="remoteVideo"></video>
//                             <div id="remoteVideoContent"></div>
//                         </div>
//                         <div className="inner-container">
//                             <video autoPlay id="sourceVideo"></video>
//                         </div>
//                     </div>
//                     <div id="sourceVideoContent">
//                     <StartVideo></StartVideo>
//                     </div>
//                     </div>
//                 </div>
//                 <div className="row">
//                     <div className="col-4">
//                     </div>
//                 </div>
//             </div>
//             </div>)
//     }
// }


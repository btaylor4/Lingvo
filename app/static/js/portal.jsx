// index.jsx
import React from "react";
import ReactDOM from "react-dom";
import Search from "./client"
import StartVideo from "./video"
//import ConnectButton from "./client"
ReactDOM.render(<StartVideo />, document.getElementById("sourceVideoContent"));
//ReactDOM.render(<ConnectButton />, document.getElementById("remoteVideoContent"));

export default class Portal extends React.Component {
    render() {
        return (<div><NavBar></NavBar><div className="container">
        <div className="jumbotron">
            <h1 className="display-4">Login</h1>
            <LoginForm></LoginForm>
            <p className="lead">Not a user yet?
                <a className="btn btn-primary btn-lg" href="/register" role="button">Register</a>
            </p>
        </div>
    </div>
    </div>)
    }
}

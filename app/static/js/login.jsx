import React from "react";
import NavBar from './nav';

export default class Login extends React.Component {
    render() {
        return (<div><NavBar></NavBar><div className="container">
        <div className="jumbotron">
            <h1 className="display-4">Login</h1>
            <LoginForm></LoginForm>
            <p className="lead">
            <p> Not a user yet? </p>
                <a className="btn btn-primary btn-lg" href="/register" role="button">Register</a>
            </p>
        </div>
    </div>
    </div>)
    }
}

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
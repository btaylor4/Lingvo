import React from "react";
import NavBar from './nav';

export default class Login extends React.Component {
    render() {
        return (<div><NavBar></NavBar><div className="container">
        <div className="jumbotron">
            <h1 className="display-4">Login</h1>
            <hr></hr>
            <LoginForm></LoginForm>
            <hr></hr>
            <p className="lead">
            <p> Not a user yet? </p>
                <a className="btn btn-secondary" href="/register" role="button">Register</a>
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
      return <button className="btn btn-primary btn-lg" onClick={this.handleClick}> Login </button>
    }
  }
  
  class LoginForm extends React.Component {  
    render() {
      return <form method="POST">
        <input id="username" className="form-control form-group col-sm-3" type="text" placeholder="Username" name="username"/>
        <input id="password" className="form-control form-group col-sm-3" type="password" placeholder="Password" name="password"/>
        <LoginButton></LoginButton>
      </form>
    }
  }
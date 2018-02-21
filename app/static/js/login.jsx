import React from "react";

class LoginButton extends React.Component {
  handleClick() {
    window.localStorage.setItem('username', document.getElementById('username').value)
  }
  
  render() {
    return <button className="btn btn-default" onClick={this.handleClick}> Login </button>
  }
}

export default class LoginForm extends React.Component {  
  render() {
    // console.log(window.location.pathname);
    return <form method="POST">
      <input id="username" type="text" placeholder="Username" name="username"/>
        
      <input id="password" type="password" placeholder="Password" name="password"/>
        
      <LoginButton></LoginButton>
    </form>
  }
}
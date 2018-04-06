// imports
import React from "react";
import ReactDOM from "react-dom";

export default class NavBar extends React.Component {
  render() {
    const username = window.localStorage.getItem('username');
    const loggedIn = username != null && username != '' ? true:false;

    return (
      <nav className="navbar navbar-expand-sm navbar-light bg-light mb-5">
        <a className="navbar-brand" href="/">
          Lingvo
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
        
            {!loggedIn ? (
                <ul className="navbar-nav ml-auto">
            <li className="nav-item">
              <a className="nav-link" href="/login">
                Login
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/register">
                Register
              </a>
            </li>
            </ul>) : (
                <ul className="navbar-nav ml-auto">
            <li className="nav-item dropdown">
                <a class="nav-link dropdown-toggle" data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">Friend Requests <span id="friend-request-counter" class="badge badge-dark badge-pill">&nbsp; 0</span></a>
                <div class="dropdown-menu" id="dropdown-friends">
                </div>
            </li>
            <li className="nav-item">
              <a className="nav-link" onClick={() =>window.localStorage.setItem('username', '')} href="/logout">
                Logout
              </a>
            </li>
         </ul>)}
        </div>
      </nav>
    );
  }
}

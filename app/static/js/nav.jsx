// imports
import React from "react";
import ReactDOM from "react-dom";

export default class NavBar extends React.Component {
  render() {
    const username = window.localStorage.getItem('username');
    const loggedIn = username != null && username != '' ? true:false;

    return (
      <nav className="navbar navbar-expand-lg navbar-light bg-light justify-content-between mb-5">
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
                <ul className="navbar-nav">
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
                <ul className="navbar-nav">
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

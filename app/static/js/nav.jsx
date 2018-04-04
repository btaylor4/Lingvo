// imports
import React from "react";
import ReactDOM from "react-dom";

export default class NavBar extends React.Component {
  render() {
    return (
      <nav class="navbar navbar-expand-lg navbar-light bg-light justify-content-between mb-5">
        <a class="navbar-brand" href="/">
          Lingvo
        </a>
        <button
          class="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon" />
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav">
            <li class="nav-item">
              <a class="nav-link" href="/login">
                Login
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/register">
                Register
              </a>
            </li>
          </ul>
        </div>
      </nav>
    );

    return (
      <nav className="navbar navbar-inverse bg-inverse navbar-expand-lg">
        <div className="navbar-header">
          <a className="navbar-brand" href="#">
            Lingvo
          </a>
        </div>
        <div className="navbar-collapse collapse">
          <ul className="nav navbar-nav">
            <li>
              <a href="#">About</a>
            </li>
            <li>
              <a href="#">Contact</a>
            </li>
          </ul>
          <ul className="nav navbar-nav navbar-right">
            <li>
              <a href="/login">
                <span className="glyphicon glyphicon-log-in" /> Login
              </a>
            </li>
            <li>
              <a href="/register">
                <span className="glyphicon glyphicon-user" /> Sign Up
              </a>
            </li>
          </ul>
        </div>
      </nav>
    );
  }
}

// imports
import React from "react";
import ReactDOM from "react-dom";

export default class NavBar extends React.Component { 
    render() {
        return (<nav className="navbar navbar-inverse bg-inverse navbar-expand-lg">
        <div className="navbar-header">
            <a className="navbar-brand" href="#">Lingvo</a>
        </div>
        <div className="navbar-collapse collapse">
            <ul className="nav navbar-nav">
            <li><a href="#">About</a></li>
            <li><a href="#">Contact</a></li>
            </ul>
            <ul className="nav navbar-nav navbar-right">
            <li><a href="/login"><span className="glyphicon glyphicon-log-in"></span> Login</a></li>
            <li><a href="/register"><span className="glyphicon glyphicon-user"></span> Sign Up</a></li>
            </ul>
        </div>      
    </nav>);    
    }
}
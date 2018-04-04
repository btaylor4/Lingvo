import React from "react";
import NavBar from './nav';

export default class Register extends React.Component {
    render() {
        return (<div><NavBar></NavBar><div className="container">
        <div className="container">
        <div className="jumbotron">
            <h1 className="display-4">Register</h1>
            <form action= "" method="POST">
                <input type="text" placeholder="First Name" name="firstname" />
                <input type="text" placeholder="Username" name="username" /> 
                <input type="password" placeholder="Password" name="password"/> 
                <input className="btn btn-default" type="submit" value="Sign up"/>
              </form>
            <p className="lead">
            <p> Already a user? </p>
                <a className="btn btn-primary btn-lg" href="/login" role="button">Login</a>
            </p>
        </div>
    </div>
    </div>
    </div>)
    }
}
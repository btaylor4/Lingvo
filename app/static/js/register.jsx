import React from "react";
import NavBar from './nav';

export default class Register extends React.Component {
    render() {
        return (<div><NavBar></NavBar><div className="container">
        <div className="container">
        <div className="jumbotron">
            <h1 className="display-4">Register</h1>
            <hr></hr>
            <form action= "" method="POST">
                <input type="text" className="form-control form-group col-sm-3" placeholder="First Name" name="firstname" />
                <input type="text" className="form-control form-group col-sm-3" placeholder="Username" name="username" /> 
                <input type="password" className="form-control form-group col-sm-3" placeholder="Password" name="password"/> 
                <input className="btn btn-primary btn-lg" type="submit" value="Sign up"/>
              </form>
              <hr></hr>
            <p className="lead">
            <p> Already a user? </p>
                <a className="btn btn-secondary" href="/login" role="button">Login</a>
            </p>
        </div>
    </div>
    </div>
    </div>)
    }
}
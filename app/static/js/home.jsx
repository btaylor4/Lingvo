import React from "react";
import NavBar from './nav';

class CallToAction extends React.Component {
    render() {
        return <div className="container">
            <div className="jumbotron">
                <h1 className="display-4">Lingvo</h1>
                <p className="lead">The premier video conferencing app with native language translation built in</p>
                <hr className="my-4"></hr>
                <p>Make calls to foreign business clients or foreign family members and allow each user to speak their native tongue</p>
                <p className="lead">
                    <a className="btn btn-primary btn-lg" href="/register" role="button">Register</a>
                </p>
                <p className="lead">Already a user?
                    <a className="btn btn-primary btn-lg" href="/login" role="button">Login</a>
                </p>
            </div>
        </div>
    }
}

export default class Home extends React.Component {
  render() {
      return <div>
          <NavBar></NavBar>
        <CallToAction></CallToAction>
      </div>
  }
}
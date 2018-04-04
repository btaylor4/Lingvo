import React from 'react';
import ReactDom from 'react-dom';
import { BrowserRouter, browserHistory, Route, Switch } from 'react-router-dom';
import Home from './home'
import Login from './login'
import Register from './register'
import ClientView from './client'

ReactDom.render(
    <BrowserRouter>
        <Switch>
            <Route exact path='/' component={Home} />
            <Route path='/login' component={Login} />
            <Route path='/register' component={Register}/>
            <Route path='/portal-test' component={ClientView}/>
        </Switch>
    </BrowserRouter>,
  document.getElementById('app')
);
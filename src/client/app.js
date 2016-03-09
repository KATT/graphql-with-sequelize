import 'babel-polyfill';

import { browserHistory } from 'react-router';

import {IndexRoute, Route, useRouterHistory} from 'react-router';
import React from 'react';
import ReactDOM from 'react-dom';
import {RelayRouter} from 'react-router-relay';
import PostsContainer from './containers/PostsContainer';
import PostList from './components/PostList';
import PeopleContainer from './containers/PeopleContainer';
import PersonList from './components/PersonList';
import ViewerQueries from './queries/ViewerQueries';

import { Provider } from 'react-redux';
import { combineReducers, compose, createStore, applyMiddleware } from 'redux';
import createHistory from 'history/lib/createBrowserHistory';
const history = useRouterHistory(createHistory)({ queryKey: false });

import reducers from './reducers';
const rootReducer = combineReducers(reducers);

const middlewareStore = applyMiddleware.apply(this, [
  // add middlewares
])(createStore);

const store = compose()(middlewareStore)(rootReducer, window.__INITIAL_STATE__ || {});

ReactDOM.render(
  <Provider store={store}>
    <RelayRouter history={history}>
      <Route
        path="/" component={PostsContainer}>
        <IndexRoute
          component={PostList}
          queries={ViewerQueries}
        />
      </Route>
      <Route
        path="/people" component={PeopleContainer}>
        <IndexRoute
          component={PersonList}
          queries={ViewerQueries}
        />
      </Route>
    </RelayRouter>
  </Provider>,
  document.getElementById('root')
);

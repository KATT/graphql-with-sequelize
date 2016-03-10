import 'babel-polyfill';

import { browserHistory } from 'react-router';

import {IndexRoute, Route, useRouterHistory} from 'react-router';
import React from 'react';
import ReactDOM from 'react-dom';
import {RelayRouter} from 'react-router-relay';
import { Provider } from 'react-redux';
import { combineReducers, compose, createStore, applyMiddleware } from 'redux';
import createHistory from 'history/lib/createBrowserHistory';

const history = useRouterHistory(createHistory)({ queryKey: false });

import reducers from './reducers';
import Root from './containers/Root';
import ViewerQueries from './queries/ViewerQueries';

import PersonViewContainer from './containers/PersonViewContainer';
import PostViewContainer from './containers/PostViewContainer';
import PostsContainer from './containers/PostsContainer';
import PeopleContainer from './containers/PeopleContainer';

import PostList from './components/PostList';
import PersonList from './components/PersonList';

const rootReducer = combineReducers(reducers);

const middlewareStore = applyMiddleware.apply(this, [
  // add middlewares
])(createStore);

const store = compose()(middlewareStore)(rootReducer, window.__INITIAL_STATE__ || {});

ReactDOM.render(
  <Provider store={store}>
    <RelayRouter history={history}>
      <Route name="root" component={Root}>
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
          <Route
            path="/people/:id" 
            component={PersonViewContainer}
            queries={{person: () => Relay.QL`query { node(id: $id) }`}}
            />
        </Route>
        <Route
          path="/posts/:id" 
          component={PostViewContainer}
          queries={{post: () => Relay.QL`query { node(id: $id) }`}}
          />
      </Route>
    </RelayRouter>
  </Provider>,
  document.getElementById('root')
);

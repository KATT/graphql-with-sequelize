import 'babel-polyfill';

import { browserHistory } from 'react-router';

import {IndexRoute, Route} from 'react-router';
import React from 'react';
import ReactDOM from 'react-dom';
import {RelayRouter} from 'react-router-relay';
import PostApp from './components/PostApp';
import PostList from './components/PostList';
import ViewerQueries from './queries/ViewerQueries';

import { Provider } from 'react-redux';
import { combineReducers, compose, createStore, applyMiddleware } from 'redux';
import reducers from './reducers';
const rootReducer = combineReducers(reducers);

const middlewareStore = applyMiddleware.apply(this, [
  // add middlewares
])(createStore);

const store = compose()(middlewareStore)(rootReducer, window.__INITIAL_STATE__ || {});

ReactDOM.render(
  <Provider store={store}>
    <RelayRouter>
      <Route
        path="/" component={PostApp}>
        <IndexRoute
          component={PostList}
          queries={ViewerQueries}
        />
      </Route>
    </RelayRouter>
  </Provider>,
  document.getElementById('root')
);

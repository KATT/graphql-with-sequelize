import 'babel-polyfill';

import { browserHistory } from 'react-router';

import {IndexRoute, Route} from 'react-router';
import React from 'react';
import ReactDOM from 'react-dom';
import {RelayRouter} from 'react-router-relay';
import PostApp from './components/PostApp';
import PostList from './components/PostList';
import ViewerQueries from './queries/ViewerQueries';

ReactDOM.render(
  <RelayRouter>
    <Route
      path="/" component={PostApp}>
      <IndexRoute
        component={PostList}
        queries={ViewerQueries}
        prepareParams={() => ({limit: 2})}
      />
    </Route>
  </RelayRouter>,
  document.getElementById('root')
);

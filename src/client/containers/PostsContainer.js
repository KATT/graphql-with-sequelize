import React from 'react';
import Relay from 'react-relay';
import { connect } from 'react-redux';

import { Link } from 'react-router';

class PostsContainer extends React.Component {
  render() {
    console.log('PostsContainer: ', this.props);
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}
function select(state) {
    return state;
}
export default connect(select)(PostsContainer)

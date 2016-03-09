import React from 'react';
import Relay from 'react-relay';
import { connect } from 'react-redux';

import { Link } from 'react-router';

class PeopleContainer extends React.Component {
  render() {
    console.log('PeopleContainer: ', this.props);
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
export default connect(select)(PeopleContainer)

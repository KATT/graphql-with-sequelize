import React from 'react';
import Relay from 'react-relay';

import { Link } from 'react-router';


import PersonViewPostList from '../components/PersonViewPostList';

class PersonViewContainer extends React.Component {
  render() {
    const {
      person: {
        firstName,
        lastName,
        posts,
      },
    } = this.props;
    console.log('PersonViewContainer: ', this.props);

    return (
      <div>
        <h1>{firstName} {lastName}</h1>

        <PersonViewPostList {...this.props} />
      </div>
    );
  }
}

export default Relay.createContainer(PersonViewContainer, {
  fragments: {
    person: () => Relay.QL`
      fragment on Person {
        firstName
        lastName
        ${PersonViewPostList.getFragment('person')}
      }
    `,
  }
});


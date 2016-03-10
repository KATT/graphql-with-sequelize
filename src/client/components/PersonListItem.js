import React from 'react';
import Relay from 'react-relay';

import { Link } from 'react-router';

class Person extends React.Component {
  render() {
    const {
      person: {
        id,
        firstName,
        lastName,
      }
    } = this.props;
    return (
      <div>
        <Link to={`/people/${id}`}>{firstName} {lastName}</Link>
      </div>
    );
  }
}

export default Relay.createContainer(Person, {
  fragments: {
    person: () => Relay.QL`
      fragment on Person {
        id
        firstName
        lastName
      }
    `,
  },
});
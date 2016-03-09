import React from 'react';
import Relay from 'react-relay';

class Person extends React.Component {
  render() {
    const {
      person: {
        firstName,
        lastName,
      }
    } = this.props;
    return (
      <div>
        {firstName} {lastName}
      </div>
    );
  }
}

export default Relay.createContainer(Person, {
  fragments: {
    person: () => Relay.QL`
      fragment on Person {
        firstName
        lastName
      }
    `,
  },
});
import React from 'react';
import Relay from 'react-relay';

import { Link } from 'react-router';

class PersonViewContainer extends React.Component {
  render() {
    const {
      person: {
        firstName,
        lastName,
        posts,
      }
    } = this.props;
    console.log('PersonViewContainer: ', this.props);

    return (
      <div>
        <h1>{firstName} {lastName}</h1>

        <h2>Posts</h2>
        <ul>
          {posts.edges.map(edge => (
            <li key={edge.node.id}>
              <Link to={`/posts/${edge.node.id}`}>{edge.node.title}</Link>
            </li>
          ))}
        </ul>
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
        posts(first: 100) {
          edges {
            node {
              id
              title
            }
          }
        }
      }
    `,
  }
});


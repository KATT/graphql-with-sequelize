import React from 'react';
import Relay from 'react-relay';

import { Link } from 'react-router';

import LoadMoreButton from './LoadMoreButton';

const initalLimit = 2;

class PersonViewPostList extends React.Component {
  render() {
    const {
      person: {
        firstName,
        posts: {
          count,
          edges,
          pageInfo: {
            hasNextPage
          }
        },
      },
    } = this.props;

    console.log('getPendingTransactions', this.props.relay.getPendingTransactions(this.props.person.posts))

    return (
      <div>
        <h2>{firstName}'s posts</h2>
        <p>Showing {edges.length} out of {count} posts.</p>
        <ul>
          {edges.map(edge => (
            <li key={edge.node.id}>
              <Link to={`/posts/${edge.node.id}`}>{edge.node.title}</Link>
            </li>
          ))}
        </ul>
        {hasNextPage && <LoadMoreButton relay={this.props.relay} variable='limit' increase={initalLimit} />}
      </div>
    );
  }
}

export default Relay.createContainer(PersonViewPostList, {
  initialVariables: {
    limit: initalLimit,
  },

  fragments: {
    person: () => Relay.QL`
      fragment on Person {
        firstName
        posts(first: $limit) {
          count
          edges {
            node {
              id
              title
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `,
  },
});

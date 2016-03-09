import React from 'react';
import Relay from 'react-relay';

import { Link } from 'react-router';

class PostListItem extends React.Component {
  render() {
    const {
      post: {
        id,
        title,
        tagNames,
        person: {
          firstName,
          lastName
        }
      }
    } = this.props;
    return (
      <div>
        <h2><Link to={`/posts/${id}`}>{title}</Link></h2>
        <p><strong>Written by</strong> {firstName} {lastName}</p>
        <p><strong>Tags:</strong> {tagNames.join(', ')}</p>
      </div>
    );
  }
}

export default Relay.createContainer(PostListItem, {
  fragments: {
    post: () => Relay.QL`
      fragment on Post {
        id
        title
        tagNames
        person {
          firstName
          lastName
        }
      }
    `,
  },
});
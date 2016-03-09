import React from 'react';
import Relay from 'react-relay';

class PostListItem extends React.Component {
  render() {
    const {
      post: {
        title,
        content,
        tagNames,
        person: {
          firstName,
          lastName
        }
      }
    } = this.props;
    return (
      <div>
        <h2>{title}</h2>
        <p><strong>Written by</strong> {firstName} {lastName}</p>
        <p><strong>Tags:</strong> {tagNames.join(', ')}</p>
        {content.split('\n').map(chunk => <p>{chunk}</p>)}
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
        content
        person {
          firstName
          lastName
        }
      }
    `,
  },
});
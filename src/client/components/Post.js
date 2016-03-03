import React from 'react';
import Relay from 'react-relay';

class Post extends React.Component {
  render() {
    console.log('Post props', this.props);
    const {
      post: {
        title,
        content,
        tagNames,
      }
    } = this.props;
    return (
      <div>
        <h2>{title}</h2>
        <p><strong>Tags:</strong> {tagNames.join(', ')}</p>
        {content.split('\n').map(chunk => <p>{chunk}</p>)}
      </div>
    );
  }
}

export default Relay.createContainer(Post, {
  fragments: {
    post: () => Relay.QL`
      fragment on Post {
        id,
        title,
        tagNames,
        content
      }
    `,
  },
});
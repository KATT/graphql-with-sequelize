import React from 'react';
import Relay from 'react-relay';

class PostViewContainer extends React.Component {
  render() {
    const {
      post: {
        id,
        title,
        content,
        tags,
        person: {
          firstName,
          lastName
        }
      }
    } = this.props;
    console.log('PostViewContainer: ', this.props);
    
    const tagNames = tags.edges.map(({node}) => node.name).sort();

    return (
      <div>
        <h1>{title}</h1>
        <p><strong>Tags:</strong> {tagNames.join(', ')}</p>

        {content.split('\n').map((chunk, index) => <p key={index}>{chunk}</p>)}
      </div>
    );
  }
}

export default Relay.createContainer(PostViewContainer, {
  fragments: {
    post: () => Relay.QL`
      fragment on Post {
        title
        content
        tags {
          edges {
            node {
              name
            }
          }
        }
        person {
          firstName
          lastName
        }
      }
    `,
  }
});


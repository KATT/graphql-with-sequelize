import React from 'react';
import Relay from 'react-relay';

import {IndexRoute} from 'react-router';

class PostViewContainer extends React.Component {
  render() {
    const {
      post: {
        id,
        title,
        tagNames,
        content,
        person: {
          firstName,
          lastName
        }
      }
    } = this.props;
    console.log('PostViewContainer: ', this.props);

    return (
      <div>
        <h1>{title}</h1>

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
        tagNames
        content
        person {
          firstName
          lastName
        }
      }
    `,
  }
});


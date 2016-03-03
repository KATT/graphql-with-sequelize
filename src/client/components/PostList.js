import React from 'react';
import Relay from 'react-relay';

import Post from './Post';

class PostList extends React.Component {
  state = {
    isLoading: false,
  }

  onScroll = () => {
    const isAtBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight;
    if (!this.state.isLoading && isAtBottom) {
      this.setState({isLoading: true}, () => {
        this.props.relay.setVariables({
          limit: this.props.relay.variables.limit + 5
        }, (readyState) => { 
          // this gets called twice https://goo.gl/ZsQ3Dy
          if (readyState.done) {
            this.setState({isLoading: false});
          }
        });
      });
    }
  }

  componentDidMount() {
    window.addEventListener('scroll', this.onScroll);
  }
  componentDidUnmount() {
    window.removeEventListener('scroll', this.onScroll);
  }

  renderPosts() {
    return this.props.viewer.posts.edges.map(edge =>
      <Post
        key={edge.node.id}
        post={edge.node}
      />
    );
  }
  render() {
    const count = this.props.viewer.posts.count;
    return (
      <section className="main">
        <h1>Posts</h1>
        <p><strong>Total number of posts in DB:</strong> {count}</p>
        <ul className="post-list">
          {this.renderPosts()}
        </ul>
        {this.state.isLoading && <p>Loading more posts..</p>}
      </section>
    );
  }
}

export default Relay.createContainer(PostList, {
  initialVariables: {
    limit: 2,
  },

  fragments: {
    viewer: () => Relay.QL`
      fragment on viewer {
        posts(first: $limit) {
          count
          edges {
            node {
              id,
              ${Post.getFragment('post')},
            },
          },
        }
      }
    `,
  },
});

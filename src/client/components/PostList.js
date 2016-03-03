import React from 'react';
import Relay from 'react-relay';

import Post from './Post';

const initalLimit = 10;

class PostList extends React.Component {
  state = {
    isLoading: false,
  }

  onScroll = () => {
    const isAtBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight;
    if (!this.state.isLoading && isAtBottom) {
      this.setState({isLoading: true}, () => {
        this.props.relay.setVariables({
          limit: this.props.relay.variables.limit + initalLimit
        }, (readyState) => { 
          // this gets called twice https://goo.gl/ZsQ3Dy
          if (readyState.done) {
            this.setState({isLoading: false});
          }
        });
      });
    }
  }

  onSearchTitleKeyUp = (e) => {
    const {value} = e.target;
    const where = {};
    const limit = initalLimit;
    if (e.target.value) {
      where.title = {
        iLike: value
      };
    }

    this.setState({isLoading: true});
    this.props.relay.setVariables({
      limit,
      where,
    }, (readyState) => { 
      // this gets called twice https://goo.gl/ZsQ3Dy
      if (readyState.done) {
        this.setState({isLoading: false});
      }
    });
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
        <p>
          <label>Search through the titles: <input onKeyUp={this.onSearchTitleKeyUp} /></label>
        </p>
        {this.state.isLoading && <p>Loading..</p>}
        <p>Showing <strong>{this.props.relay.variables.limit}</strong> of the total <strong>{count}</strong> matches.</p>
        <ul className="post-list">
          {this.renderPosts()}
        </ul>
        {this.state.isLoading && <p>Loading posts..</p>}
      </section>
    );
  }
}

export default Relay.createContainer(PostList, {
  initialVariables: {
    limit: initalLimit,
    where: {},
  },

  fragments: {
    viewer: () => Relay.QL`
      fragment on viewer {
        posts(first: $limit where: $where) {
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

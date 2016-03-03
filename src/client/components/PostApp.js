import React from 'react';
import Relay from 'react-relay';

class PostApp extends React.Component {
  render() {
    return (
      <div>
        <section className="postapp">
          <header className="header">
            <h1>
              posts
            </h1>
          </header>

          {this.props.children}

        </section>
        <footer className="info">

        </footer>
      </div>
    );
  }
}

export default PostApp

import React from 'react';
import Relay from 'react-relay';
import { connect } from 'react-redux';

class PostApp extends React.Component {
  render() {
    console.log('PostApp: ', this.props);
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
function select(state) {
    return state;
}
export default connect(select)(PostApp)

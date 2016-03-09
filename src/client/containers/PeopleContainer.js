import React from 'react';
import Relay from 'react-relay';
import { connect } from 'react-redux';

import { Link } from 'react-router';

class PeopleContainer extends React.Component {
  render() {
    console.log('PeopleContainer: ', this.props);
    return (
      <div>
        <Link to='/'>Posts</Link>
        <section className="peopleapp">
          <header className="header">
            <h1>
              people
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
export default connect(select)(PeopleContainer)

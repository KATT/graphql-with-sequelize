import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';


class Root extends Component {
    render() {
        return (
            <div>
                <header>
                    <ul>
                      <li><Link to='/'>Posts</Link></li>
                      <li><Link to='/people'>People</Link></li>
                    </ul>
                </header>

                {this.props.children}

            </div>
        );
    }
}


export default Root;

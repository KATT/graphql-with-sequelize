import React, { PropTypes, Component } from 'react';
import Relay from 'react-relay';

import { Link } from 'react-router';


class LoadMoreButton extends React.Component {
  state = {
    isLoading: false,
  };

  static propTypes = {
    relay: PropTypes.object.isRequired,
    variable: PropTypes.string.isRequired,
    increase: PropTypes.number.isRequired,
  };

  loadMore = () => {
    const {
      relay,
      increase,
      variable,
    } = this.props;

    this.setState({isLoading: true});

    this.props.relay.setVariables({
      limit: relay.variables[variable] + increase,
    }, (readyState) => { 
      // this gets called twice https://goo.gl/ZsQ3Dy
      if (readyState.done) {
        this.setState({isLoading: false});
      }
    });
  }

  render() {
    const text = (this.state.isLoading ? 'Loading..' : 'Load more..');

    return <button onClick={this.loadMore}>{text}</button>;
  }
}

export default LoadMoreButton;

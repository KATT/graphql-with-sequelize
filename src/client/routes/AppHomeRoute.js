import Relay from 'react-relay';

export default class extends Relay.Route {
  static queries = {
    posts: () => Relay.QL`query { 
    	viewer
    }`,
  };
  static routeName = 'AppHomeRoute';
}
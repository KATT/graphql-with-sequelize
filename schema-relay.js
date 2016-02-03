import Db from './db';

import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList
} from 'graphql';

import {
  nodeDefinitions,
  fromGlobalId,
  globalIdField,
  connectionArgs,
  connectionDefinitions,
  connectionFromPromisedArray,
  connectionFromArraySlice
} from 'graphql-relay';

const Post = new GraphQLObjectType({
  name: 'Post',
  description: 'Blog post',
  fields () {
    return {
      title: {
        type: GraphQLString,
        resolve (post) {
          return post.title;
        }
      },
      content: {
        type: GraphQLString,
        resolve (post) {
          return post.content;
        }
      },
      person: {
        type: personType,
        resolve (post) {
          return post.getPerson();
        }
      }
    };
  }
});

const { nodeInterface, nodeField } = nodeDefinitions(
  globalId => {
    const { type, id } = fromGlobalId(globalId);

    console.log('type=', type);
    console.log('id=', id);

    if (type === 'Person') {
      return Db.models.person.findById(id);
    }
    return null;
  },
  obj => {
    return personType;
  }
);

const personType = new GraphQLObjectType({
  name: 'Person',
  description: 'This represents a Person',
  fields: () => {
    return {
      id: globalIdField('Person'),
      firstName: {
        type: GraphQLString,
        resolve (person) {
          return person.firstName;
        }
      },
      lastName: {
        type: GraphQLString,
        resolve (person) {
          return person.lastName;
        }
      },
      email: {
        type: GraphQLString,
        resolve (person) {
          return person.email;
        }
      },
      posts: {
        type: new GraphQLList(Post),
        resolve (person) {
          return person.getPosts();
        }
      }
    };
  },
  interfaces: [nodeInterface]
});

// Connections
const { connectionType: PersonConnection } = connectionDefinitions({
  name: 'Person',
  nodeType: personType
});

const queryType = new GraphQLObjectType({
  name: 'Query',
  description: 'Root query',
  fields: () => ({
    node: nodeField,
    peopleRelay: {
      type: PersonConnection,
      description: 'Person connection test',
      args: connectionArgs,
      async resolve (root, args) {
        const {first, after} = args;

        const query = {
          offset: 0
        };
        if (first) {
          query.limit = first;
        }

        if (after) {
          const decoded = new Buffer(after, 'base64').toString();
          const [arrayconnection, offset] = decoded.split(':');
          query.offset = parseInt(offset, 10) + 1;
        }


        const {count, rows} = await Db.models.person.findAndCountAll(query);
        const meta = {
          sliceStart: query.offset,
          arrayLength: count
        };

        return connectionFromArraySlice(rows, args, meta);
      }
    },
    person: {
       type: personType,
       resolve (root, args) {
         return Db.models.person.findOne({ where: args });
       }
     },
    people: {
       type: new GraphQLList(personType),
       args: {
         id: {
           type: GraphQLInt
         },
         email: {
           type: GraphQLString
         }
       },
       resolve (root, args) {
         return Db.models.person.findAll({ where: args });
       }
     }
  })
});

export default new GraphQLSchema({
  query: queryType
});

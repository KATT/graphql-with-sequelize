import Db from './db';

import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLInputObjectType
} from 'graphql';


import {badValueMessage} from 'graphql/validation/rules/ArgumentsOfCorrectType';

import {
  nodeDefinitions,
  fromGlobalId,
  globalIdField,
  connectionArgs,
  connectionFromArray,
  connectionFromPromisedArray,
  connectionFromArraySlice
} from 'graphql-relay';


import {
  connectionDefinitionWithCount,
  getRelayQueryParams,
  operatorsFieldInput,
  getSelectedFieldsFromResolveInfo,
  connectionFromDBMeta,
  getAttributesList
} from './lib/relay-sequelize';

const { nodeInterface, nodeField } = nodeDefinitions(
  globalId => {
    const { type, id } = fromGlobalId(globalId);

    console.log('type=', type);
    console.log('id=', id);

    const map = {
      Person: () => Db.models.person.findById(id),
      Post  : () => Db.models.post.findById(id),
    };

    const fn = map[type];
    if (fn) {
      return fn();
    }

    return null;
  },
  obj => {
    const map = {
      person: Person,
      post  : Post,
    };
    const typeName = obj.$modelOptions.name.singular;
    
    return map[typeName] || null;
  }
);

const Post = new GraphQLObjectType({
  name: 'Post',
  description: 'Blog post',
  fields () {
    return {
      id: globalIdField('Post'),
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
        type: Person,
        resolve (post) {
          return post.getPerson();
        }
      }
    };
  },
  interfaces: [nodeInterface]
});

// GraphQL Object Type definitions
const Person = new GraphQLObjectType({
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
      age: {
        type: GraphQLInt,
        resolve (person) {
          return person.age;
        }
      },
      posts: {
        type: postConnection,
        description: 'Posts by the person',
        args: connectionArgs,
        async resolve (person, args) {
          const posts = await person.getPosts();
          const count = posts.length;

          const connection = connectionFromArray(posts, args);

          const connectionWithCount = {...connection, count};

          return connectionWithCount;
        }
      }
    };
  },
  interfaces: [nodeInterface]
});

// Connections
const { connectionType: personConnection } = connectionDefinitionWithCount({
  name: 'Person',
  nodeType: Person,
});

const { connectionType: postConnection } = connectionDefinitionWithCount({
  name: 'Post',
  nodeType: Post,
});

const PostWhereInput = new GraphQLInputObjectType({
  name: 'PostWhereInput',
  fields: () => ({
    title: operatorsFieldInput(GraphQLString),
    content: operatorsFieldInput(GraphQLString),
  })
});

const PersonWhereInput = new GraphQLInputObjectType({
  name: 'PersonWhereInput',
  fields: () => ({
    firstName: operatorsFieldInput(GraphQLString),
    lastName: operatorsFieldInput(GraphQLString),
    age: operatorsFieldInput(GraphQLInt),
    _and: {
      type: PersonWhereInput,
    },
    _or: {
      type: new GraphQLList(PersonWhereInput),
    },
  })
});


const queryType = new GraphQLObjectType({
  name: 'Query',
  description: 'Root query',
  fields: () => ({
    node: nodeField,
    people: {
      type: personConnection,
      description: 'Person connection test',
      args: {
        where: {
          type: PersonWhereInput,
        },
        wherePost: {
          type: PostWhereInput
        },
        ...connectionArgs, 
      },
      async resolve (source, args, info) {
        const include = [
          {
            model: Db.models.post,
            key  : 'wherePost',
          }
        ];
        const query = getRelayQueryParams(args, include);

        const fields = getSelectedFieldsFromResolveInfo(info);

        const whitelist = ['firstName', 'lastName', 'email', 'age'];

        query.attributes = getAttributesList(fields, whitelist);

        const {count, rows} = await Db.models.person.findAndCountAll(query);

        return connectionFromDBMeta({
          args,
          count,
          rows,
          offset: query.offset,
        });
      }
    },
    posts: {
      type: postConnection,
      description: 'Post connection test',
      args: {
        where: {
          type: PostWhereInput,
        },
        ...connectionArgs, 
      },
      async resolve (source, args, info) {
        const query = getRelayQueryParams(args);

        const fields = getSelectedFieldsFromResolveInfo(info);

        const whitelist = ['title', 'content'];
        const always = ['id', 'personId'];
        query.attributes = getAttributesList(fields, whitelist, always);

        const {count, rows} = await Db.models.post.findAndCountAll(query);
        
        return connectionFromDBMeta({
          args,
          count,
          rows,
          offset: query.offset,
        });
      }
    },
    personNoRelay: {
      type: Person,
      resolve (source, args) {
       return Db.models.person.findOne({ where: args });
      }
    },
    postNoRelay: {
      type: Post,
      args: {
       id: {
         type: GraphQLString
       },
      },
      resolve (source, args) {
        const where = {};
        if (args.id) {
          const {type, id} = fromGlobalId(args.id);
          where.id = id;
        }


        return Db.models.post.findOne({ where });
      }
    },
    peopleNoRelay: {
      type: new GraphQLList(Person),
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

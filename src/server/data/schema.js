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
  connectionArgs
} from 'graphql-relay';


import {
  connectionWithCountDefinition,
  getRelayQueryParams,
  operatorsFieldInput,
  getSelectedFieldsFromResolveInfo,
  connectionFromDBMeta,
  getAttributesList,
  connectionWithCountFromPromisedArray,
  createResolveFunction
} from './lib/relay-sequelize';

const { nodeInterface, nodeField } = nodeDefinitions(
  globalId => {
    const { type, id } = fromGlobalId(globalId);

    console.log('type=', type);
    console.log('id=', id);

    const map = {
      Person: () => Db.models.person.findById(id),
      Post  : () => Db.models.post.findById(id),
      Tag   : () => Db.models.tag.findById(id),
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
      tag   : Tag,
    };
    const typeName = obj.$modelOptions.name.singular;
    
    return map[typeName] || null;
  }
);

// GraphQL Object Type definitions
const Post = new GraphQLObjectType({
  name: 'Post',
  description: 'Blog post',
  fields () {
    return {
      id: globalIdField('Post'),
      title: {
        type: GraphQLString,
        resolve: ({title}) => title,
      },
      content: {
        type: GraphQLString,
        resolve: ({content}) => content,
      },
      person: {
        type: Person,
        resolve (post) {
          return post.getPerson();
        }
      },
      tags: {
        type: tagConnection,
        description: 'Tags on the post',
        args: connectionArgs,
        resolve (post, args) {
          return connectionWithCountFromPromisedArray(post.getTags(), args);
        }
      },
      tagNames: {
        type: new GraphQLList(GraphQLString),
        description: 'All tag names on the post as simple array',
        args: connectionArgs,
        async resolve (post, args) {
          const tags = await post.getTags();
          return tags.map(({name}) => name);
        }
      },
    };
  },
  interfaces: [nodeInterface]
});

const Tag = new GraphQLObjectType({
  name: 'Tag',
  fields () {
    return {
      id: globalIdField('Tag'),
      name: {
        type: GraphQLString,
        resolve: ({name}) => name,
      },
    };
  },
  interfaces: [nodeInterface]
});

const Person = new GraphQLObjectType({
  name: 'Person',
  description: 'This represents a Person',
  fields: () => {
    return {
      id: globalIdField('Person'),
      firstName: {
        type: GraphQLString,
        resolve: ({firstName}) => firstName
      },
      lastName: {
        type: GraphQLString,
        resolve: ({lastName}) => lastName
      },
      email: {
        type: GraphQLString,
        resolve: ({email}) => email
      },
      age: {
        type: GraphQLInt,
        resolve: ({age}) => age
      },
      posts: {
        type: postConnection,
        description: 'Posts by the person',
        args: connectionArgs,
        resolve (person, args) {
          return connectionWithCountFromPromisedArray(person.getPosts(), args);
        }
      }
    };
  },
  interfaces: [nodeInterface]
});

// Connections
const { connectionType: personConnection } = connectionWithCountDefinition({
  name: 'Person',
  nodeType: Person,
});

const { connectionType: postConnection } = connectionWithCountDefinition({
  name: 'Post',
  nodeType: Post,
});

const { connectionType: tagConnection } = connectionWithCountDefinition({
  name: 'Tag',
  nodeType: Tag,
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
    firstName: operatorsFieldInput(GraphQLString, ['eq']),
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
      resolve: createResolveFunction({
        model: Db.models.person,
        whitelist: ['firstName', 'lastName', 'email', 'age'],
        always: ['id'],
      }),
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
      resolve: createResolveFunction({
        model: Db.models.post,
        whitelist: ['title', 'content'],
        always: ['id', 'personId'],
      })
    }
  })
});

export const schema = new GraphQLSchema({
  query: queryType
});

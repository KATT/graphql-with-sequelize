import Db from './db';

import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLBoolean,
} from 'graphql';

import {
  nodeDefinitions,
  fromGlobalId,
  globalIdField,
  connectionArgs
} from 'graphql-relay';

import grapqlSequelize, {resolver} from 'graphql-sequelize';

const {sequelizeConnection, sequelizeNodeInterface} = grapqlSequelize.relay;

import sequelize from './db';

const {
  nodeInterface,
  nodeField,
  nodeTypeMapper
} = sequelizeNodeInterface(sequelize);

const {
  Person,
  Post,
  Tag,
} = sequelize.models;



const postType = new GraphQLObjectType({
  name: Post.name,
  fields: () => ({
    id: globalIdField(Post.name),
    title: { type: GraphQLString },
    tags: {
      type: postTagConnection.connectionType,
      args: postTagConnection.connectionArgs,
      resolve: postTagConnection.resolve,
    }
  })
});

const tagType = new GraphQLObjectType({
  name: Tag.name,
  fields: {
    id: globalIdField(Tag.name),
    name: { type: GraphQLString },
  }
});

const personPostConnection = sequelizeConnection({
  name: 'PersonPost',
  nodeType: postType,
  target: Person.Posts,
  connectionFields: {
    total: {
      type: GraphQLInt,
      resolve: ({source}) => {
        /*
         * We return a object containing the source, edges and more as the connection result
         * You there for need to extract source from the usual source argument
         */
        return source.countPosts();
      }
    }
  },
  edgeFields: {
    wasCreatedByPerson: {
      type: GraphQLBoolean,
      resolve: (edge) => {
        /*
         * We attach the connection source to edges
         */
        return edge.node.createdBy === edge.source.id;
      }
    }
  }
});

const postTagConnection = sequelizeConnection({
  name: 'PostTag',
  nodeType: tagType,
  target: Post.Tags,
  connectionFields: {
    total: {
      type: GraphQLInt,
      resolve: ({source}) => {
        /*
         * We return a object containing the source, edges and more as the connection result
         * You there for need to extract source from the usual source argument
         */
        return source.countTags();
      }
    }
  },
  edgeFields: {
    wasCreatedByPerson: {
      type: GraphQLBoolean,
      resolve: (edge) => {
        /*
         * We attach the connection source to edges
         */
        return edge.node.createdBy === edge.source.id;
      }
    }
  }
});


const personType = new GraphQLObjectType({
  name: Person.name,
  fields: {
    id: globalIdField(Person.name),
    firstName: {type: GraphQLString },
    lastName : {type: GraphQLString },
    posts: {
      type: personPostConnection.connectionType,
      args: personPostConnection.connectionArgs,
      resolve: personPostConnection.resolve
    }
  }
});


const peopleConnection = sequelizeConnection({
  name: 'People',
  nodeType: personType,
  target: Person,
});


nodeTypeMapper.mapTypes({
  [Person.name]: personType,
  [Post.name]: postType,
});

const queryType = new GraphQLObjectType({
  name: 'RootType',
  fields: {
    person: {
      type: personType,
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLInt)
        },
      },
      resolve: resolver(Person)
    },
    people: {
      type: peopleConnection.connectionType,
      args: {
        ...peopleConnection.connectionArgs,
      },
      resolve: peopleConnection.resolve
    },
    node: nodeField
  }
});

export const schema = new GraphQLSchema({
  query: queryType
});

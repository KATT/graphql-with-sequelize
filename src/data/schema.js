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

import {
  getConditionsFromWhereArg,
  operatorsFieldInput,
} from './lib/graphql-sequelize-helpers';

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
    content: { type: GraphQLString },
    tags: {
      type: postTagConnection.connectionType,
      args: {},
      resolve: postTagConnection.resolve,
    },
    tagNames: {
      type: new GraphQLList(GraphQLString),
      args: {},
      async resolve (source) {
        const tags = await source.getTags();
        return tags.map(({name}) => name);
      }
    },
    person: {
      type: personType,
      args: {},
      resolve: resolver(Post.Person),
    },
  }),
  interfaces: [nodeInterface],
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
    count: {
      type: GraphQLInt,
      resolve: ({source}) => source.countPosts(),
    }
  },
});

const personType = new GraphQLObjectType({
  name: Person.name,
  fields: {
    id: globalIdField(Person.name),
    firstName: {type: GraphQLString },
    lastName : {type: GraphQLString },
    email    : {type: GraphQLString },
    age      : {type: GraphQLInt },
    posts: {
      type: personPostConnection.connectionType,
      args: personPostConnection.connectionArgs,
      resolve: personPostConnection.resolve
    }
  },
  interfaces: [nodeInterface],
});

const postPersonConnection = sequelizeConnection({
  name: 'PostPerson',
  nodeType: personType,
  target: Post.Person,
});

const postTagConnection = sequelizeConnection({
  name: 'PostTag',
  nodeType: tagType,
  target: Post.Tags,
  connectionFields: {
    count: {
      type: GraphQLInt,
      resolve: ({source}) => source.countTags(),
    }
  },
});


const peopleConnection = sequelizeConnection({
  name: 'People',
  nodeType: personType,
  target: Person,
  orderBy: new GraphQLEnumType({
    name: 'PeopleConnectionOrder',
    values: {
      firstNameASC: {value: ['firstName', 'ASC']},
      firstNameDESC: {value: ['firstName', 'DESC']},
      lastNameASC: {value: ['lastName', 'ASC']},
      lastNameDESC: {value: ['lastName', 'DESC']},
      ageASC: {value: ['age', 'ASC']},
      ageDESC: {value:  ['age', 'DESC']}
    }
  }),
  where(key, value) {
    if (key === "where") {
      return getConditionsFromWhereArg(value);
    }
  },
  connectionFields: {
    count: { 
      type: GraphQLInt, 
      resolve: () => -1,
    }
  },
  interfaces: [nodeInterface],
});


const postsConnection = sequelizeConnection({
  name: 'Posts',
  nodeType: postType,
  target: Post,
  where(key, value) {
    if (key === "where") {
      return getConditionsFromWhereArg(value);
    }
  },
  connectionFields: {
    count: { 
      type: GraphQLInt, 
      resolve: () => -1,
    }
  }
});

const PersonWhereInput = new GraphQLInputObjectType({
  name: 'PersonWhereInput',
  fields: () => ({
    firstName: operatorsFieldInput(GraphQLString, ['eq', 'iLike']),
    lastName: operatorsFieldInput(GraphQLString, ['eq', 'iLike']),
    _and: {
      type: PersonWhereInput,
    },
    _or: {
      type: new GraphQLList(PersonWhereInput),
    },
  })
});

const PostWhereInput = new GraphQLInputObjectType({
  name: 'PostWhereInput',
  fields: () => ({
    title: operatorsFieldInput(GraphQLString, ['eq', 'iLike']),
  })
});

const viewerType = new GraphQLObjectType({
  name: 'Viewer',
  description: 'root viewer for queries',
  fields: () => ({
    id: globalIdField('Viewer'),
    people: {
      type: peopleConnection.connectionType,
      args: {
        ...peopleConnection.connectionArgs,
        where: { type: PersonWhereInput },
      },
      resolve: peopleConnection.resolve
    },
    posts: {
      type: postsConnection.connectionType,
      args: {
        ...postsConnection.connectionArgs,
        where: { type: PostWhereInput },
      },
      resolve: postsConnection.resolve
    },
  }),
  interfaces: [nodeInterface],
});


nodeTypeMapper.mapTypes({
  [Person.name]: personType,
  [Post.name]: postType,
  Viewer: viewerType,
});



const queryType = new GraphQLObjectType({
  name: 'RootType',
  fields: {
    viewer: {
      type: viewerType,
      resolve: () => ({
        id: 1
      })
    },
    node: nodeField,
  },
});

export const schema = new GraphQLSchema({
  query: queryType
});

import Db from './db';

import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLError
} from 'graphql';


import {badValueMessage} from 'graphql/validation/rules/ArgumentsOfCorrectType';

import {
  nodeDefinitions,
  fromGlobalId,
  globalIdField,
  cursorToOffset,
  connectionArgs,
  connectionDefinitions,
  connectionFromArray,
  connectionFromPromisedArray,
  connectionFromArraySlice
} from 'graphql-relay';

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

// Helpers
function connectionDefinitionWithCount(opts) {
  const {connectionFields, ...other} = opts;


  const newConnectionFields = Object.assign({}, connectionFields, {
    count: {
      type: GraphQLInt,
      resolve: ({count}) => count,
      description: 'A count of the total number of objects in this connection'
    }
  });

  return connectionDefinitions({...other, connectionFields: newConnectionFields});
}

function getConditionsForField(fieldName, args) {
  if (args.hasOwnProperty('eq')) {
    return args.eq;
  }

  const conditions = {};
  for (const operatorName in args) {
    const value = args[operatorName];
    
    conditions['$' + operatorName] = value;
  }

  return conditions;
}

function getConditionsFromWhereArg(args) {
  const where = {};
  if (!args) {
    return where;
  }

  for (const key in args) {
    const conditions = args[key];

    if (key === '_and') {
      where.$and = getConditionsFromWhereArg(conditions);
    } else if (key === '_or') {
      where.$or = conditions.map(condition => getConditionsFromWhereArg(condition));
    } else {
      where[key] = getConditionsForField(key, conditions);
    }
  }

  return where;
}

function cursorToArrayOffset(cursor, fieldName) {
  if (!cursor) {
    return 0;
  }

  const offset = cursorToOffset(cursor);

  if (isNaN(offset) || offset < 0) {
    throw new GraphQLError(badValueMessage(fieldName, GraphQLString, cursor));
  }

  return offset + 1;
}

function validateOnlyOneTruthy(args) {
  let truthy = false;


  Object.values(args).forEach(value => {
    if (value) {
      if (truthy) {
        const keys = Object.keys(args);
        throw new GraphQLError(`You can only use one of arguments: ${keys.join(', ')}.`);
      }
      truthy = true;
    }
  });
}

function validateUnsupportedArg(args, fieldName) {
  if (args.hasOwnProperty(fieldName)) {
    throw new Error(`Argument '${fieldName}' is currently unsupported.`);
  }
}

function getLimit({first, last}) {
  if (!first || !last) {
    return 0;
  }
  validateOnlyOneTruthy({first, last});

  // TODO support `last`

  return first || last;
}

function getOffset({before, after}) {
  validateOnlyOneTruthy({before, after})
  
  // TODO support `after`

  return cursorToArrayOffset(after, 'after');
}

function getRelayQueryParams(args) {
  validateUnsupportedArg(args, 'before');
  validateUnsupportedArg(args, 'last');

  const query = {};

  query.limit = getLimit(args);
  query.offset = getOffset(args);
  query.where = getConditionsFromWhereArg(args.where);

  console.log('getRelayQueryParams query', query);

  return query;
}

function getWhereInputFields(inputType) {
  // http://docs.sequelizejs.com/en/latest/docs/querying/#operators
  // TODO suport more types
  const all = {
    eq: {
      type: inputType,
    },
    ne: {
      type: inputType,
    },
    in: {
      type: new GraphQLList(inputType),
    },
    notIn: {
      type: new GraphQLList(inputType),
    },
  };

  const map = {
    'Int': () => ({
      ...all,
      lt: {
        type: inputType,
      },
      gt: {
        type: inputType,
      },
      gte: {
        type: inputType,
      },
      between: {
        type: new GraphQLList(inputType),
      },
      notBetween: {
        type: new GraphQLList(inputType),
      }
    }),
    'String': () => ({
      ...all,
      like: {
        type: inputType,
      },
      iLike: {
        type: inputType,
      },
      notLike: {
        type: inputType,
      },
      notILike: {
        type: inputType,
      }
    })
  };

  return map[inputType.name]();
}

const operatorsInputType = (function () {
  const operatorTypes = {};

  return (inputType) => {
    const name = `Operators${inputType.name}Input`;

    if (!operatorTypes[name]) {
      const fields = getWhereInputFields(inputType);

      operatorTypes[name] = new GraphQLInputObjectType({
        name,
        fields,
      });
    }

    return operatorTypes[name];
  };
}());

const operatorsFieldInput = function(inputType) {
  return {
    type: operatorsInputType(inputType),
  };
}

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

function getSelectedFieldsFromSelection(selection, path = []) {
  const fields = new Set();

  const {selectionSet} = selection;

  if (selectionSet && selectionSet.selections.length > 0) {
    selectionSet.selections.forEach(sub => {
      fields.add([...path, sub.name.value].join('.'));

      const newFields = getSelectedFieldsFromSelection(sub, [...path, sub.name.value]);

      newFields.forEach(field => fields.add(field));
    });
  } else {
    fields.add(path.join('.'));
  }

  return fields;
}

function getSelectedFieldsFromResolveInfo({fieldASTs}) {
  const fields = new Set();

  fieldASTs.forEach(selection => {
    const newFields = getSelectedFieldsFromSelection(selection);

    newFields.forEach(field => fields.add(field));
  });

  return Array.from(fields);
}

function connectionFromDBMeta({args, offset, count, rows}) {
    const meta = {
      sliceStart: offset,
      arrayLength: count
    };

    const connection = connectionFromArraySlice(rows, args, meta);

    const connectionWithCount = {...connection, count};

    return connectionWithCount;
}

function getAttributesList(fields, whitelist, always = ['id']) {
  const attributes = fields
    .filter(field => field.startsWith('edges.node.'))
    .map(field => field.replace('edges.node.', ''))
    .filter(field => whitelist.includes(field))
    ;

  return [...always, ...attributes];
}

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
        ...connectionArgs, 
      },
      async resolve (source, args, info) {
        const query = getRelayQueryParams(args);

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

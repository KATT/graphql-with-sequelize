import Db from './db';

import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLInputObjectType
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

const postType = new GraphQLObjectType({
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
      age: {
        type: GraphQLInt,
        resolve (person) {
          return person.age;
        }
      },
      posts: {
        type: new GraphQLList(postType),
        resolve (person) {
          return person.getPosts();
        }
      }
    };
  },
  interfaces: [nodeInterface]
});

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

// Connections
const { connectionType: PersonConnection } = connectionDefinitionWithCount({
  name: 'Person',
  nodeType: personType,
});

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

  for (const fieldName in args) {
    const conditions = args[fieldName];

    where[fieldName] = getConditionsForField(fieldName, conditions);
  }

  return where;
}

function getRelayQueryParams(args) {
  const {first, after, where} = args;

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

  if (where) {
    query.where = getConditionsFromWhereArg(where);
  }

  console.log('getRelayQueryParams query', query);

  return query;
}

const whereOperatorInputType = (function () {
  const operatorTypes = {};

  return (inputType) => {
    const name = `WhereOperatorInputType_${inputType.name}`;

    if (!operatorTypes[name]) {
      operatorTypes[name] = new GraphQLInputObjectType({
        name,
        // http://docs.sequelizejs.com/en/latest/docs/querying/#operators
        fields: {
          eq: {
            type: inputType,
          },
          ne: {
            type: inputType,
          },
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
          },
          in: {
            type: new GraphQLList(inputType),
          },
          notIn: {
            type: new GraphQLList(inputType),
          },
          overlap: {
            type: new GraphQLList(inputType),
          },
          contained: {
            type: new GraphQLList(inputType),
          },
          contains: {
            type: new GraphQLList(inputType),
          },
          any: {
            type: new GraphQLList(inputType),
          },
        }
      });
    }

    return operatorTypes[name];
  };
}());

const PersonWhereInputType = new GraphQLInputObjectType({
  name: 'PersonWhereInputType',
  fields: {
    firstName: {
      type: whereOperatorInputType(GraphQLString),
    },
    lastName: {
      type: whereOperatorInputType(GraphQLString),
    },
    age: {
      type: whereOperatorInputType(GraphQLInt),
    },
  }
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

const queryType = new GraphQLObjectType({
  name: 'Query',
  description: 'Root query',
  fields: () => ({
    node: nodeField,
    peopleRelay: {
      type: PersonConnection,
      description: 'Person connection test',
      args: {
        where: {
          type: PersonWhereInputType,
        },  
        ...connectionArgs, 
      },
      async resolve (source, args, info) {
        const query = getRelayQueryParams(args);

        const fields = getSelectedFieldsFromResolveInfo(info);

        const whitelist = ['firstName', 'lastName', 'email', 'age'];
        const attributes = fields
          .filter(field => field.startsWith('edges.node.'))
          .map(field => field.replace('edges.node.', ''))
          .filter(field => whitelist.includes(field))
          ;

        query.attributes = ['id', ...attributes];

        const {count, rows} = await Db.models.person.findAndCountAll(query);
        const meta = {
          sliceStart: query.offset,
          arrayLength: count
        };

        const connection = connectionFromArraySlice(rows, args, meta);

        const connectionWithCount = {...connection, count};

        return connectionWithCount;
      }
    },
    person: {
       type: personType,
       resolve (source, args) {
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

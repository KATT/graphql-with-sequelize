import {
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLError
} from 'graphql';


import {badValueMessage} from 'graphql/validation/rules/ArgumentsOfCorrectType';

import {
  cursorToOffset,
  connectionDefinitions,
  connectionFromArraySlice
} from 'graphql-relay';

export function connectionDefinitionWithCount(opts) {
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


export function getConditionsForField(fieldName, args) {
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

export function getConditionsFromWhereArg(args) {
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

export function cursorToArrayOffset(cursor, fieldName) {
  if (!cursor) {
    return 0;
  }

  const offset = cursorToOffset(cursor);

  if (isNaN(offset) || offset < 0) {
    throw new GraphQLError(badValueMessage(fieldName, GraphQLString, cursor));
  }

  return offset + 1;
}

export function validateOnlyOneTruthy(args) {
  let previousTruthy = false;

  Object.values(args).forEach(value => {
    if (value) {
      if (previousTruthy) {
        const keys = Object.keys(args);
        throw new GraphQLError(`You can only use one of arguments: ${keys.join(', ')}.`);
      }
      previousTruthy = true;
    }
  });
}

export function validateUnsupportedArg(args, fieldName) {
  if (args.hasOwnProperty(fieldName)) {
    throw new Error(`Argument '${fieldName}' is currently unsupported.`);
  }
}

export function getLimit({first, last}) {
  if (!first || !last) {
    return 0;
  }
  validateOnlyOneTruthy({first, last});

  // TODO support `last`

  return first || last;
}

export function getOffset({before, after}) {
  validateOnlyOneTruthy({before, after})
  
  // TODO support `after`

  return cursorToArrayOffset(after, 'after');
}

export function getInclude(args, includeList) {
  const include = [];
  includeList.forEach((opts) => {
    const {key, ...other} = opts;
    if (args.hasOwnProperty(key)) {
      const where = getConditionsFromWhereArg(args[key]);
      const attributes = [];
      include.push({
        where,
        attributes,
        ...other,
      });
    }
  });

  return include;
}

export function getRelayQueryParams(args, include = []) {
  validateUnsupportedArg(args, 'before');
  validateUnsupportedArg(args, 'last');

  const query = {};

  query.limit = getLimit(args);
  query.offset = getOffset(args);
  query.where = getConditionsFromWhereArg(args.where);
  query.include = getInclude(args, include);

  console.log('getRelayQueryParams query', query);

  return query;
}

export function getWhereInputFields(inputType) {
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
      lte: {
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


export const operatorsInputType = (function () {
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

export const operatorsFieldInput = function(inputType) {
  return {
    type: operatorsInputType(inputType),
  };
};


export function getSelectedFieldsFromResolveInfo({fieldASTs}) {
  const fields = new Set();

  fieldASTs.forEach(selection => {
    const newFields = getSelectedFieldsFromSelection(selection);

    newFields.forEach(field => fields.add(field));
  });

  return Array.from(fields);
}

export function connectionFromDBMeta({args, offset, count, rows}) {
    const meta = {
      sliceStart: offset,
      arrayLength: count
    };

    const connection = connectionFromArraySlice(rows, args, meta);

    const connectionWithCount = {...connection, count};

    return connectionWithCount;
}

export function getAttributesList(fields, whitelist, always = ['id']) {
  const attributes = fields
    .filter(field => field.startsWith('edges.node.'))
    .map(field => field.replace('edges.node.', ''))
    .filter(field => whitelist.includes(field))
    ;

  return [...always, ...attributes];
}

export function getSelectedFieldsFromSelection(selection, path = []) {
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
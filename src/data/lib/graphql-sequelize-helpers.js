import {
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLInputObjectType,
  GraphQLError
} from 'graphql';


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

  console.log('args', args, '->', where);

  return where;
}

export function getWhereInputFields(inputType, operators) {
  // http://docs.sequelizejs.com/en/latest/docs/querying/#operators
  // TODO suport more types
  const ops = {
    eq: () => ({
      eq: {
        type: inputType,
      },
      ne: {
        type: inputType,
      },
    }),
    in: () => ({
      in: {
        type: new GraphQLList(inputType),
      },
      notIn: {
        type: new GraphQLList(inputType),
      },
    }),
    lt: () => ({
      lt: {
        type: inputType,
      },
      lte: {
        type: inputType,
      },
    }),
    gt: () => ({
      gt: {
        type: inputType,
      },
      gte: {
        type: inputType,
      },
    }),
    between: () => ({
      between: {
        type: new GraphQLList(inputType),
      },
      notBetween: {
        type: new GraphQLList(inputType),
      }
    }),
    like: () => ({
      like: {
        type: inputType,
      },
      notLike: {
        type: inputType,
      },
    }),
    iLike: () => ({
      iLike: {
        type: inputType,
      },
      notILike: {
        type: inputType,
      }
    }),
  };
  if (!Array.isArray(operators)) {
    throw new Error(`You have to define which operators to support. Available options: ${Object.keys(ops).sort().join(', ')}`)
  }

  let obj = {};
  operators.forEach(key => {
    Object.assign(obj, ops[key]());
  });

  return obj;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const operatorsInputType = (function () {
  const operatorTypes = {};

  return (inputType, operators) => {
    let name = `Operators${inputType.name}Input`;
    if (operators) {
      const operatorsSuffix = operators.sort().map(capitalizeFirstLetter).join('');

      name = `Operators${inputType.name}${operatorsSuffix}Input`
    }

    if (!operatorTypes[name]) {
      const fields = getWhereInputFields(inputType, operators);

      operatorTypes[name] = new GraphQLInputObjectType({
        name,
        fields,
      });
    }

    return operatorTypes[name];
  };
}());

export const operatorsFieldInput = function(inputType, operators) {
  return {
    type: operatorsInputType(inputType, operators),
  };
};

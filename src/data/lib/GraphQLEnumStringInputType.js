import { GraphQLScalarType } from 'graphql';

import { GraphQLError } from 'graphql/error';
import { Kind } from 'graphql/language';


export default class GraphQLEnumStringInputType extends GraphQLScalarType {
  constructor({values, ...other}) {

    const availableKeysStr = Object.keys(values).join(', ');

    const description = `String which is either of the following values: ${availableKeysStr}`;

    const serialize = value => value;
    const parseValue = value => value;

    const parseLiteral = ast => {
      const {kind, value} = ast;

      if (kind !== Kind.STRING) {
        throw new GraphQLError('Query error: Can only parse strings got a: ' + kind, [ast]);
      }

      if (!values.hasOwnProperty(value)) {
        throw new GraphQLError(`Query error: Invalid value '${value}', needs to be either of: ${availableKeysStr}`, [ast]);
      }


      return values[value];
    }

    const opts = {
      description,
      serialize,
      parseValue,
      parseLiteral,

      ...other,
    };

    super(opts);
  }
}

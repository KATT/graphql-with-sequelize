import Sequelize from 'sequelize';
import Faker from 'faker';
import _ from 'lodash';

const Conn = new Sequelize(
  'relay',
  'postgres',
  'postgres',
  {
    dialect: 'postgres',
    host: 'localhost'
  }
);

const Person = Conn.define('person', {
  firstName: {
    type: Sequelize.STRING,
    allowNull: false
  },
  lastName: {
    type: Sequelize.STRING,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    validate: {
      isEmail: true
    }
  },
  age: {
    type: Sequelize.INTEGER,
    allowNull: false,
  }
});

const Post = Conn.define('post', {
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  content: {
    type: Sequelize.STRING,
    allowNull: false
  }
});

// Relations
Person.hasMany(Post);
Post.belongsTo(Person);

Conn.sync({ force: false }).then(async ()=> {
  const count = await Person.count();
  if (count > 0) {
    return;
  }
  _.times(1000, ()=> {
    return Person.create({
      firstName: Faker.name.firstName(),
      lastName: Faker.name.lastName(),
      email: Faker.internet.email(),
      age: Faker.random.number({max: 122})
    }).then(person => {
      _.times(_.random(0, 5), () => {
        return person.createPost({
          title: `Sample post by ${person.firstName}`,
          content: 'here is some content'
        });
      });
    });
  });
});

export default Conn;

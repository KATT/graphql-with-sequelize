import Sequelize from 'sequelize';
import Faker from 'faker';
import _ from 'lodash';

const Conn = new Sequelize(
  'relay',
  'postgres',
  'postgres',
  {
    dialect: 'postgres',
    host: 'localhost',
    // logging: false,
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
    type: Sequelize.TEXT,
    allowNull: false
  }
});

// Relations
Person.hasMany(Post);
Post.belongsTo(Person);

Conn.sync({ force: false }).then(async ()=> {
  const nEntries = 100000;
  const count = await Person.count();

  const nEntriesToCreate = (nEntries - count);
  
  console.log(`${count} people in db, will create ${nEntriesToCreate} new ones`);

  let batch = [];
  const batchSize = 1000;
  for (let i = 0; i < nEntriesToCreate; i++) {
    const personPromise = (async () => {
      const person = await Person.create({
        firstName: Faker.name.firstName(),
        lastName: Faker.name.lastName(),
        email: Faker.internet.email(),
        age: Faker.random.number({max: 122})
      });

      const nPosts = _.random(0, 5);
      for (let j = 0; j < nPosts; j++) {
        await person.createPost({
          title: `Sample post #${j+1} by ${person.firstName}`,
          content: Faker.lorem.paragraphs()
        });
      }
    })();

    if (batch.length >= batchSize) {
      await Promise.all(batch);
      console.log(`created ${i} entries, ${nEntriesToCreate-i} left`);
      batch = [];
    }

    batch.push(personPromise);
  };

  console.log('ALL DONE');
});

export default Conn;

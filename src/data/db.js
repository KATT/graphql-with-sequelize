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

const Tag = Conn.define('tag', {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      isLowercase: true
    },
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ['name']
    }
  ]
});


// Relations
Person.hasMany(Post);
Post.belongsTo(Person);

const PostTag = Conn.define('post_tag', {});

Post.belongsToMany(Tag, { through: PostTag });
Tag.belongsToMany(Post, { through: PostTag });


Conn.sync({ force: false }).then(async ()=> {
  const nEntries = 100;
  const count = await Person.count();

  const nEntriesToCreate = Math.max(nEntries - count, 0);
  
  console.log(`${count} people in db, will create ${nEntriesToCreate} new ones`);

  let batch = [];
  const batchSize = 100;
  for (let i = 0; i < nEntriesToCreate; i++) {
    const personPromise = (async () => {
      const person = await Person.create({
        firstName: Faker.name.firstName(),
        lastName: Faker.name.lastName(),
        email: Faker.internet.email(),
        age: Faker.random.number({max: 122})
      });

      const nPosts = _.random(1, 5);
      for (let j = 0; j < nPosts; j++) {
        const post = await person.createPost({
          title: `Sample post #${j+1} by ${person.firstName}`,
          content: Faker.lorem.paragraphs()
        });

        const tags = [
          Faker.commerce.color(),
          Faker.commerce.department(),
          Faker.commerce.productAdjective(),
          Faker.commerce.productMaterial(),
        ];
        for (const tagName of tags) {
          const name = tagName.toLowerCase();
          let tag = await Tag.findOrCreate({where: {name}});
          tag = await Tag.findOne({where: {name}});

          post.addTag(tag);
        }
      }
    })();

    batch.push(personPromise);

    if (batch.length >= batchSize || i >= nEntriesToCreate-1) {
      await Promise.all(batch);
      console.log(`.. created ${i+1} entries, ${nEntriesToCreate-i-1} left`);
      batch = [];
    }
  }
  

  console.log('Scaffolding all done!');
});

export default Conn;

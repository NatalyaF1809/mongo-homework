const faker = require('faker');

const generateUser = ({
  firstName = faker.name.firstName(),
  lastName = faker.name.lastName(),
  department,
  createdAt = new Date()
} = {}) => ({
  firstName,
  lastName,
  department,
  createdAt
});

const generateArticle = ({
  name = 'Mongodb - ' + faker.commerce.productName(),
  description = 'Mongodb - ' + faker.commerce.productDescription(),
  type,
  tags = [faker.commerce.color(), faker.commerce.color(), faker.commerce.color()]
} = {}) => ({
  name,
  description,
  type,
  tags
})

module.exports = {
  mapUser: generateUser,
  getRandomFirstName: () => faker.name.firstName(),
  mapArticle: generateArticle,
};

'use strict'

const {mapUser, getRandomFirstName, mapArticle} = require('./util')

// db connection and settings
const connection = require('./config/connection')
let userCollection
let articlesCollection;
let studentCollection;
run()

async function run() {
  await connection.connect()
  await connection.get().createCollection('users')
  await connection.get().dropCollection('users')
  userCollection = connection.get().collection('users')

  await connection.get().createCollection('articles')
  await connection.get().dropCollection('articles')
  articlesCollection = connection.get().collection('articles');

  studentCollection = connection.get().collection('student');

  await example1()
  await example2()
  await example3()
  await example4()

  await example5()
  await example6()
  await example7()
  await example8()
  await example9()
  
  await studentsTask1()
  await studentsTask2()
  await studentsTask3()
  await studentsTask4()
  await studentsTask5()
  await connection.close()
}

// #### Users

// - Create 2 users per department (a, b, c)
async function example1() {
  const departments = ['a', 'a', 'b', 'b', 'c', 'c'];
    const users = departments.map(d => ({department: d})).map(mapUser);
  try {
    const {result} = await userCollection.insertMany(users);
    console.log(`Added ${result.n} users`)
  } catch (err) {
    console.error(err)
  }
}

// - Delete 1 user from department (a)

async function example2() {
  try {
    const {result} = await userCollection.deleteOne({department: 'a'});
    console.log(`Removed ${result.n} user`)
  } catch (err) {
    console.error(err)
  }
}

// - Update firstName for users from department (b)

async function example3() {
  try {
    const usersB = await userCollection.find({department: 'b'}).toArray();
    const bulkWrite = usersB.map(user => ({
      updateOne : {
        filter: {_id: user._id},
        update: {$set: {firstName: getRandomFirstName()}}
      }
    }))
    const {result} = await userCollection.bulkWrite(bulkWrite);
    console.log(`Updated ${result.nModified} users`);

  } catch (err) {
    console.error(err)
  }
}

// - Find all users from department (c)
async function example4() {
  try {
    const [find, projection] = [{department: 'c'}, {firstName: 1}];
    const users = [...(await userCollection.find(find, projection).toArray())].map(mapUser);
    console.log(`Users`);
    users.forEach(console.log);
  } catch (err) {
    console.error(err)
  }
}

//Create 5 articles per each type (a, b, c)
async function example5() {
  const types = [];
  for (let i = 0; i < 5; i++) {
    types.push('a');
    types.push('b');
    types.push('c');
  }
  const articles = types.map(t => ({type: t})).map(mapArticle);
  try {
    const {result} = await articlesCollection.insertMany(articles);
    console.log(`Added ${result.n} articles`);
  } catch (err) {
    console.error(err);
  }
}

//Find articles with type a, and update tag list with next value [‘tag1-a’, ‘tag2-a’, ‘tag3’]
async function example6() {
  try {
    const [query, update] = [{type: 'a'}, { $set: {tags: [ 'tag1-a', 'tag2-a', 'tag3'] }}];
    const {result} = await articlesCollection.updateMany(query, update);
    console.log(`Updated ${result.n} articles`);
  } catch (err) {
    console.error(err)
  }
}

//Add tags [‘tag2’, ‘tag3’, ‘super’] to other articles except articles from type a
async function example7() {
  try {
    const [query, update] = [{type: {$ne: 'a'}}, {$push: {tags: {$each: [`tag2`, `tag3`, `super`]}}}];
    const {result} = await articlesCollection.updateMany(query, update);
    console.log(`Added tags to ${result.n} articles`);
  } catch (err) {
    console.error(err);
  }
}

//Find all articles that contains tags [tag2, tag1-a]
async function example8() {
  try {
    const find = {tags: {$in: ['tag2', 'tag1-a']} };
    const articles = [...(await articlesCollection.find(find).toArray())].map(mapArticle);
    console.log(`Articles: `);
    articles.forEach(console.log);
  } catch (err) {
    console.error(err);
  }
}


//Pull [tag2, tag1-a] from all articles
async function example9() {
  try {
    const {result} = await articlesCollection.updateMany({}, {$pull: {tags: {$in: ['tag2', 'tag1-a']}}});
    console.log(`Pulled ${result.n} articles`);
  } catch(err) {
    console.error(err);
  }
}

//Find all students who have the worst score for homework, sort by descent
async function studentsTask1() {
  try {
    const {result} = await studentCollection.aggregate([
      {$unwind: '$scores'},
      {$match: {'scores.type': 'homework'}},
      {$sort: {'scores.score': -1}}
    ])
    
    console.log(`Sorted by desc order`);
  } catch (err) {
    console.error(err);
  }
}

//Find all students who have best scope for quiz and exam
async function studentsTask2() {
  try {
    const {result} = await studentCollection.aggregate([
      {$unwind: '$scores'},
      {$match: {$or: [{'scores.type': 'quiz'}, {'scores.type': 'exam'}]}},
      {$sort: {'scores.score': -1}}
  ]);
    
    console.log(`Best students by scope and exam`);
  } catch (err) {
    console.error(err);
  }
}

//Calculate the average score for homework for all students
async function studentsTask3() {
  try {
    const {result} = await studentCollection.aggregate([
      {$unwind: '$scores'},
      {$match: {'scores.type': 'homework'}},
      {$group: {'_id': null, 'avg': {$avg: '$scores.score'}}}
  ]);
    console.log(`Avg ${result}`);
  } catch (err) {
    console.error(err);
  }
}

//Delete all students that have homework score <= 60
async function studentsTask4() {
  try {
    let idList = await studentCollection.aggregate([
      {$unwind: '$scores'},
      {$match: {$and: [{'scores.type': 'homework'}, {'scores.score': { $gt: 0, $lt: 60 }}]}},
    ]).map(d => d._id);
    studentCollection.remove({_id: {$in: idList}});
    console.log(`Deleted items`);
  } catch (err) {
    console.error(err);
  }
}

//Mark students that have quiz score => 80
async function studentsTask5() {
  try {
    const {result} = await studentCollection.aggregate([
      {$unwind: '$scores'},
      {$match: {$and: [{'scores.type': 'quiz'}, {'scores.score': { $gt: 80, $lt: 100 }}]}},
      {$set: {markd: 'true'}}
  ])
    console.log(`Marked ${result} records`);
  } catch (err) {
    console.error(err);
  }
}









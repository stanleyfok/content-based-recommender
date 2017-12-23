const ContentBasedRecommender = require('../')
const recommender = new ContentBasedRecommender();

// prepare item data
const documents = [
  { id: '1000001', content: 'hello world <b>Hello</b> boy' },
  { id: '1000002', content: 'I go to school by bus. Hello!' },
  { id: '1000003', content: 'I am king of the world' },
  { id: '1000004', content: 'King and Queen are funny' }
];

// set data to recommender
recommender.setDocuments(documents);

// start training
recommender.train()
  .then(() => {
    console.log(recommender.getSimilarItems('1000001', 0, 10));
    console.log(recommender.getSimilarItems('1000002', 0, 10));
    console.log(recommender.getSimilarItems('1000003', 0, 10));
  });

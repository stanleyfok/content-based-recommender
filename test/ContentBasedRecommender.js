const ContentBasedRecommender = require('../');

const recommender = new ContentBasedRecommender();

// prepare document data
const documents = [
  { id: '1000001', content: 'Why studying javascript is fun?' },
  { id: '1000002', content: 'The trend for javascript in machine learning' },
  { id: '1000003', content: 'The most insightful stories about JavaScript' },
  { id: '1000004', content: 'Introduction to Machine Learning' },
  { id: '1000005', content: 'Machine learning and its application' },
  { id: '1000006', content: 'Python vs Javascript, which is better?' },
  { id: '1000007', content: 'How Python saved my life?' },
  { id: '1000008', content: 'The future of Bitcoin technology' },
  { id: '1000009', content: 'Is it possible to use javascript for machine learning?' },
];

// set data to recommender
recommender.setDocuments(documents);

// start training
recommender.train()
  .then(() => {
  // get top 10 similar items to document 1000002
    const similarItems = recommender.getSimilarItems('1000002', 0, 10);

    console.log(similarItems);
  });

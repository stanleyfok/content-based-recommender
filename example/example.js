const ContentBasedRecommender = require('../index.js');
const posts = require('../fixtures/sample-documents');
const tags = require('../fixtures/sample-document-tags');

const tagMap = tags.reduce((acc, tag) => {
  acc[tag.id] = tag;
  return acc;
}, {});

const recommender = new ContentBasedRecommender();

recommender.trainBidirectional(posts, tags);

for (let post of posts) {
  const relatedTags = recommender.getSimilarDocuments(post.id);
  const tags = relatedTags.map(t => tagMap[t.id].content);
  console.log(post.content, 'related tags:', tags);
}



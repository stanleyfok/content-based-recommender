Content Based Recommender
=======


[![Node.js CI](https://github.com/stanleyfok/content-based-recommender/workflows/Node.js%20CI/badge.svg)](https://github.com/stanleyfok/content-based-recommender/actions?query=workflow%3A%22Node.js+CI%22)
[![NPM version](https://img.shields.io/npm/v/content-based-recommender.svg)](https://www.npmjs.com/package/content-based-recommender)

This is a simple content-based recommender implemented in javascript to illustrate the concept of content-based recommendation. Content-based recommender is a popular recommendation technique to show similar items to users, especially useful to websites for e-commerce, news content, etc.

After the recommender is trained by an array of documents, it can tell the list of documents which are more similar to the input document.

The training process involves 3 main steps:
* content pre-processing, such as html tag stripping, [stopwords](http://xpo6.com/list-of-english-stop-words/) removal and [stemming](http://9ol.es/porter_js_demo.html)
* document vectors formation using [tf-idf](https://lizrush.gitbooks.io/algorithms-for-webdevs-ebook/content/chapters/tf-idf.html)
* find the [cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity) scores between all document vectors

Special thanks to the library [natural](https://www.npmjs.com/package/natural) helps a lot by providing a lot of NLP functionalities, such as tf-idf and word stemming.

**⚠️ Note:**

I haven't tested how this recommender is performing with a large dataset. I will share more results after some more testing.

## Installation

`npm install content-based-recommender`

And then import the ContentBasedRecommender class
```js
const ContentBasedRecommender = require('content-based-recommender')
```

## What's New

#### 1.5.0

* Added `trainBidirectional(collectionA, collectionB)` to allow recommendations between
two different datasets

#### 1.4.0

Upgrade dependencies to fix security alerts

#### 1.3.0

Introduce the use of unigram, bigrams and trigrams when constructing the word vector

#### 1.2.0

Simplify the implementation by not using sorted set data structure to store the similar documents data. Also support the maxSimilarDocuments and minScore options to save memory used by the recommender.

#### 1.1.0

Update to newer version of [vector-object](https://www.npmjs.com/package/vector-object)

## Usage

### Single collection

```js
const ContentBasedRecommender = require('content-based-recommender')
const recommender = new ContentBasedRecommender({
  minScore: 0.1,
  maxSimilarDocuments: 100
});

// prepare documents data
const documents = [
  { id: '1000001', content: 'Why studying javascript is fun?' },
  { id: '1000002', content: 'The trend for javascript in machine learning' },
  { id: '1000003', content: 'The most insightful stories about JavaScript' },
  { id: '1000004', content: 'Introduction to Machine Learning' },
  { id: '1000005', content: 'Machine learning and its application' },
  { id: '1000006', content: 'Python vs Javascript, which is better?' },
  { id: '1000007', content: 'How Python saved my life?' },
  { id: '1000008', content: 'The future of Bitcoin technology' },
  { id: '1000009', content: 'Is it possible to use javascript for machine learning?' }
];

// start training
recommender.train(documents);

//get top 10 similar items to document 1000002
const similarDocuments = recommender.getSimilarDocuments('1000002', 0, 10);

console.log(similarDocuments);
/*
  the higher the score, the more similar the item is
  documents with score < 0.1 are filtered because options minScore is set to 0.1
  [
    { id: '1000004', score: 0.5114304586412038 },
    { id: '1000009', score: 0.45056313558918837 },
    { id: '1000005', score: 0.37039308109283564 },
    { id: '1000003', score: 0.10896767690747626 }
  ]
*/
```

### Multi collection

This example shows how to automatically match posts with related tags

```js
const ContentBasedRecommender =  require('content-based-recommender')

const posts = [
                {
                  id: '1000001',
                  content: 'Why studying javascript is fun?',
                },
                {
                  id: '1000002',
                  content: 'The trend for javascript in machine learning',
                },
                {
                  id: '1000003',
                  content: 'The most insightful stories about JavaScript',
                },
                {
                  id: '1000004',
                  content: 'Introduction to Machine Learning',
                },
                {
                  id: '1000005',
                  content: 'Machine learning and its application',
                },
                {
                  id: '1000006',
                  content: 'Python vs Javascript, which is better?',
                },
                {
                  id: '1000007',
                  content: 'How Python saved my life?',
                },
                {
                  id: '1000008',
                  content: 'The future of Bitcoin technology',
                },
                {
                  id: '1000009',
                  content: 'Is it possible to use javascript for machine learning?',
                },
              ];

const tags = [
               {
                 id: '1',
                 content: 'Javascript',
               },
               {
                 id: '2',
                 content: 'machine learning',
               },
               {
                 id: '3',
                 content: 'application',
               },
               {
                 id: '4',
                 content: 'introduction',
               },
               {
                 id: '5',
                 content: 'future',
               },
               {
                 id: '6',
                 content: 'Python',
               },
               {
                 id: '7',
                 content: 'Bitcoin',
               },
             ];

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


/*
Why studying javascript is fun? related tags: [ 'Javascript' ]
The trend for javascript in machine learning related tags: [ 'machine learning', 'Javascript' ]
The most insightful stories about JavaScript related tags: [ 'Javascript' ]
Introduction to Machine Learning related tags: [ 'machine learning', 'introduction' ]
Machine learning and its application related tags: [ 'machine learning', 'application' ]
Python vs Javascript, which is better? related tags: [ 'Python', 'Javascript' ]
How Python saved my life? related tags: [ 'Python' ]
The future of Bitcoin technology related tags: [ 'future', 'Bitcoin' ]
Is it possible to use javascript for machine learning? related tags: [ 'machine learning', 'Javascript' ]
*/

```


## API

### constructor([options])

To create the recommender instance

* options (optional): an object to configure the recommender

Supported options:

* maxVectorSize - to control the max size of word vector after tf-idf processing. A smaller vector size will help training performance while not affecting recommendation quality. Defaults to be 100.
* minScore - the minimum score required to meet to consider it is a similar document. It will save more memory by filtering out documents having low scores. Allowed values range from 0 to 1. Default is 0.
* maxSimilarDocuments - the maximum number of similar documents to keep for each document. Default is the [max safe integer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER) in javascript.
* debug - show progress messages so can monitor the training progress

### train(documents)

To tell the recommender about your documents and then it will start training itself.

* documents - an array of object, with fields **id** and **content**


### trainBidirectional(collectionA, collectionB)

Works like the normal train function, but it creates recommendations 
between two different collections instead of within one collection.

### getSimilarDocuments(id, [start], [size])

To get an array of similar items with document id

* id - the id of the document
* start - the start index, inclusive. Default to be 0
* size - the max number of similar documents to obtain. If it is omitted, the whole list after start index will be returned

It returns an array of objects, with fields **id** and **score** (ranging from 0 to 1)

### export

To export the recommender as json object.
```js
const recommender = new ContentBasedRecommender();
recommender.train(documents);

const object = recommender.export();
//can save the object to disk, database or otherwise
```

### import(object)

To update the recommender by importing from a json object, exported by the export() method
```js
const recommender = new ContentBasedRecommender();
recommender.import(object); // object can be loaded from disk, database or otherwise
```

## Test

```bash
npm install
npm run test
```

## Authors

  - [Stanley Fok](https://github.com/stanleyfok)

## License

  [MIT](./LICENSE)

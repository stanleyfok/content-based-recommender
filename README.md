Content Based Recommender
=======

[![Build Status](https://travis-ci.org/stanleyfok/content-based-recommender.png?branch=master)](https://travis-ci.org/stanleyfok/content-based-recommender)
[![NPM version](https://img.shields.io/npm/v/content-based-recommender.svg)](https://www.npmjs.com/package/content-based-recommender)

This is a simple content-based recommender implemented in javascript to illustrate the concept of content-based recommendation. After the recommender is trained by an array of documents, it can tell the list of documents which are more similar to the input document.

The training process involves 3 main steps:
* content pre-processing, such as html tag stripping, [stopwords](http://xpo6.com/list-of-english-stop-words/) removal and [stemming](http://9ol.es/porter_js_demo.html)
* document vectors formation using [tf-idf](https://lizrush.gitbooks.io/algorithms-for-webdevs-ebook/content/chapters/tf-idf.html)
* find the [cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity) scores between all document vectors

The similarity scores are finally stored in sorted sets data structure, thanks to the javascript implementation of [redis sorted set](https://www.npmjs.com/package/redis-sorted-set).

**⚠️ Note:**

I haven't tested how this recommender is performing with a large dataset. I will share more results after some more testing.

## Usage

```js
const ContentBasedRecommender = require('content-based-recommender')
const recommender = new ContentBasedRecommender();

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
  [
    { id: '1000009', score: 0.43529868463164245 },
    { id: '1000004', score: 0.4112506830931031 },
    { id: '1000005', score: 0.32986852711159986 },
    { id: '1000003', score: 0.1422285906657209 },
    { id: '1000006', score: 0.12457999641759732 },
    { id: '1000001', score: 0.11885606218309874 }
  ]
*/
```
## API

### constructor([options])

To create the recommender instance

* options (optional): an object to configure the recommender

Supported options:

* maxVectorSize - the control the max size of word vector after tf-idf processing. A smaller vector size will help training improvement while not affecting recommendation quality. Defaults to be 100.

### train(documents)

To tell the recommender about your documents and then it will start training itself.

* documents - an array of object, with fields **id** and **content**

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

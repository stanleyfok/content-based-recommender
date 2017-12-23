Content Based Recommender
=======

Still under construction...

## Usage

Still in design phase

```js
const ContentBasedRecommender = require('content-based-recommeder')
const recommender = new ContentBasedRecommender();

// prepare item data
const items = xxxx;

// set data to recommender
recommeder.setData(items);

// start training
recommender.train(data, (err) => {
  const similarItems = recommender.getSimilarItems('xxxx', 10);

  console.log(similarItems);
});
```

const Vector = require('vector-object');
const SortedSet = require('redis-sorted-set');
const Promise = require('bluebird');
const striptags = require('striptags');
const sw = require('stopword');
const natural = require('natural');

const { TfIdf, PorterStemmer } = natural;
const tokenizer = new natural.WordTokenizer();

class ContentBasedRecommender {
  constructor(options) {
    this.options = options;
    this.sortedSets = {};
  }

  train(documents, callback) {
    const self = this;

    return new Promise((resolve) => {
      self._preprocessDocuments(documents)
        .then(self._produceWordVectors)
        .then(self._calculateSimilarities)
        .then((sortedSets) => {
          self.sortedSets = sortedSets;

          // check if use callback or promise resolve
          if (typeof callback === 'function') {
            callback();
          } else {
            resolve();
          }
        });
    });
  }

  getSimilarItems(id, start, size = undefined) {
    const sortedSet = this.sortedSets[id];

    if (sortedSet === undefined) {
      return [];
    }

    const end = (size !== undefined) ? (start + size) - 1 : undefined;
    const records = sortedSet.range(start, end, { withScores: true });

    return records.map(record => ({
      id: record[0],
      score: 1 - record[1], // subtract from one to show actual score
    }));
  }

  // pseudo private methods

  _preprocessDocuments(documents) {
    return new Promise((resolve) => {
      const processedDocuments = documents.map(item => ({
        id: item.id,
        tokens: this._getTokensFromString(item.content),
      }));

      resolve(processedDocuments);
    });
  }

  _produceWordVectors(processedDocuments) {
    return new Promise((resolve) => {
      // process tfidf
      const tfidf = new TfIdf();

      processedDocuments.forEach((processedDocument) => {
        tfidf.addDocument(processedDocument.tokens);
      });

      // create word vector
      const documentVectors = [];

      for (let i = 0; i < processedDocuments.length; i += 1) {
        const processedDocument = processedDocuments[i];
        const hash = {};

        tfidf.listTerms(i).forEach((item) => {
          hash[item.term] = item.tfidf;
        });

        const record = {
          id: processedDocument.id,
          vector: new Vector(hash),
        };

        documentVectors.push(record);
      }

      resolve(documentVectors);
    });
  }

  _calculateSimilarities(documentVectors) {
    return new Promise((resolve) => {
      const sortedSets = {};

      // initialize sorted sets hash
      for (let i = 0; i < documentVectors.length; i += 1) {
        const documentVector = documentVectors[i];
        const { id } = documentVector;

        sortedSets[id] = new SortedSet();
      }

      for (let i = 0; i < documentVectors.length; i += 1) {
        for (let j = 0; j < i; j += 1) {
          const idi = documentVectors[i].id;
          const vi = documentVectors[i].vector;
          const idj = documentVectors[j].id;
          const vj = documentVectors[j].vector;
          const similarity = vi.getCosineSimilarity(vj);

          if (similarity > 0) {
            // subtract from 1 because the sorted set library only support asceonding order
            sortedSets[idi].add(idj, 1 - similarity);
            sortedSets[idj].add(idi, 1 - similarity);
          }
        }
      }

      resolve(sortedSets);
    });
  }

  _getTokensFromString(string) {
    // replace html tags to space character
    const newString = striptags(string, [], ' ');

    // tokenize the string
    let tokens = tokenizer.tokenize(newString);

    // to lowercase
    tokens = tokens.map(token => token.toLowerCase());

    // remove stopwords in the tokens
    tokens = sw.removeStopwords(tokens);

    // stem the tokens
    tokens = tokens.map(token => PorterStemmer.stem(token));

    return tokens;
  }
}

module.exports = ContentBasedRecommender;

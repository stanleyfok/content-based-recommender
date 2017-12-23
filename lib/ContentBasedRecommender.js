const Vector = require('vector-object');
const SortedSet = require('redis-sorted-set');
const Promise = require("bluebird");
const striptags = require('striptags');
const sw = require('stopword');
const natural = require('natural');
const TfIdf = natural.TfIdf;
const stemmer = natural.PorterStemmer;
const tokenizer = new natural.WordTokenizer();

class ContentBasedRecommender {
  constructor(options) {
    this.options = options;
    this.sortedSets = {};
  }

  setDocuments(documents) {
    this.documents = documents;
  }

  train() {
    const self = this;

    return new Promise((resolve) => {

      self._preprocessDocuments()
        .then(self._produceWordVectors)
        .then(self._calculateSimilarities)
        .then((sortedSets) => {
          self.sortedSets = sortedSets;

          resolve();
        })
    });
  }

  getSimilarItems(id, start, end) {
    const sortedSet = this.sortedSets[id];

    if (sortedSet === undefined) {
      return [];
    }

    const records = sortedSet.range(start, end, { withScores: true });

    return records.map((record) => {
      return {
        id: record[0],
        score: 1 - record[1] //subtract from one to show actual score
      };
    });
  }

  // pseudo private methods

  _preprocessDocuments() {
    return new Promise((resolve) => {
      let processedDocuments = this.documents.map((item) => {
        return {
          id: item.id,
          tokens: this._getTokensFromString(item.content)
        };
      });

      resolve(processedDocuments);
    });
  }

  _produceWordVectors(processedDocuments) {
    return new Promise((resolve) => {

      //process tfidf
      const tfidf = new TfIdf();

      processedDocuments.forEach((processedDocument) => {
        tfidf.addDocument(processedDocument.tokens);
      });

      //create word vector
      let documentVectors = [];

      for (let i = 0; i < processedDocuments.length; i += 1) {
        let processedDocument = processedDocuments[i];
        let hash = {};

        tfidf.listTerms(i).forEach((item) => {
          hash[item.term] = item.tfidf;
        });

        let record = {
          id: processedDocument.id,
          vector: new Vector(hash)
        };

        documentVectors.push(record);
      };

      resolve(documentVectors);
    });
  }

  _calculateSimilarities(documentVectors) {
    return new Promise((resolve) => {

      let sortedSets = {};

      //initialize sorted sets hash
      for (let i = 0; i < documentVectors.length; i += 1) {
        const documentVector = documentVectors[i];
        const id = documentVector.id;

        sortedSets[id] = new SortedSet();
      }

      for (let i = 0; i < documentVectors.length; i += 1) {
        for (let j = 0; j < i; j += 1) {
          const idi = documentVectors[i].id;
          const vi = documentVectors[i].vector;
          const idj = documentVectors[j].id;
          const vj = documentVectors[j].vector
          //subtract from 1 because the sorted set library only support asceonding order
          const similarity = 1 - vi.getCosineSimilarity(vj);

          sortedSets[idi].add(idj, similarity);
          sortedSets[idj].add(idi, similarity);
        }
      }

      resolve(sortedSets);
    });
  }

  _getTokensFromString(string) {
    //replace html tags to space character
    const newString = striptags(string, [], ' ');

    //tokenize the string
    let tokens = tokenizer.tokenize(newString);

    //to lowercase
    tokens = tokens.map((token) => {
      return token.toLowerCase();
    })

    //remove stopwords in the tokens
    tokens = sw.removeStopwords(tokens);

    //stem the tokens
    tokens = tokens.map((token) => {
      return stemmer.stem(token);
    })

    return tokens;
  }
}

module.exports = ContentBasedRecommender;

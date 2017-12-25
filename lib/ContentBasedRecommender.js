const _ = require('underscore');
const Vector = require('vector-object');
const striptags = require('striptags');
const sw = require('stopword');
const natural = require('natural');

const { TfIdf, PorterStemmer } = natural;
const tokenizer = new natural.WordTokenizer();

const defaultOptions = {
  maxVectorSize: 100,
  maxSimilarDocuments: 0,
  minScore: 0
};

class ContentBasedRecommender {
  constructor(options = {}) {
    this.setOptions(options);

    this.data = {};
  }

  setOptions(options = {}) {
    this.options = Object.assign(defaultOptions, options);
  }

  train(documents) {
    this.validateDocuments(documents);

    // step 1 - preprocess the documents
    const preprocessDocs = this._preprocessDocuments(documents);

    // step 2 - create document vectors
    const docVectors = this._produceWordVectors(preprocessDocs, this.options);

    // step 3 - calculate similarities
    this.data = this._calculateSimilarities(docVectors, this.options);
  }

  validateDocuments(documents) {
    if (!_.isArray(documents)) {
      throw new Error('Documents should be an array of objects');
    }

    for (let i = 0; i < documents.length; i += 1) {
      const document = documents[i];

      if (!_.has(document, 'id') || !_.has(document, 'content')) {
        throw new Error('Documents should be have fields id and content');
      }
    }
  }

  getSimilarDocuments(id, start = 0, size = undefined) {
    let similarDocuments = this.data[id];

    if (similarDocuments === undefined) {
      return [];
    }

    const end = (size !== undefined) ? start + size : undefined;
    similarDocuments = similarDocuments.slice(start, end);

    return similarDocuments;
  }

  export() {
    return {
      options: this.options,
      data: this.data
    };
  }

  import(object) {
    const { options, data } = object;

    this.setOptions(options);
    this.data = data;
  }

  // pseudo private methods

  _preprocessDocuments(documents) {
    const processedDocuments = documents.map(item => ({
      id: item.id,
      tokens: this._getTokensFromString(item.content),
    }));

    return processedDocuments;
  }

  _getTokensFromString(string) {
    let newString = string;

    // replace html tags to space character
    newString = striptags(newString, [], ' ');

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

  _produceWordVectors(processedDocuments, options) {
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

      const items = tfidf.listTerms(i);
      const maxSize = Math.min(options.maxVectorSize, items.length);
      for (let j = 0; j < maxSize; j += 1) {
        const item = items[j];
        hash[item.term] = item.tfidf;
      }

      const documentVector = {
        id: processedDocument.id,
        vector: new Vector(hash),
      };

      documentVectors.push(documentVector);
    }

    return documentVectors;
  }

  _calculateSimilarities(documentVectors, options) {
    const data = {};

    // initialize data hash
    for (let i = 0; i < documentVectors.length; i += 1) {
      const documentVector = documentVectors[i];
      const { id } = documentVector;

      data[id] = [];
    }

    //calculate the similar scores
    for (let i = 0; i < documentVectors.length; i += 1) {
      for (let j = 0; j < i; j += 1) {
        const idi = documentVectors[i].id;
        const vi = documentVectors[i].vector;
        const idj = documentVectors[j].id;
        const vj = documentVectors[j].vector;
        const similarity = vi.getCosineSimilarity(vj);

        if (similarity > options.minScore) {
          data[idi].push({ id: idj, score: similarity });
          data[idj].push({ id: idi, score: similarity });
        }
      }
    }

    //finally sort the similar documents by descending order
    Object.keys(data).forEach((id) => {
      let similarDocuments = data[id];

      similarDocuments.sort((a, b) => {
        return b.score - a.score;
      });

      if ((similarDocuments.length > options.maxSimilarDocuments) &&
          (options.maxSimilarDocuments > 0)){
        similarDocuments = similarDocuments.slice(0, options.maxSimilarDocuments);
      }
    })

    return data;
  }
}

module.exports = ContentBasedRecommender;

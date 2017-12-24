const chai = require('chai');
const ContentBasedRecommender = require('../');

chai.should();

const documents = require('../fixtures/sample-documents');

const recommender = new ContentBasedRecommender();

describe('ContentBasedRecommender', () => {
  describe('input validation', () => {
    it('should only accept array of documents', () => {
      (() => {
        recommender.train({
          1000001: 'Hello World',
          1000002: 'I love programming!',
        });
      }).should.to.throw('Documents should be an array of objects');
    });

    it('should only accept array of documents, with fields id and content', () => {
      (() => {
        recommender.train([
          { name: '1000001', text: 'Hello World' },
          { name: '1000002', text: 'I love programming!' },
        ]);
      }).should.to.throw('Documents should be have fields id and content');
    });
  });

  describe('training result validation', () => {
    it('should return list of similar documents in right order', (done) => {
      recommender.train(documents)
        .then(() => {
          const similarDocuments = recommender.getSimilarDocuments('1000002', 0);

          similarDocuments.map(document => document.id).should.to.have.ordered.members(['1000009', '1000004', '1000005', '1000003', '1000006', '1000001']);

          done();
        });
    });

    it('should also work using callback', (done) => {
      recommender.train(documents, () => {
        const similarDocuments = recommender.getSimilarDocuments('1000002', 0);

        similarDocuments.map(document => document.id).should.to.have.ordered.members(['1000009', '1000004', '1000005', '1000003', '1000006', '1000001']);

        done();
      });
    });

    it('should to be able to control how many similar documents to obtain', (done) => {
      recommender.train(documents)
        .then(() => {
          let similarDocuments = recommender.getSimilarDocuments('1000002', 0, 2);
          similarDocuments.map(document => document.id).should.to.have.ordered.members(['1000009', '1000004']);

          similarDocuments = recommender.getSimilarDocuments('1000002', 2);
          similarDocuments.map(document => document.id).should.to.have.ordered.members(['1000005', '1000003', '1000006', '1000001']);

          similarDocuments = recommender.getSimilarDocuments('1000002', 1, 3);
          similarDocuments.map(document => document.id).should.to.have.ordered.members(['1000004', '1000005', '1000003']);

          done();
        });
    });
  });
});

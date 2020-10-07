const chai = require('chai');
const ContentBasedRecommender = require('../');

chai.should();

const documents = require('../fixtures/sample-documents');
const targetDocuments = require('../fixtures/sample-target-documents');

describe('ContentBasedRecommender', () => {
  describe('options validation', () => {
    it('should only accept maxVectorSize greater than 0', () => {
      (() => {
        const recommender = new ContentBasedRecommender({
          maxVectorSize: -1,
        });
        recommender.train(documents);
      }).should.to.throw('The option maxVectorSize should be integer and greater than 0');
    });

    it('should only accept maxSimilarDocuments greater than 0', () => {
      (() => {
        const recommender = new ContentBasedRecommender({
          maxSimilarDocuments: -1,
        });
        recommender.train(documents);
      }).should.to.throw('The option maxSimilarDocuments should be integer and greater than 0');
    });

    it('should only accept minScore between 0 and 1', () => {
      (() => {
        const recommender = new ContentBasedRecommender({
          minScore: -1,
        });
        recommender.train(documents);
      }).should.to.throw('The option minScore should be a number between 0 and 1');

      (() => {
        const recommender = new ContentBasedRecommender({
          minScore: 2,
        });
        recommender.train(documents);
      }).should.to.throw('The option minScore should be a number between 0 and 1');
    });
  });

  describe('documents validation', () => {
    const recommender = new ContentBasedRecommender();

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
          {
            name: '1000001',
            text: 'Hello World'
          },
          {
            name: '1000002',
            text: 'I love programming!'
          },
        ]);
      }).should.to.throw('Documents should be have fields id and content');
    });
  });

  describe('training result validation', () => {
    it('should return list of similar documents in right order', () => {
      const recommender = new ContentBasedRecommender();
      recommender.train(documents);

      const similarDocuments = recommender.getSimilarDocuments('1000002');

      similarDocuments.map(document => document.id)
        .should
        .to
        .have
        .ordered
        .members(['1000004', '1000009', '1000005', '1000003', '1000006', '1000001']);
    });

    it('should to be able to control how many similar documents to obtain', () => {
      const recommender = new ContentBasedRecommender();
      recommender.train(documents);

      let similarDocuments = recommender.getSimilarDocuments('1000002', 0, 2);
      similarDocuments.map(document => document.id)
        .should
        .to
        .have
        .ordered
        .members(['1000004', '1000009']);

      similarDocuments = recommender.getSimilarDocuments('1000002', 2);
      similarDocuments.map(document => document.id)
        .should
        .to
        .have
        .ordered
        .members(['1000005', '1000003', '1000006', '1000001']);

      similarDocuments = recommender.getSimilarDocuments('1000002', 1, 3);
      similarDocuments.map(document => document.id)
        .should
        .to
        .have
        .ordered
        .members(['1000009', '1000005', '1000003']);
    });

    it('should to be able to control the minScore of similar documents', () => {
      const recommender = new ContentBasedRecommender({ minScore: 0.4 });
      recommender.train(documents);

      documents.forEach((document) => {
        const similarDocuments = recommender.getSimilarDocuments(document.id);
        similarDocuments.map(similarDocument => similarDocument.score)
          .forEach((score) => {
            score.should.to.be.at.least(0.4);
          });
      });
    });

    it('should to be able to control the maximum number of similar documents', () => {
      const recommender = new ContentBasedRecommender({ maxSimilarDocuments: 3 });
      recommender.train(documents);

      documents.forEach((document) => {
        const similarDocuments = recommender.getSimilarDocuments(document.id);
        similarDocuments.should.to.have.lengthOf.at.most(3);
      });
    });
  });

  describe('training multi collection result validation', () => {
    it('should return list of similar documents of the target collection in right order', () => {
      const recommender = new ContentBasedRecommender();
      recommender.trainBidirectional(documents, targetDocuments);

      const similarDocuments = recommender.getSimilarDocuments('1000011');

      similarDocuments.map(document => document.id)
        .should
        .to
        .have
        .ordered
        .members(['1000002', '1000004', '1000009', '1000005', '1000003', '1000006', '1000001']);
    });

    it('should to be able to control how many similar documents to obtain using multiple collections', () => {
      const recommender = new ContentBasedRecommender();
      recommender.trainBidirectional(documents, targetDocuments);

      let similarDocuments = recommender.getSimilarDocuments('1000011', 0, 2);
      similarDocuments.map(document => document.id)
        .should
        .to
        .have
        .ordered
        .members(['1000002', '1000004']);

      similarDocuments = recommender.getSimilarDocuments('1000011', 2);
      similarDocuments.map(document => document.id)
        .should
        .to
        .have
        .ordered
        .members(['1000009', '1000005', '1000003', '1000006', '1000001']);

      similarDocuments = recommender.getSimilarDocuments('1000011', 1, 3);
      similarDocuments.map(document => document.id)
        .should
        .to
        .have
        .ordered
        .members(['1000004', '1000009', '1000005']);
    });

    it('should to be able to control the minScore of similar documents', () => {
      const recommender = new ContentBasedRecommender({ minScore: 0.4 });
      recommender.train(documents);

      documents.forEach((document) => {
        const similarDocuments = recommender.getSimilarDocuments(document.id);
        similarDocuments.map(similarDocument => similarDocument.score)
          .forEach((score) => {
            score.should.to.be.at.least(0.4);
          });
      });
    });

    it('should to be able to control the maximum number of similar documents', () => {
      const recommender = new ContentBasedRecommender({ maxSimilarDocuments: 3 });
      recommender.train(documents);

      documents.forEach((document) => {
        const similarDocuments = recommender.getSimilarDocuments(document.id);
        similarDocuments.should.to.have.lengthOf.at.most(3);
      });
    });
  });

  describe('export and import', () => {
    it('should to be able to give the same results with recommender created by import method', () => {
      const recommender = new ContentBasedRecommender({
        maxSimilarDocuments: 3,
        minScore: 0.4,
      });
      recommender.train(documents);

      const s = recommender.export();

      // create another recommender based on export result
      const recommender2 = new ContentBasedRecommender(s);
      recommender2.import(s);

      documents.forEach((document) => {
        const similarDocuments = recommender.getSimilarDocuments(document.id);
        const similarDocuments2 = recommender2.getSimilarDocuments(document.id);

        similarDocuments.should.to.deep.equal(similarDocuments2);
      });
    });
  });
});

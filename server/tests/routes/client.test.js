const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-http'));
const app = require('../../src/app');
const request = chai.request;

const req = {
  body: {},
};

const res = {
  sendCalledWith: '',
  json: function (arg) {
    this.sendCalledWith = arg;
  },
};

describe('POST Client Route', () => {
  describe('/client POST', () => {

    it('should request with empty body fail', (done) => {
      request(app)
        .post('/client')
        .send({})
        .end(function (err, res) {
          expect(res).to.have.status(412);
          done()
        });
    });

    it('should request without email fail', (done) => {
      request(app)
        .post('/client')
        .send({ name: '', telephone: '' })
        .end(function (err, res) {
          expect(res).to.have.status(412);
          done();
        })
    });

    it('should request with email existing fail', (done) => {
      request(app)
        .post('/client')
        .send({ email: 'emil@gmail.com' })
        .end(function (err, res) {
          expect(res).to.have.status(412);
          done();
        });
    });

    it('should request with valid email work', (done) => {
      request(app)
        .post('/client')
        .send({ email: 'uniquemail@gmail.com' })
        .end(function (err, res) {
          expect(res).to.have.status(200);
        });
    });

  });
});


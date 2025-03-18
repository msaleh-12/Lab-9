const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server'); // Ensure this path correctly points to your server file
const expect = chai.expect;

chai.use(chaiHttp);

describe('User Authentication', function() {
  it('should sign up a new user', function(done) {
    chai.request(app)
      .post('/api/auth/signup')
      .send({ username: 'testuser', password: 'testpass' })
      .end(function(err, res) {
        expect(res).to.have.status(201);
        done();
      });
  });
});

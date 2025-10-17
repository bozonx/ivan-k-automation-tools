// Jest setup for e2e and unit tests
import nock from 'nock';

// Block all external network calls; allow localhost for supertest
beforeAll(() => {
  nock.disableNetConnect();
  nock.enableNetConnect('127.0.0.1');
});

afterEach(() => {
  nock.cleanAll();
});

afterAll(() => {
  nock.enableNetConnect();
});

import ParsingClient from 'sparql-http-client/ParsingClient'

export const client = new ParsingClient({
  endpointUrl: 'http://localhost:3030/test-hierarchy-query/query',
  updateUrl: 'http://localhost:3030/test-hierarchy-query/update',
  user: 'admin',
  password: 'password ',
})

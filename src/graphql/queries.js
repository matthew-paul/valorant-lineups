/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getLineup = /* GraphQL */ `
  query GetLineup($id: ID!) {
    getLineup(id: $id) {
      id
      name
      agent
      ability
      description
      createdAt
      updatedAt
    }
  }
`;
export const listLineups = /* GraphQL */ `
  query ListLineups(
    $filter: ModelLineupFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listLineups(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        agent
        ability
        description
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

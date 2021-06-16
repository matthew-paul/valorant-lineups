/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createLineup = /* GraphQL */ `
  mutation CreateLineup(
    $input: CreateLineupInput!
    $condition: ModelLineupConditionInput
  ) {
    createLineup(input: $input, condition: $condition) {
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
export const updateLineup = /* GraphQL */ `
  mutation UpdateLineup(
    $input: UpdateLineupInput!
    $condition: ModelLineupConditionInput
  ) {
    updateLineup(input: $input, condition: $condition) {
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
export const deleteLineup = /* GraphQL */ `
  mutation DeleteLineup(
    $input: DeleteLineupInput!
    $condition: ModelLineupConditionInput
  ) {
    deleteLineup(input: $input, condition: $condition) {
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

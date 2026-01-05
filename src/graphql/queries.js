/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getPracticeLog = /* GraphQL */ `
  query GetPracticeLog($id: ID!) {
    getPracticeLog(id: $id) {
      id
      date
      category
      subCategory
      duration
      location
      notes
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listPracticeLogs = /* GraphQL */ `
  query ListPracticeLogs(
    $filter: ModelPracticeLogFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPracticeLogs(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        date
        category
        subCategory
        duration
        location
        notes
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;

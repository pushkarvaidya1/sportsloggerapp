/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createPracticeLog = /* GraphQL */ `
  mutation CreatePracticeLog(
    $input: CreatePracticeLogInput!
    $condition: ModelPracticeLogConditionInput
  ) {
    createPracticeLog(input: $input, condition: $condition) {
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
export const updatePracticeLog = /* GraphQL */ `
  mutation UpdatePracticeLog(
    $input: UpdatePracticeLogInput!
    $condition: ModelPracticeLogConditionInput
  ) {
    updatePracticeLog(input: $input, condition: $condition) {
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
export const deletePracticeLog = /* GraphQL */ `
  mutation DeletePracticeLog(
    $input: DeletePracticeLogInput!
    $condition: ModelPracticeLogConditionInput
  ) {
    deletePracticeLog(input: $input, condition: $condition) {
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

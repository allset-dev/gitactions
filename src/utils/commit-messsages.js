import { graphql } from '@octokit/graphql';

import { REPO_OWNER, REPO_NAME, PR_NUMBER, GITHUB_TOKEN } from './get-inputs';

const QUERY = `
  query commitMessages(
    $repositoryOwner: String!
    $repositoryName: String!
    $pullRequestNumber: Int!
    $numberOfCommits: Int = 100
  ) {
    repository(owner: $repositoryOwner, name: $repositoryName) {
      pullRequest(number: $pullRequestNumber) {
        commits(last: $numberOfCommits) {
          edges {
            node {
              commit {
                message
              }
            }
          }
        }
      }
    }
  }
`;

export async function getCommitMessages() {
  const variables = {
    baseUrl: process.env['GITHUB_API_URL'] || 'https://api.github.com',
    repositoryOwner: REPO_OWNER,
    repositoryName: REPO_NAME,
    pullRequestNumber: PR_NUMBER,
    headers: {
      authorization: `token ${GITHUB_TOKEN}`,
    },
  };

  const { repository } = await graphql(QUERY, variables);

  let messages = [];

  if (repository.pullRequest) {
    messages = repository.pullRequest.commits.edges.map((edge) => {
      return edge.node.commit.message;
    });
  }

  return messages;
}

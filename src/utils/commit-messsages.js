import { graphql } from '@octokit/graphql';

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

export async function getCommitMessages(props) {
  const { repositoryOwner, repositoryName, pullRequestNumber, token } = props;

  const variables = {
    baseUrl: process.env['GITHUB_API_URL'] || 'https://api.github.com',
    repositoryOwner,
    repositoryName,
    pullRequestNumber,
    headers: {
      authorization: `token ${token}`,
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

const core = require('@actions/core');
const github = require('@actions/github');

try {
    const token = core.getInput('token', { required: true });
    const octokit = github.getOctokit(token);
    const githubInfo = github?.context?.payload;
    const { ref = '', pull_request = {} } = githubInfo;

    const branchName = ref?.replace?.('refs/heads/', '') || '';
    const [repoOwner, repoName] = process?.env?.GITHUB_REPOSITORY?.split?.('/') || [];
    const body = `https://logichub.atlassian.net/browse/${branchName}`;

    console.log(`token: ${token}`)
    console.log(`body: ${body}`);
    console.log(`repoOwner: ${repoOwner}. repoName: ${repoName}`);
    console.log(`The event payload: ${JSON.stringify(githubInfo, undefined, 2)}`);


    octokit.pulls.update({
        owner: repoOwner,
        repo: repoName,
        body: `https://logichub.atlassian.net/browse/${branchName}`,
        pull_number: pull_request.number,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
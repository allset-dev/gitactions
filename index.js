const core = require('@actions/core');
const github = require('@actions/github');

try {
    const token = core.getInput('token', { required: true });
    const githubInfo = github?.context?.payload;
    const { ref = '', pull_request } = githubInfo;

    if (pull_request === null) {
        core.setFailed("No pull request found");
        return;
    }

    if (!token) {
        core.setFailed("TOKEN input is required");
        return;
    }

    const branchName = ref?.replace?.('refs/heads/', '') || '';
    const [repoOwner, repoName] = process?.env?.GITHUB_REPOSITORY?.split?.('/') || [];
    const body = `https://logichub.atlassian.net/browse/${branchName}`;

    console.log(`token: ${token}`)
    console.log(`body: ${body}`);
    console.log(`repoOwner: ${repoOwner}. repoName: ${repoName}`);
    console.log(`The event payload: ${JSON.stringify(githubInfo, undefined, 2)}`);


    const octokit = github.GitHub(token);
    octokit.pulls.update({
        body: `https://logichub.atlassian.net/browse/${branchName}`,
        pull_number: pull_request.number,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
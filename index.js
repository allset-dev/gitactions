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
    const jiraLink = `https://logichub.atlassian.net/browse/${branchName}`;
    const pull_number = pull_request.number;

    console.log(`token: ${token}`)
    console.log(`body: ${body}`);
    console.log(`The event payload: ${JSON.stringify(githubInfo, undefined, 2)}`);


    updatePRBody()

    async function updatePRBody() {
        const octokit = github.getOctokit(token);
        await octokit.request(`PATCH /repos/${repoOwner}/${repoName}/pulls/${pull_number}`, {
            owner: repoOwner,
            repo: repoName,
            pull_number,
            body: jiraLink
        });
    }
  } catch (error) {
    core.setFailed(error.message);
  }
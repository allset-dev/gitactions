const core = require('@actions/core');
const github = require('@actions/github');

async function run (){
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
        const pull_number = pull_request?.number;
        const octokit = github.getOctokit(token);

        console.log(`pull_request: ${pull_request}`)
        console.log(`token: ${token}`)
        console.log(`jiraLink: ${jiraLink}`);
        console.log(`The event payload: ${JSON.stringify(githubInfo, undefined, 2)}`);
    
    
    
        await octokit.request(`PATCH /repos/${repoOwner}/${repoName}/pulls/${pull_number}`, {
            owner: repoOwner,
            repo: repoName,
            pull_number,
            body: jiraLink
        });
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
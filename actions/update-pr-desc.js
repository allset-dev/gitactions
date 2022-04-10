const core = require('@actions/core');
const github = require('@actions/github');


export async function updatePrDesc() {
    const token = core.getInput('GITHUB_TOKEN', { required: true });

    const githubInfo = github?.context?.payload || {};
    const { base, pull_request } = githubInfo;
    const branchName = base?.ref || '';

    const jiraId = /allset-\d+/.exec(branchName)?.[0] || '';
    const [repoOwner = '', repoName = ''] = process?.env?.GITHUB_REPOSITORY?.split?.('/') || [];
    const jiraLink = jiraId? `https://logichub.atlassian.net/browse/${jiraId}`: '';
    const pull_number = pull_request?.number || null;

    console.log(`pull_request: ${pull_request}`)
    console.log(`jiraLink: ${jiraLink}`);
    console.log(`pull_number: ${pull_number}`);
    console.log(`repo: ${repoOwner}, ${repoName}`);
    console.log(`The event payload: ${JSON.stringify(githubInfo, undefined, 2)}`);



    if(jiraId && repoOwner && repoName && pull_number){
        const octokit = github.getOctokit(token);
        await octokit.request(`PATCH /repos/${repoOwner}/${repoName}/pulls/${pull_number}`, {
            owner: repoOwner,
            repo: repoName,
            pull_number,
            body: jiraLink
        });
    }else{
        if(pull_number){
            core.setFailed("Update-pr-desc action has been triggered for a non-pr action.");
        }else{
            core.setFailed("Update-pr-desc: some requested parameters are empty, check above console logs.");
        }
    }
}
const core = require('@actions/core');
const github = require('@actions/github');


export async function updatePrDesc() {
    const token = core.getInput('GITHUB_TOKEN', { required: true });

    const githubInfo = github?.context?.payload || {};
    const { base, head, pull_request } = githubInfo;
    const [repoOwner = '', repoName = ''] = process?.env?.GITHUB_REPOSITORY?.split?.('/') || [];
    const pull_number = pull_request?.number || null;
    const baseBranchName = base?.ref || '';
    const headBranchName = head?.ref || '';
    const bodyArray = [];

    const jiraEpicLink = getJiraLinkFromString({string: headBranchName});

    if(jiraEpicLink) {
        bodyArray.push('Jira epic link:');
        bodyArray.push(`\t${jiraEpicLink}`);
    }

    const jiraBugLink = getJiraLinkFromString({string: baseBranchName});

    if(jiraBugLink) {
        bodyArray.push('Jira story/bug link:');
        bodyArray.push(`\t${jiraBugLink}`);
    }

    const body = bodyArray.join('\n');

    console.log(`jiraId: ${baseBranchName}, ${headBranchName}, ${body}`)
    console.log(`pull_number: ${pull_number}`);
    console.log(`repo: ${repoOwner}, ${repoName}`);
    console.log(`The event payload: ${JSON.stringify(githubInfo, undefined, 2)}`);


    if(body && repoOwner && repoName && pull_number){
        const octokit = github.getOctokit(token);
        await octokit.request(`PATCH /repos/${repoOwner}/${repoName}/pulls/${pull_number}`, {
            owner: repoOwner,
            repo: repoName,
            pull_number,
            body,
        });
    }else{
        if(pull_number){
            core.setFailed("Update-pr-desc action has been triggered for a non-pr action.");
        }else{
            core.setFailed("Update-pr-desc: some requested parameters are empty, check above console logs.");
        }
    }
}

function getJiraLinkFromString({string}) {
    const jiraId = /allset-\d+/.exec(string)?.[0] || '';

    return jiraId ? `https://logichub.atlassian.net/browse/${jiraId}`: '';
}
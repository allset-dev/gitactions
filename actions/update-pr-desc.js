const core = require('@actions/core');
const github = require('@actions/github');


export async function updatePrDesc() {
    const token = core.getInput('GITHUB_TOKEN', { required: true });

    const pull_request = github?.context?.payload?.pull_request || {};
    const { base, head, number: pull_number } = pull_request;
    const [repoOwner = '', repoName = ''] = process?.env?.GITHUB_REPOSITORY?.split?.('/') || [];
    const baseBranchName = base?.ref || '';
    const headBranchName = head?.ref || '';
    const bodyArray = [];

    const itemsToCheckForJiraLink = [baseBranchName, headBranchName];

    const featureJiras = getFeatureJiras(itemsToCheckForJiraLink);
    const bugJiras = getBugJiras(itemsToCheckForJiraLink);

    if(featureJiras.length > 0) {
        bodyArray.push('Jira epic link:');
        featureJiras.forEach(featureJira => {
            bodyArray.push(`- ${featureJira}`);
        });

    }

    if(bugJiras.length > 0) {
        bodyArray.push('Jira story/bug link:');
        bugJiras.forEach(bugJira => {
            bodyArray.push(`- ${bugJira}`);
        });
    }
    

    const body = bodyArray.join('\n');

    console.log(`jiraId: ${baseBranchName}, ${headBranchName}, ${body}`)
    console.log(`pull_number: ${pull_number}`);
    console.log(`repo: ${repoOwner}, ${repoName}`);
    console.log(`The event payload: ${JSON.stringify(github?.context?.payload, undefined, 2)}`);


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
            core.setFailed("Update-pr-desc: some requested parameters are empty, check above console logs.");
        }else{
            core.setFailed("Update-pr-desc action has been triggered for a non-pr action.");
        }
    }
}


function getFeatureJiras(items) {
    return items.filter((item) => {
        const isItemFeatureJiraId = /feature-allset-\d+/.test(item);
        return isItemFeatureJiraId;
    }).map(item => getJiraLinkFromString(item));
}

function getBugJiras(items) {
    return items.map(item => getJiraLinkFromString(item)).filter(x => x);
}

function getJiraLinkFromString({string}) {
    const jiraId = /allset-\d+/.exec(string)?.[0] || '';

    return jiraId ? `https://logichub.atlassian.net/browse/${jiraId}`: '';
}
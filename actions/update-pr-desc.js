const core = require('@actions/core');
const github = require('@actions/github');


export async function updatePrDesc() {
    const token = core.getInput('GITHUB_TOKEN', { required: true });

    const pull_request = github?.context?.payload?.pull_request || {};
    const { base, head, number: pull_number } = pull_request;
    const [repoOwner = '', repoName = ''] = process?.env?.GITHUB_REPOSITORY?.split?.('/') || [];
    const baseBranchName = base?.ref || '';
    const headBranchName = head?.ref || '';

    const itemsToCheckForJiraLink = [baseBranchName, headBranchName];

    const jiraMarkdown = getJiraMarkdown(itemsToCheckForJiraLink);

    const body = jiraMarkdown;

    console.log(`The commits payload: ${JSON.stringify( github?.event?.commits?.[0]?.message, undefined, 2)}`);
    console.log(`The head_commit payload: ${JSON.stringify( github?.event?.head_commit?.message, undefined, 2)}`);
    console.log(`The event payload: ${JSON.stringify( github?.event, undefined, 2)}`);
    console.log(`The github payload: ${JSON.stringify(github, undefined, 2)}`);

    if(Boolean(body) && repoOwner && repoName && pull_number){
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
            console.log(`jiraId: ${baseBranchName}, ${headBranchName}, ${body}`)
            console.log(`pull_number: ${pull_number}`);
            console.log(`repo: ${repoOwner}, ${repoName}`);

            core.setFailed("Update-pr-desc action has been triggered for a non-pr action.");
        }
    }
}


function getJiraMarkdown(items) {
    const bodyArray = [];
    const featureJiras = [];
    const bugJiras = [];

    items.forEach(item => {
        const matchedItems = item.match(/(feature-)?allset-\d+/g);

        if(matchedItems) {
            matchedItems.forEach((matchedItem = '') => {
                const jiraLink = getJiraLinkFromString({string: matchedItem});

                if(jiraLink) {
                    if(matchedItem.startsWith('feature-')) {
                        featureJiras.push(jiraLink)
                    }else{
                        bugJiras.push(jiraLink)
                    }
                }
            });
        }
    });

    console.log(`featureJiras: ${JSON.stringify(featureJiras, undefined, 2)}`);
    console.log(`bugJiras: ${JSON.stringify(bugJiras, undefined, 2)}`);

    if(featureJiras.length > 0) {
        bodyArray.push('Jira epic link:\n');
        featureJiras.forEach(featureJira => {
            bodyArray.push(`- ${featureJira}`);
        });
        bodyArray.push('\n');
    }

    if(bugJiras.length > 0) {
        bodyArray.push('Jira story/bug link:\n');
        bugJiras.forEach(bugJira => {
            bodyArray.push(`- ${bugJira}`);
        });
        bodyArray.push('\n');
    }
    
    return  bodyArray.join('\n');
}

function getJiraLinkFromString({string}) {
    const jiraId = /allset-\d+/.exec(string)?.[0] || '';

    return jiraId ? `https://logichub.atlassian.net/browse/${jiraId}`: '';
}
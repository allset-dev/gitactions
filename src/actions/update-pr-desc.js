const core = require('@actions/core');
const github = require('@actions/github');

const {getCommitMessages} = require('../utils/commit-messsages');
const BODY_STRING = {
    EPIC: '>Jira epic link:',
    BUG: '>Jira story/bug link:'
}

export async function updatePrDesc() {
    const token = core.getInput('GITHUB_TOKEN', { required: true });

    const pull_request = github?.context?.payload?.pull_request || {};
    const { base, head, number: pull_number, body = '' } = pull_request;
    const [repoOwner = '', repoName = ''] = process?.env?.GITHUB_REPOSITORY?.split?.('/') || [];
    const baseBranchName = base?.ref || '';
    const headBranchName = head?.ref || '';
    const commitMessages = await getCommitMessages({repositoryOwner: repoOwner, repositoryName: repoName, pullRequestNumber: pull_number, token});

    console.log(`body: ${body}`);

    const itemsToCheckForJiraLink = [baseBranchName, headBranchName, ...commitMessages];

    const updatedBody = body.replace(/(?<=### Jira Link)(.*)(?=### Design)/g, (jiraSection) => {
        console.log(`jiraSection: ${jiraSection}`);
        return getJiraMarkdown(itemsToCheckForJiraLink, jiraSection);
    });

    console.log(`body: ${updatedBody} ${body !== updatedBody}`);
    console.log(`The github payload: ${JSON.stringify(github, undefined, 2)}`);

    if(body !== updatedBody) {
        if(Boolean(body) && repoOwner && repoName && pull_number){
            const octokit = github.getOctokit(token);
            await octokit.request(`PATCH /repos/${repoOwner}/${repoName}/pulls/${pull_number}`, {
                owner: repoOwner,
                repo: repoName,
                pull_number,
                body: updatedBody,
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
}


function getJiraMarkdown(items = [], jiraSection = '') {
    const [featureJirasSection = '', bugJirasSection = ''] = jiraSection.indexOf(BODY_STRING.BUG);
    console.log(`featureJirasSection: ${featureJirasSection}`);
    console.log(`bugJirasSection: ${bugJirasSection}`);

    const bodyArray = [];
    const featureJiras = getJiras(featureJirasSection)
    const bugJiras = getJiras(bugJirasSection);
    console.log(`featureJiras: ${JSON.stringify(featureJiras, undefined, 2)}`);
    console.log(`bugJiras: ${JSON.stringify(bugJiras, undefined, 2)}`);

    items.forEach(item => {
        const matchedItems = item.match(/(feature-)?allset-\d+/g);

        if(matchedItems) {
            matchedItems.forEach((matchedItem = '') => {
                const jiraLink = getJiraLinkFromString({string: matchedItem});

                if(jiraLink) {
                    if(!featureJiras.includes(jiraLink) && !bugJiras.includes(jiraLink)) {
                        if(matchedItem.startsWith('feature-')) {
                            featureJiras.push(jiraLink)
                        }else{
                            bugJiras.push(jiraLink)
                        }
                    }
                }
            });
        }
    });

    bodyArray.push(`${BODY_STRING.EPIC}\n`);
    if(featureJiras.length > 0) {
        featureJiras.forEach(featureJira => {
            bodyArray.push(`>- ${featureJira}`);
        });
        bodyArray.push('\n');
    }

    bodyArray.push(`${BODY_STRING.BUG}\n`);
    if(bugJiras.length > 0) {
        bugJiras.forEach(bugJira => {
            bodyArray.push(`>- ${bugJira}`);
        });
        bodyArray.push('\n');
    }
    
    return  bodyArray.join('\n');
}

function getJiraLinkFromString({string}) {
    const jiraId = /allset-\d+/.exec(string)?.[0] || '';

    return jiraId ? `https://logichub.atlassian.net/browse/${jiraId}`: '';
}

function getJiras(string){
    string.match(/https:\/\/logichub.atlassian.net\/browse\/allset-\d+/g) || [];
}

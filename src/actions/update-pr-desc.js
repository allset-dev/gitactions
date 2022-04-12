const core = require('@actions/core');
const github = require('@actions/github');

const {getCommitMessages} = require('../utils/commit-messsages');

const BODY_STRING = {
    EPIC: 'Jira epic link:',
    BUG: 'Jira story/bug link:'
}

const token = core.getInput('GITHUB_TOKEN', { required: true });
const JIRA_HOST_URL = core.getInput('JIRA_HOST_URL', { required: true });
const JIRA_PROJECT_NAME = core.getInput('JIRA_PROJECT_NAME', { required: true });

const JIRA_BROWSE = `${JIRA_HOST_URL}/browse`;

const JIRA_PROJECT_NAME_REGEX = new RegExp(`${JIRA_PROJECT_NAME}-\\d+`,'g');
const GIT_BRANCH_NAME_REGEX = new RegExp(`(feature-)?${JIRA_PROJECT_NAME_REGEX.source}`,'g');
const JIRA_LINK_REGEX = new RegExp(`${JIRA_BROWSE}/${JIRA_PROJECT_NAME_REGEX.source}`, 'g');

export async function updatePrDesc() {

    const pull_request = github?.context?.payload?.pull_request || {};
    const { base, head, number: pull_number, body = '' } = pull_request;
    const [repoOwner = '', repoName = ''] = process?.env?.GITHUB_REPOSITORY?.split?.('/') || [];
    const baseBranchName = base?.ref || '';
    const headBranchName = head?.ref || '';
    const commitMessages = await getCommitMessages({repositoryOwner: repoOwner, repositoryName: repoName, pullRequestNumber: pull_number, token});

    const itemsToCheckForJiraLink = [baseBranchName, headBranchName, ...commitMessages];

    const updatedBody = body.replace(/(?<=### Jira Link)(.*)(?=### Design)/gs, (jiraSection) => {
        return getJiraMarkdown(itemsToCheckForJiraLink, jiraSection);
    });

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
    const [featureJirasSection = '', bugJirasSection = ''] = jiraSection.split(BODY_STRING.BUG);

    const bodyArray = [];
    const featureJiras = getJiras(featureJirasSection)
    const bugJiras = getJiras(bugJirasSection);

    items.forEach(item => {
        const matchedItems = item.match(GIT_BRANCH_NAME_REGEX);

        if(matchedItems) {
            matchedItems.forEach((matchedItem = '') => {
                const jiraLink = getJiraLinkFromJiraId({string: matchedItem});

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

    bodyArray.push(`> ${BODY_STRING.EPIC}\n`);
    if(featureJiras.length > 0) {
        featureJiras.forEach(featureJira => {
            bodyArray.push(`> - ${featureJira}\n`);
        });
    }
    bodyArray.push('\n');

    bodyArray.push(`> ${BODY_STRING.BUG}\n`);
    if(bugJiras.length > 0) {
        bugJiras.forEach(bugJira => {
            bodyArray.push(`> - ${bugJira}\n`);
        });
    }
    bodyArray.push('\n');

    return  `\n\n${bodyArray.join('')}`;
}

function getJiraLinkFromJiraId({string}) {
    const jiraId = JIRA_PROJECT_NAME_REGEX.exec(string)?.[0] || '';

    return jiraId ? `${JIRA_BROWSE}/${jiraId}`: '';
}

function getJiras(string){
    return string.match(JIRA_LINK_REGEX) || [];
}

// NOTE: Test variables
// const JIRA_HOST_URL = "https://logichub.atlassian.net";
// const JIRA_PROJECT_NAME = "allset";
// const body = "### Brief Overview\r\n\r\nThis PR is to create/fix ...\r\n\r\n### Jira Link\r\n\r\n> Jira epic link:\r\n\r\n> Jira story/bug link:\r\n\r\n### Design\r\n\r\n> <i>Figma link goes here</i>\r\n\r\n### Screenshots\r\n\r\n> Delete this after adding screenshots\r\n\r\n### Feature Flag\r\n\r\n- 'Name goes here'\r\n\r\n### Cherry Pick\r\n\r\n- 'Version goes here'\r\n\r\n### Coding Guidelines\r\n\r\n- [ ] Props are sorted\r\n- [ ] Order of imports : external libraries, lh alias ( lhConstant, lhComponent, lhUtil ), es6/components, bundle imports, local components / styles\r\n- [ ] Order of declaration within a component : useBundle, useDispatch, useSelector, useMemo, useState, useEffect\r\n- [ ] Line breaks are added in styling\r\n- [ ] Css / SASS variables are used in the styles\r\n- [ ] Variable / functions follow the naming convention\r\n\r\n### Tested\r\n\r\n- [ ] Add things that were tested and other action items here.\r\n"
// const baseBranchName = "feature-allset-0008";
// const headBranchName = "allset-008";
// const commitMessages = ['asdasd'];

import * as core from '@actions/core';
import * as github from '@actions/github';

import {
  JIRA_HOST_URL,
  JIRA_PROJECT_NAME,
  getCommitMessages,
  octokit,
  REPO_NAME,
  REPO_OWNER,
  BASE_BRANCH_NAME,
  HEAD_BRANCH_NAME,
  PR_BODY,
  PR_NUMBER,
} from '../utils';

const BODY_STRING = {
  EPIC: 'Jira epic link:',
  BUG: 'Jira story/bug link:',
};

const JIRA_BROWSE = `${JIRA_HOST_URL}/browse`;

const JIRA_PROJECT_NAME_REGEX = new RegExp(`${JIRA_PROJECT_NAME}-\\d+`, 'g');
const GIT_BRANCH_NAME_REGEX = new RegExp(`(feature-)?${JIRA_PROJECT_NAME_REGEX.source}`, 'g');
const JIRA_LINK_REGEX = new RegExp(`${JIRA_BROWSE}/${JIRA_PROJECT_NAME_REGEX.source}`, 'g');

export async function updatePR() {
  const commitMessages = await getCommitMessages();

  const itemsToCheckForJiraLink = [BASE_BRANCH_NAME, HEAD_BRANCH_NAME, ...commitMessages];

  const updatedBody = PR_BODY.replace(/(?<=### Jira Link)(.*)(?=### Design)/gs, (jiraSection) => {
    return getJiraMarkdown(itemsToCheckForJiraLink, jiraSection);
  });

  console.log(`The github payload: ${JSON.stringify(github, undefined, 2)}`);
  if (PR_BODY !== updatedBody) {
    if (Boolean(PR_BODY) && REPO_OWNER && REPO_NAME && PR_NUMBER) {
      await octokit.rest.pulls.update({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        pull_number: PR_NUMBER,
        body: updatedBody,
      });
    } else {
      if (PR_NUMBER) {
        core.setFailed(
          'Update-pr-desc: some requested parameters are empty, check above console logs.'
        );
      } else {
        console.log(`jiraId: ${BASE_BRANCH_NAME}, ${HEAD_BRANCH_NAME}, ${PR_BODY}`);
        console.log(`pull_number: ${PR_NUMBER}`);
        console.log(`repo: ${REPO_OWNER}, ${REPO_NAME}`);

        core.setFailed('Update-pr-desc action has been triggered for a non-pr action.');
      }
    }
  }
}

function getJiraMarkdown(items = [], jiraSection = '') {
  const [featureJirasSection = '', bugJirasSection = ''] = jiraSection.split(BODY_STRING.BUG);

  const bodyArray = [];
  const featureJiras = getJiras(featureJirasSection);
  const bugJiras = getJiras(bugJirasSection);

  items.forEach((item) => {
    const matchedItems = item.match(GIT_BRANCH_NAME_REGEX);

    if (matchedItems) {
      matchedItems.forEach((matchedItem = '') => {
        const jiraLink = getJiraLinkFromJiraId({ string: matchedItem });

        if (jiraLink) {
          if (!featureJiras.includes(jiraLink) && !bugJiras.includes(jiraLink)) {
            if (matchedItem.startsWith('feature-')) {
              featureJiras.push(jiraLink);
            } else {
              bugJiras.push(jiraLink);
            }
          }
        }
      });
    }
  });

  bodyArray.push(`> ${BODY_STRING.EPIC}\n`);
  if (featureJiras.length > 0) {
    featureJiras.forEach((featureJira) => {
      bodyArray.push(`> - ${featureJira}\n`);
    });
  }
  bodyArray.push('\n');

  bodyArray.push(`> ${BODY_STRING.BUG}\n`);
  if (bugJiras.length > 0) {
    bugJiras.forEach((bugJira) => {
      bodyArray.push(`> - ${bugJira}\n`);
    });
  }
  bodyArray.push('\n');

  return `\n\n${bodyArray.join('')}`;
}

function getJiraLinkFromJiraId({ string = '' }) {
  const jiraId = string.match(JIRA_PROJECT_NAME_REGEX)?.[0] || '';

  return jiraId ? `${JIRA_BROWSE}/${jiraId}` : '';
}

function getJiras(string) {
  return string.match(JIRA_LINK_REGEX) || [];
}

// octokit.rest.pulls.create({
//   owner,
//   repo,
//   head,
//   base,
// });

import * as core from '@actions/core';
import * as github from '@actions/github';

import { octokit } from './get-octokit';
import { repoName, repoOwner, issue_number } from './get-inputs';
import { logObj } from './log';

export async function addLabels(labels = []) {
  core.info(`Adding labels (${logObj(labels)}) to PR...`);
  let addLabelResponse = await octokit.rest.issues.addLabels({
    owner: repoOwner,
    repo: repoName,
    issue_number,
    labels: labels,
  });
  core.info(`Added labels (${logObj(labels)}) to PR - ${addLabelResponse.status}`);
}

export async function removeLabel(label = '') {
  try {
    const labels = github?.context?.payload?.pull_request?.labels || [];

    const labelExist = labels.find(
      (currentLabel) => currentLabel.name.toLowerCase() === name.toLowerCase()
    );

    if (labelExist) {
      core.info(`Removing label (${label})`);
      let removeLabelResponse = await octokit.rest.issues.removeLabel({
        owner: repoOwner,
        repo: repoName,
        issue_number,
        name: label,
      });
      core.info(`Removed label - ${removeLabelResponse.status}`);
    }
  } catch (error) {
    core.info(`Failed to remove label (${label}) from PR: ${error}`);
  }
}

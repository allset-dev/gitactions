import * as core from '@actions/core';
import * as github from '@actions/github';

export const [REPO_OWNER = '', REPO_NAME = ''] =
  process?.env?.GITHUB_REPOSITORY?.split?.('/') || [];
export const ISSUE_NUMBER = github?.context?.issue.number || '';

const PULL_REQUEST = github?.context?.payload?.pull_request || {};
const { base, head, number, body = '' } = PULL_REQUEST;

export const BASE_BRANCH_NAME = base?.ref || '';
export const HEAD_BRANCH_NAME = head?.ref || '';
export const PR_NUMBER = number;
export const PR_BODY = body;

export const CHECK = core.getInput('CHECK', { required: true });
export const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN', { required: true });
export const JIRA_HOST_URL = core.getInput('JIRA_HOST_URL', { required: true });
export const JIRA_PROJECT_NAME = core.getInput('JIRA_PROJECT_NAME', { required: true });

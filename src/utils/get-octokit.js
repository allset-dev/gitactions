import * as github from '@actions/github';

import { GITHUB_TOKEN } from './get-inputs';

export const octokit = github.getOctokit(GITHUB_TOKEN);

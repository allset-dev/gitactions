import core from '@actions/core';

import { updatePrDesc } from './actions/update-pr-desc';
import { checkPrTitle } from './actions/check-pr-title';

function run() {
  try {
    const CHECK = core.getInput('CHECK', { required: true });

    switch (CHECK) {
      case 'title': {
        checkPrTitle();
        break;
      }

      case 'desc': {
        updatePrDesc();
        break;
      }

      default: {
        core.setFailed(`Provided CHECK: ${CHECK}. Does not exist.`);
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

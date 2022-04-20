import * as core from '@actions/core';

import { updatePR } from './actions/update-pr';
import { checkPR } from './actions/check-pr';

import { CHECK } from './utils/get-inputs';

function run() {
  try {
    switch (CHECK) {
      case 'checkPR': {
        checkPR();
        break;
      }

      case 'updatePR': {
        updatePR();
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

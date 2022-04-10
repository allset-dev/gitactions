const core = require('@actions/core');

const {updatePrDesc} = require('./actions/update-pr-desc');
const {checkPrTitle} = require('./actions/check-pr-title');

function run (){
    try {
        const check = core.getInput('CHECK', { required: true });

        switch(check){
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
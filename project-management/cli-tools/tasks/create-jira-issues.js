import fs from 'fs';
import path from 'path';
import jira from '../src/jira/index.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EPIC_ID = process.env.EPIC_ID;
const DESCRIPTION = process.env.DESCRIPTION;
const SUMMARY = process.env.SUMMARY;
const PROJECT_KEY = process.env.PROJECT_KEY;

if (!EPIC_ID) {
    console.error('Please provide the EPIC_ID');
    process.exit(1);
}

if (!DESCRIPTION) {
    console.error('Please provide the DESCRIPTION');
    process.exit(1);
}

if (!SUMMARY) {
    console.error('Please provide the SUMMARY');
    process.exit(1);
}

if (!PROJECT_KEY) {
    console.error('Please provide the PROJECT_KEY');
    process.exit(1);
}

const ESTIMATION = process.env.ESTIMATION || 0;

async function createTasks() {
    // read the issues for the epic
    const issues = await jira.getIssuesByEpic(EPIC_ID);
    // console.log(issues);
    const allSummaries = issues.map(issue => issue.fields.summary);
    // Read the repo names from all-js-services.json
    const repos = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'repo', 'current-p2-lambda.json')));
    // console.log(repos);
    for (const repo of repos) {
        const description = `${DESCRIPTION} for ${repo.name}, please check the Epic for details.`;
        const summary = `${SUMMARY} for ${repo.name}`;
        // Create Jira issue using repo
        if (allSummaries.find(summary => summary.includes(repo.name))) {
            console.log(`Jira issue for ${repo.name} already exists`);
            // update the issue
            const issue = issues.find(issue => issue.fields.summary.includes(repo.name));
            const response = await jira.updateTask(issue.id, summary, description, null, ESTIMATION);
            console.log(response);
        } else {
            console.log(`Creating Jira issue for ${repo.name}`);
            const response = await jira.createTask(PROJECT_KEY, summary, description, EPIC_ID, null, ESTIMATION);
            console.log(response);
        }
    }
}

createTasks();

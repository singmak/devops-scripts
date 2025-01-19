/**
 * Module for interacting with Jira API.
 * @module jira
 */

import axios from 'axios';
import { promises as fs } from 'fs';

import dotenv from '../dotenv.js'

dotenv();

const STORY_POINTS_FIELD_ID = 'customfield_10024';

const JIRA_HOST = 'https://fleetship.atlassian.net';

const email = process.env.JIRA_EMAIL;
const apiToken = process.env.JIRA_API_TOKEN;

const jiraApi = axios.create({
    baseURL: `${JIRA_HOST}/rest/api/3`,
    headers: {
        'Authorization': `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

/**
 * Retrieves issues associated with a given epic key or parent key.
 * @param {string} epicKey - The key of the epic.
 * @returns {Promise<Array>} - A promise that resolves to an array of issues.
 * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-get
 * @example
 * returns [
    const issues = [
        {
            expand: 'operations,versionedRepresentations,editmeta,changelog,renderedFields',
            id: '44190',
            self: 'https://fleetship.atlassian.net/rest/api/3/issue/44190',
            key: 'P2-13629',
            fields: { summary: 'upgrade paris2-api-vessel to Node 20' }
        }
    ];
 */
async function getIssuesByEpic(epicKey) {
    const jql = encodeURIComponent(`"Epic Link"=${epicKey} OR "Parent Link"=${epicKey} ORDER BY rank`);
    const response = await jiraApi.get(`/search?jql=${jql}&maxResults=100&fields=summary`);
    return response.data.issues; // 
}

/**
 * Creates a task in Jira.
 * @param {string} projectKey - The key of the project.
 * @param {string} summary - The summary of the task.
 * @param {string} description - The description of the task.
 * @param {string} parentKey - The key of the parent issue.
 * @param {string} fixVersionId - The ID of the fix version.
 * @param {number} [storyPoint=0] - The story points of the task (optional, default is 0).
 * @returns {Promise<Object>} - A promise that resolves to the created task.
 */
async function createTask(projectKey, summary, description, parentKey, fixVersionId, storyPoint) {

    const meta = {
        fields: {
            project: {
                key: projectKey
            },
            summary: summary,
            description: {
                type: 'doc',
                version: 1,
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: description
                            }
                        ]
                    }
                ]
            },
            parent: {
                key: parentKey
            },
            issuetype: {
                name: 'Task'
            },
            [STORY_POINTS_FIELD_ID]: storyPoint ?? 0
        }
    };

    if (fixVersionId) {
        meta.fields.fixVersions = [
            {
                id: fixVersionId
            }
        ];
    }

    const response = await jiraApi.post('/issue', meta);

    return response.data;
}

/**
 * Reads a JSON file and creates tasks in Jira based on the data.
 * @param {string} filePath - The path to the JSON file.
 * @param {string} projectKey - The key of the project.
 * @returns {Promise<void>} - A promise that resolves when all tasks are created.
 */
async function readJsonFileAndCreateTasks(filePath, projectKey) {
    const jsonData = JSON.parse(await fs.readFile(filePath, 'utf8'));
    jsonData.forEach(async (taskData) => {
        const { summary, description, parentKey, fixVersionName, storyPoint } = taskData;
        await createTask(projectKey, summary, description, parentKey, fixVersionName, storyPoint);
    });
}

/**
 * Retrieves the create issue fields for a given project.
 * @param {string} projectKey - The key of the project.
 * @returns {Promise<Object>} - A promise that resolves to the create issue fields.
 */
async function getCreateIssueFields(projectKey) {
    const response = await jiraApi.get(`/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes.fields`);
    return response.data;
}

export default {
    createTask,
    getCreateIssueFields,
    readJsonFileAndCreateTasks,
    getIssuesByEpic
};
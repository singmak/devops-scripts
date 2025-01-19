#!/usr/bin/env node

import dotenv from './dotenv.js'

dotenv();

// Importing modules for different services
import bitbucket from './bitbucket/index.js';
import jira from './jira/index.js';
import sonarqube from './sonarqube/index.js';
import tools from './tools/index.js';

import { program } from 'commander';
import * as util from './utils.js';

program.command('get-repositories')
    .option('-p, --projectKey <projectKey>', 'Project key')
    .option('-f, --fetch', 'Fetch the list of repositories from Bitbucket', false)
    .option('-l, --language <language>', 'Filter by language')
    .action(async (options) => {
        try {
            // Call the Bitbucket API to get the list of repositories
            let repositories = [];
            if (options.fetch) {
                repositories = await bitbucket.getBitbucketRepos('https://api.bitbucket.org', 'P2');
            } else {
                repositories = await bitbucket.getRepoFromCurrent();
            }

            // Print the list of repositories
            const filteredRepos = repositories.filter(({
                project, language
            }) => {
                if (!options.language && !options.projectKey) {
                    return true;
                }
                if (options.language === 'js') {
                    return project === options.projectKey && [
                        'javascript', 'typescript', 'nodejs'
                    ].includes(language);
                }
                if (options.language === 'no') {
                    return project === options.projectKey && !language;
                }
                return project === options.projectKey && language === options.language;
            });
            // console.log(JSON.stringify(filteredRepos, null, 2));
            console.log('Total repositories:', filteredRepos.length);
        } catch (error) {
            console.error('Failed to get the list of repositories:', error);
        }
    });

program.command('create-task')
    .option('-p, --projectKey <projectKey>', 'Project key')
    .option('-s, --summary <summary>', 'Summary')
    .option('-d, --description <description>', 'Description')
    .option('-par, --parentKey <parentKey>', 'Parent key')
    .option('-f, --fixVersionId <fixVersionId>', 'Fix version id')
    .option('-sp, --storyPoint <storyPoint>', 'Story point')
    .action(async (options) => {
        try {
            // Call the createTask function with the provided parameters
            await jira.createTask(options.projectKey, options.summary, options.description, options.parentKey, options.fixVersionId, options.storyPoint);

            console.log('Task created successfully!');
        } catch (error) {
            console.error('Failed to create task:', error);
        }
    });

program.command('create-tasks-from-json')
    .option('-f, --file <file>', 'JSON file path')
    .action(async (options) => {
        try {
            // Read the JSON file and create tasks
            await jira.readJsonFileAndCreateTasks(options.file);
            console.log('Tasks created successfully!');
        } catch (error) {
            console.error('Failed to create tasks from JSON:', error);
        }
    });

program.command('get-issues-by-epic')
    .option('-e, --epicKey <epicKey>', 'Epic key')
    .action(async (options) => {
        try {
            // Call the Jira API to get the issues by epic
            const issues = await jira.getIssuesByEpic(options.epicKey);

            // Print the list of issues
            console.log('List of issues by epic:');
            issues.forEach((issue) => {
                console.log(issue);
            });
        } catch (error) {
            console.error('Failed to get the issues by epic:', error.message);
        }
    });

program.command('create-sonarqube-user')
    .option('-u, --username <username>', 'Username')
    .option('-n, --name <name>', 'Name')
    .option('-p, --password <password>', 'Password')
    .option('-e, --email <email>', 'Email')
    .action(async (options) => {
        try {
            // Call the SonarQube API to create a user
            const password = options.password || util.generateRandomPassword();
            const username = options.username || util.generateDottedUsername(options.name);
            await sonarqube.createSonarQubeUser(username, options.name, password, options.email);

            console.log(`SonarQube user created successfully, username: ${username}, password: ${password}`);
        } catch (error) {
            console.error('Failed to create SonarQube user:', error);
        }
    });

program.command('calculate-text-byte-size')
    .option('-t, --text <text>', 'Text')
    .option('-f, --file <file>', 'File path')
    .action((options) => {
        try {
            if (options.file) {
                options.text = tools.readTextFromFile(options.file);
            }
            // Call the calculateByteSize function with the provided text
            const byteSize = tools.calculateByteSize(options.text);

            console.log('Byte size:', byteSize);
        } catch (error) {
            console.error('Failed to calculate byte size:', error);
        }
    });

program.command('get-bitbucket-workspaces')
    .option('-r, --role <role>', 'Role')
    .action(async (options) => {
        try {
            // Call the Bitbucket API to get the workspaces by role
            const workspaces = await bitbucket.getWorkspacesByRole('https://api.bitbucket.org', options.role);

            console.log('Workspaces:', workspaces);
        } catch (error) {
            console.error('Failed to get workspaces by role:', error);
        }
    });

program.command('get-bitbucket-privileges')
    .action(async () => {
        try {
            // Call the Bitbucket API to get the workspaces by role
            const privileges = await bitbucket.getBitbucketPrivileges('https://api.bitbucket.org');

            console.log('privileges:', privileges);
        } catch (error) {
            console.error('Failed to get privileges');
        }
    });




// Parse the command-line arguments
program.parse(process.argv);

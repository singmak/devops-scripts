import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Parser } from 'json2csv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const PAGE_SIZE = 20;

function jsonToCsv(json) {
  const parser = new Parser();
  const csv = parser.parse(json);
  return csv;
}

export async function storeRepos(repos) {
  const currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
  const fileName = `repos-${currentDate}-${currentTime}.json`;
  const repoFolderPath = path.join(__dirname, '..', '..', 'repo');

  try {
    if (!fs.existsSync(repoFolderPath)) {
      fs.mkdirSync(repoFolderPath, { recursive: true });
    }
  } catch (error) {
    console.error(`Failed to create 'repo' folder: ${error}`);
  }

  const projects = [
    'P2', 'CREW', 'DP', 'PAR'
  ];

  const projectMeta = projects.reduce((metaMap, projectName) => {
    const jsonRepos = repos.filter(({ project }) => project === projectName);
    // console.log('metaMap', metaMap);
    metaMap[projectName] = {
      jsonFilePath: path.join(repoFolderPath, `current-${projectName.toLowerCase()}.json`),
      csvFilePath: path.join(repoFolderPath, `current-${projectName.toLowerCase()}.csv`),
      jsonRepos,
      csvRepos: jsonToCsv(jsonRepos)
    };
    return metaMap;
  }, {});

  try {
    const filePath = path.join(repoFolderPath, fileName);
    const currentFilePath = path.join(repoFolderPath, 'current.json');

    await fs.promises.writeFile(filePath, JSON.stringify(repos, null, 2));
    await fs.promises.writeFile(currentFilePath, JSON.stringify(repos, null, 2));

    await Promise.all(Object.entries(projectMeta).map(async ([projectName, meta]) => {
      await fs.promises.writeFile(meta.jsonFilePath, JSON.stringify(meta.jsonRepos, null, 2));
      await fs.promises.writeFile(meta.csvFilePath, meta.csvRepos);
    }));
    return repos;
  } catch (error) {
    console.error(`Failed to store repositories: ${error}`);
  }
}

async function getRepoFromCurrent() {
  const repoFolderPath = path.join(__dirname, '..', '..', 'repo');
  const currentFilePath = path.join(repoFolderPath, 'current.json');

  try {
    const data = await fs.promises.readFile(currentFilePath, 'utf8');
    const repos = JSON.parse(data);
    storeRepos(repos);
    return repos;
  } catch (error) {
    console.error(`Failed to get repositories from current file: ${error}`);
    return [];
  }
}

export async function getWorkspacesByRole(baseUrl, role) {
  const url = `${baseUrl}/2.0/workspaces?role=${role}&pagelen=100`;
  const config = {
    auth: {
      username: process.env.BITBUCKET_USERNAME,
      password: process.env.BITBUCKET_PASSWORD
    }
  };

  try {
    const response = await axios.get(url, config);
    const teams = response.data.values.map(x => x.slug);
    return { role, teams };
  } catch (error) {
    console.error(`Failed to get workspace info: ${error}`);
    return null;
  }
}


export async function getBitbucketRepos(baseUrl) {
  const url = `${baseUrl}/2.0/repositories/fleetshipteam`;

  const config = {
    auth: {
      username: process.env.BITBUCKET_USERNAME,
      password: process.env.BITBUCKET_PASSWORD
    }
  };

  let nextPage = true;
  let page = 1;
  const responseArray = [];

  try {
    while (nextPage) {
      const response = await axios.get(url, {
        ...config,
        params: {
          page,
          pagelen: PAGE_SIZE,
        }
      });
      // console.log(responseArray.map(repo => repo.project));
      console.log(responseArray.length, '/', response.data.size);
      responseArray.push(...response.data.values);
      if (response.data.next) {
        page++;
      } else {
        nextPage = false;
      }
    }
    try {
      const repos = responseArray
        .map(repo => ({
          name: repo.name,
          project: repo.project.key,
          language: repo.language,
        }))
        .sort(({ name: a }, { name: b }) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
      await storeRepos(repos);
      return repos;
    } catch (error) {
      console.error(`Failed to get repositories: ${error}`);
      return [];
    }

    
  } catch (error) {
    console.error(`Failed to get repositories: ${error}`);
    return [];
  }
}

async function getBitbucketPrivileges(baseUrl) {
  return Promise.all([
    getWorkspacesByRole(baseUrl, 'member'),
    getWorkspacesByRole(baseUrl, 'collaborator'),
    getWorkspacesByRole(baseUrl, 'owner'),
  ]).then((values) => {
    const result = {};
    values.forEach(({ role, teams }) => {
      Object.assign(result, ...teams.map(t => ({ [t]: role })));
    });
    return { teams: result };
  }).catch((error) => {
    console.error(`Failed to get privileges: ${error}`);
    return {};
  });
};

export default {
  getBitbucketRepos,
  getRepoFromCurrent,
  getWorkspacesByRole,
  getBitbucketPrivileges,
};
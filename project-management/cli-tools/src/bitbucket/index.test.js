const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { storeRepos } = require('./index');

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

describe('storeRepos', () => {
  const mockRepos = [
    { project: 'P1', name: 'repo1' },
    { project: 'P2', name: 'repo2' },
    { project: 'P2', name: 'repo3' },
  ];

  const mockDate = new Date('2022-01-01T12:34:56.789Z');
  const mockISOString = '2022-01-01T12:34:56.789Z';
  const mockDateString = '2022-01-01';
  const mockTimeString = '12-34-56';

  beforeEach(() => {
    jest.spyOn(global.Date, 'now').mockImplementation(() => mockDate);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should store repositories and create necessary folders and files', async () => {
    const mockDirname = '/Users/singdev/dev/fleet/it-admin/cli-tools/src/bitbucket';
    const mockRepoFolderPath = path.join(mockDirname, '..', '..', 'repo');
    const mockFilePath = path.join(mockRepoFolderPath, `repos-${mockDateString}-${mockTimeString}.json`);
    const mockCurrentFilePath = path.join(mockRepoFolderPath, 'current.json');
    const mockCurrentP2FilePath = path.join(mockRepoFolderPath, 'current-p2.json');

    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false);
    jest.spyOn(fs, 'mkdirSync').mockImplementationOnce(() => {});

    await storeRepos(mockRepos);

    expect(fs.existsSync).toHaveBeenCalledWith(mockRepoFolderPath);
    expect(fs.mkdirSync).toHaveBeenCalledWith(mockRepoFolderPath, { recursive: true });

    expect(fs.promises.writeFile).toHaveBeenCalledWith(mockFilePath, JSON.stringify(mockRepos, null, 2));
    expect(fs.promises.writeFile).toHaveBeenCalledWith(mockCurrentFilePath, JSON.stringify(mockRepos, null, 2));
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      mockCurrentP2FilePath,
      JSON.stringify(mockRepos.filter(({ project }) => project === 'P2'), null, 2)
    );
  });

  it('should handle errors when creating "repo" folder', async () => {
    const mockError = new Error('Failed to create folder');
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false);
    jest.spyOn(fs, 'mkdirSync').mockImplementationOnce(() => {
      throw mockError;
    });
    jest.spyOn(console, 'error').mockImplementationOnce(() => {});

    await storeRepos(mockRepos);

    expect(fs.existsSync).toHaveBeenCalledWith(expect.any(String));
    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    expect(console.error).toHaveBeenCalledWith(`Failed to create 'repo' folder: ${mockError}`);
  });

  it('should handle errors when storing repositories', async () => {
    const mockError = new Error('Failed to store repositories');
    jest.spyOn(fs.promises, 'writeFile').mockRejectedValueOnce(mockError);
    jest.spyOn(console, 'error').mockImplementationOnce(() => {});

    await storeRepos(mockRepos);

    expect(fs.promises.writeFile).toHaveBeenCalledTimes(3);
    expect(console.error).toHaveBeenCalledWith(`Failed to store repositories: ${mockError}`);
  });
});
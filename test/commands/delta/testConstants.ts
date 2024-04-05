'use strict';

export const regExFile: string = 'regex.txt';
export const regExFileContents: string = '[Aa][Pp][Ee][Xx]::(.*?)::[Aa][Pp][Ee][Xx]';
export const sfdxConfigFile = 'sfdx-project.json';
const sfdxConfigFileContents = {
  packageDirectories: [{ path: 'force-app', default: true }, { path: 'packaged' }],
  namespace: '',
  sfdcLoginUrl: 'https://login.salesforce.com',
  sourceApiVersion: '58.0',
};
export const sfdxConfigJsonString = JSON.stringify(sfdxConfigFileContents, null, 2);

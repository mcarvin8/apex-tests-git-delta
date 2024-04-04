'use strict'
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';

export function retrieveCommitMessages(fromCommit: string, toCommit: string, regexFilePath: string): string[] {
    // ~1 to include the from commit SHA
    const gitLogCommand = `git log --format=%s ${fromCommit}~1..${toCommit}`;
    let commitMessages: string;
    try {
        commitMessages = execSync(gitLogCommand, { encoding: 'utf-8' });
    } catch (err) {
        throw Error('The git diff failed to run due to the above error.');
    }

    let regexPattern = '';
    try {
        regexPattern = fs.readFileSync(regexFilePath, 'utf-8').trim();
    } catch (err) {
        throw Error(`The regular expression was unable to be extracted from ${regexFilePath}`);
    }

    const regex = new RegExp(regexPattern, 'g');
    const matchedMessages: string[] = [];
    let match;
    while ((match = regex.exec(commitMessages)) !== null) {
        if (match[1]) {
            matchedMessages.push(match[1]);
        }
    }

    return matchedMessages;
}

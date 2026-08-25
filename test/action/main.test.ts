'use strict';

import * as core from '@actions/core';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { run } from '../../src/action/main.js';
import { extractTestClasses } from '../../src/service/extractTestClasses.js';

vi.mock('@actions/core');
vi.mock('../../src/service/extractTestClasses.js');

const extractMock = extractTestClasses as unknown as Mock;
const getInputMock = core.getInput as unknown as Mock;
const getBooleanInputMock = core.getBooleanInput as unknown as Mock;

function stubInputs(inputs: Record<string, string>, booleanInputs: Record<string, boolean> = {}): void {
  getInputMock.mockImplementation((name: string, options?: { required?: boolean }) => {
    const value = inputs[name] ?? '';
    if (value === '' && options?.required) {
      throw new Error(`Input required and not supplied: ${name}`);
    }
    return value;
  });
  getBooleanInputMock.mockImplementation((name: string) => booleanInputs[name] ?? false);
}

const baseResult = {
  validatedClasses: 'AccountTest ContactTest',
  warnings: [] as string[],
  suites: [] as string[],
};

describe('GitHub Action entrypoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps inputs to extractTestClasses, defaulting to/format and passing an undefined working directory', async () => {
    stubInputs({ from: 'HEAD~1' });
    extractMock.mockResolvedValue(baseResult);

    await run();

    expect(extractMock).toHaveBeenCalledWith('HEAD~1', 'HEAD', false, false, undefined);
  });

  it('passes through to, skip-test-validation, merge-base, and working-directory inputs', async () => {
    stubInputs(
      { from: 'main', to: 'develop', 'working-directory': 'project' },
      { 'skip-test-validation': true, 'merge-base': true },
    );
    extractMock.mockResolvedValue(baseResult);

    await run();

    expect(extractMock).toHaveBeenCalledWith('main', 'develop', true, true, 'project');
  });

  it('outputs a space-separated test list and count by default', async () => {
    stubInputs({ from: 'HEAD~1' });
    extractMock.mockResolvedValue(baseResult);

    await run();

    expect(core.setOutput).toHaveBeenCalledWith('tests', 'AccountTest ContactTest');
    expect(core.setOutput).toHaveBeenCalledWith('test-count', 2);
    expect(core.info).toHaveBeenCalledWith('Test classes: AccountTest ContactTest');
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('formats tests with --tests prefixes when format is "sf"', async () => {
    stubInputs({ from: 'HEAD~1', format: 'sf' });
    extractMock.mockResolvedValue(baseResult);

    await run();

    expect(core.setOutput).toHaveBeenCalledWith('tests', '--tests AccountTest --tests ContactTest');
  });

  it('reports an empty tests output and logs "(none)" when nothing resolves', async () => {
    stubInputs({ from: 'HEAD~1' });
    extractMock.mockResolvedValue({ ...baseResult, validatedClasses: '' });

    await run();

    expect(core.setOutput).toHaveBeenCalledWith('tests', '');
    expect(core.setOutput).toHaveBeenCalledWith('test-count', 0);
    expect(core.info).toHaveBeenCalledWith('Test classes: (none)');
  });

  it('fails the action on an invalid format without calling extractTestClasses', async () => {
    stubInputs({ from: 'HEAD~1', format: 'bogus' });

    await run();

    expect(extractMock).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith('Invalid format "bogus". Expected "space" or "sf".');
  });

  it('sets suites, suite-count, and logs resolved suites when suites are present', async () => {
    stubInputs({ from: 'HEAD~1' });
    extractMock.mockResolvedValue({ ...baseResult, suites: ['MyRegressionSuite', 'OtherSuite'] });

    await run();

    expect(core.setOutput).toHaveBeenCalledWith('suites', 'MyRegressionSuite\nOtherSuite');
    expect(core.setOutput).toHaveBeenCalledWith('suite-count', 2);
    expect(core.info).toHaveBeenCalledWith('Resolved test suites: MyRegressionSuite OtherSuite');
  });

  it('does not log resolved suites when none are present', async () => {
    stubInputs({ from: 'HEAD~1' });
    extractMock.mockResolvedValue(baseResult);

    await run();

    expect(core.info).not.toHaveBeenCalledWith(expect.stringContaining('Resolved test suites'));
  });

  it('propagates warnings to core.warning and the warnings output', async () => {
    stubInputs({ from: 'HEAD~1' });
    extractMock.mockResolvedValue({ ...baseResult, warnings: ['first warning', 'second warning'] });

    await run();

    expect(core.warning).toHaveBeenCalledWith('first warning');
    expect(core.warning).toHaveBeenCalledWith('second warning');
    expect(core.setOutput).toHaveBeenCalledWith('warnings', 'first warning\nsecond warning');
  });

  it('fails the action with the error message when extractTestClasses throws', async () => {
    stubInputs({ from: 'HEAD~1' });
    extractMock.mockRejectedValue(new Error('boom'));

    await run();

    expect(core.setFailed).toHaveBeenCalledWith('boom');
  });

  it('fails the action with String(error) when the thrown value is not an Error instance', async () => {
    stubInputs({ from: 'HEAD~1' });
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    extractMock.mockRejectedValue('a plain string rejection');

    await run();

    expect(core.setFailed).toHaveBeenCalledWith('a plain string rejection');
  });

  it('fails the action when the required "from" input is missing', async () => {
    stubInputs({});

    await run();

    expect(extractMock).not.toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith('Input required and not supplied: from');
  });
});

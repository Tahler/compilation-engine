import { Promise } from 'es6-promise';

import { DockerContainer } from './docker-container';
import { CompilationResult, Result, TestResult } from './results';
import { SupportedLanguages } from './supported-languages';
import { Test } from './test';

const DockerImage = 'compiler';

const CompileScript = './scripts/compile.sh';
// Must match the non-zero exit_code in `CompileScript`
const CompilationErrorCode = 127;
const RunScript = './scripts/run.sh';

const InputFilenamePrefix = 'input-';
const ExpectedOutputFilenamePrefix = 'expected-output-';
const ActualOutputFilenamePrefix = 'actual-output-';

const TimeoutCode = 124;

export class Runner {
  private compiler: string;
  private runtime: string;
  private filename: string;

  constructor(
      lang: string,
      private src: string,
      private seconds: number,
      private tests: Test[]) {
    let params = SupportedLanguages[lang];
    this.compiler = params.compiler;
    this.filename = params.filename;
    this.runtime = params.runtime;
  }

  isCompiled(): boolean {
    // !! converts a truthy value to a boolean.
    return !!this.compiler;
  }

  run(): Promise<Result> {
    // Start the container
    return this.startContainer().then(
      // Copy necessary files
      container => this.copySrc(container).then(
        // Compile, run, and return the result
        () => this.testUserCode(container).then(
          result => {
            container.cleanup();
            return result;
          },
          err => container.cleanup()
        ),
        err => container.cleanup()));
  }

  private startContainer(): Promise<DockerContainer> {
    let container = new DockerContainer(DockerImage);
    return container.start().then(() => container, err => console.error(err));
  }

  /**
   * Copies all the necessary files for execution.
   */
  private copySrc(container: DockerContainer): Promise<void> {
    return container.writeFile(this.src, this.filename);
  }

  private testUserCode(container: DockerContainer): Promise<Result> {
    return new Promise<Result>((resolve, reject) =>
      this.compileIfNecessary(container).then(
        result => {
          if (result.success) {
            resolve(this.runAllTests(container));
          } else {
            let compilationErrorResult: any = { status: 'CompilationError' };
            resolve(compilationErrorResult);
          }
        },
        err => reject(err)));
  }

  /**
   * If `this.lang` is a compiled language, this method will compile the program and resolve a
   * CompilationResult containing any possible errors. Otherwise, a successful CompilationResult is
   * immediately resolved.
   */
  private compileIfNecessary(container: DockerContainer): Promise<CompilationResult> {
    return new Promise<CompilationResult>((resolve, reject) => {
      if (this.isCompiled()) {
        container.runScript('bash', CompileScript, [this.compiler, this.filename]).then(
          output => {
            let err: any = output.err;
            let stderr = output.stderr;

            // TODO: clean this up into one return / one if resolve else rejects
            if (err || stderr) {
              if (err && err.code && parseInt(err.code) === CompilationErrorCode) {
                resolve({
                  success: false,
                  message: stderr
                });
              } else {
                reject(stderr);
              }
            } else {
              resolve({ success: true });
            }
          });
      } else {
        resolve({ success: true });
      }
    });
  }

  private runAllTests(container: DockerContainer): Promise<Result> {
    return new Promise<Result>((resolve, reject) => {
      // Run each test asynchronously
      let testRuns: Promise<TestResult>[] = this.tests.map((test, testNumber) =>
        // Write test input to the container
        container.writeFile(test.input, `${InputFilenamePrefix}${testNumber}`).then(
          // Run against input
          () => this.runTest(container, testNumber)));
      // Once all have been completed
      Promise.all(testRuns).then(
        testResults => {
          let totalExecTime = 0;
          let firstErr: TestResult;
          let hints = [];
          testResults.forEach(testResult => {
            if (testResult.status === 'Pass') {
              totalExecTime += testResult.execTime;
            } else {
              if (!firstErr) {
                firstErr = testResult;
              }
              if (testResult.hint) {
                hints.push(testResult.hint);
              }
            }
          });
          // TODO: cleanup
          let feebackResult: Result;
          if (firstErr) {
            feebackResult = { status: firstErr.status };
            if (firstErr.message) {
              feebackResult.message = firstErr.message;
            }
            if (hints.length) {
              feebackResult.hints = hints;
            }
          } else {
            feebackResult = {
              status: 'Pass',
              execTime: totalExecTime
            };
          }
          resolve(feebackResult);
        },
        err => console.error('Could not run all tests: ' + err));
    });
  }

  private runTest(container: DockerContainer, testNumber: number): Promise<TestResult> {
    let args = [
      this.seconds.toString(),
      this.runtime,
      `${InputFilenamePrefix}${testNumber}`,
      `${ActualOutputFilenamePrefix}${testNumber}`
    ];
    return new Promise<TestResult>((resolve, reject) =>
      container.runScript('bash', RunScript, args).then(
        output => {
          let err: any = output.err;
          if (err) {
            let failingTestResult: TestResult = err.code === TimeoutCode
              ? { status: 'Timeout' }
              : {
                status: 'RuntimeError',
                message: output.stdout
              };
            resolve(failingTestResult);
          } else {
            // TODO: cleanup - this should be returned?
            this.testPassed(container, testNumber).then(
              testPassed => {
                let testResult: TestResult;
                if (testPassed) {
                  testResult = {
                    status: 'Pass',
                    execTime: parseFloat(output.stdout)
                  };
                } else {
                  testResult = {
                    status: 'Fail'
                  };
                  let hint = this.tests[testNumber].hint;
                  if (hint) {
                    testResult.hint = hint;
                  }
                }
                resolve(testResult);
              });
          }
        }));
  }

  private testPassed(container: DockerContainer, testNumber: number): Promise<boolean> {
    let expectedOutput = this.tests[testNumber].output;
    let actualOutputFilename = `${ActualOutputFilenamePrefix}${testNumber}`;
    let expectedOutputFilename = `${ExpectedOutputFilenamePrefix}${testNumber}`;
    return container.writeFile(expectedOutput, expectedOutputFilename).then(
      () => container.filesAreIdentical(expectedOutputFilename, actualOutputFilename));
  }
}

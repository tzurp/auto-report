import path from "path";
import fs from 'fs';
const fsPromises = fs.promises;

export class TestReport {
    faildTestList: Array<TestRun>;
    _failedTestsNumber: number;
    passedTestsNumber: number;
    appName: string;
    suiteName: string;
    runDate: string;

    _totalTestsNumber: number;

    get failedTestsNumber(): number {
        this._failedTestsNumber = this.faildTestList.length;

        return this._failedTestsNumber;
    }

    get totalTestsNumber(): number {
        this._totalTestsNumber = this._failedTestsNumber + this.passedTestsNumber;
        return this._totalTestsNumber;
    }

    constructor() {
        this.faildTestList = new Array<TestRun>();
        this._failedTestsNumber = 0;
        this.passedTestsNumber = 0;
        this._totalTestsNumber = 0;
        this.appName = "";
        this.suiteName = "";
        this.runDate = "";
    }

    async prepareSuiteTestReport(reportPath: string, currentTestRuns: TestRun[]): Promise<void> {
        console.log("............prepareSuiteTestReport started.................");
        console.log("reportPath = " + reportPath);
        console.log("currentTestRuns inside prepareSuiteTestReport= " + JSON.stringify(currentTestRuns));
        for (const currentTestRun of currentTestRuns) {
            if (!currentTestRun.isPass) {
                const tempTestRun = new TestRun();
                
                tempTestRun.testName = currentTestRun.testName;
                
                tempTestRun.suiteName = currentTestRun.suiteName;
                
                tempTestRun.isPass = currentTestRun.isPass;
                
                this.faildTestList.push(tempTestRun);

                this.failedTestsNumber;
            }
            else {
                this.passedTestsNumber++;
            }
        }

        this.totalTestsNumber;
        // TODO: write the suiteTestReport to file
        await this.exportCurrentTestReport(reportPath)
    }

    async exportCurrentTestReport(reportPath: string): Promise<void> {
        const time = new Date().getTime().toString();
        const tempTestReport = new TestReport();

        const filePath = path.join(reportPath, `${this.appName}_${this.suiteName}_${time}.json`);
        console.log("FIlePath = " + filePath);
        tempTestReport.appName = this.appName;
        tempTestReport.suiteName = this.suiteName;
        tempTestReport.faildTestList = this.faildTestList;
        tempTestReport.passedTestsNumber = this.passedTestsNumber;
        tempTestReport.failedTestsNumber;
        tempTestReport.totalTestsNumber;
        await fsPromises.writeFile(filePath, JSON.stringify(tempTestReport));//JSON.stringify(tempTestReport)
    }

    writeReportToCsv(testReport: TestReport): void {

    }
}

export class TestRun {
    testName: string;
    suiteName: string;
    isPass: boolean;

    constructor() {
        this.testName = "";
        this.isPass = false;
        this.suiteName = "";
    }
}
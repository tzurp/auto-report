import path from "path";
import fs from 'fs';
const fsPromises = fs.promises;

/**
 * Please don't change or add ANY property of this class because it depends on the main framework data structure.
 */
export class TestReport {
    faildTestList: Array<TestRun>;
    failedTestsNumber: number;
    passedTestsNumber: number;
    appName: string;
    suiteName: string;
    runDate: string;
    totalTestsNumber: number;


    constructor() {
        this.faildTestList = new Array<TestRun>();
        this.failedTestsNumber = 0;
        this.passedTestsNumber = 0;
        this.totalTestsNumber = 0;
        this.appName = "";
        this.suiteName = "";
        this.runDate = "";
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
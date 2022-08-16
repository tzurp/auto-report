import path from "path";
import { TestReport } from "./types/test-report";
import fs from "fs";
const extract = require('extract-zip')

const fsPromises = fs.promises;

export class BL {
    get autoReportDir(): string {
        return "./auto-reports";
    }

    async ProcessTestResults(): Promise<void> {
        const allResults = new Array<boolean>();
        const pathToCSV = path.join(this.autoReportDir, "Report.csv")
        const parentPath = path.resolve(__dirname, '..');
        const autoReportsDir = path.join(parentPath, this.autoReportDir);

        const allFiles = await fsPromises.readdir(autoReportsDir, { encoding: "utf8" });

        const zipFiles = allFiles.filter(zf => zf.split('.')[zf.split('.').length - 1] == "zip");

        if (!zipFiles || (zipFiles && zipFiles.length < 1)) {
            const err = "No zip files found!";

            console.log('\x1b[31m%s\x1b[0m', err);

            throw new Error(err);
        }

        await fsPromises.writeFile(pathToCSV, `Automation Report\n`);

        for (const zipFile of zipFiles) {
            await fsPromises.mkdir(path.join(autoReportsDir, "files"));

            try {
                const zipFilePath = path.join(parentPath, this.autoReportDir, zipFile);

                await extract(zipFilePath, { dir: path.join(parentPath, this.autoReportDir, "files") })

                console.log('\x1b[36m%s\x1b[0m', `Zip extraction of ${zipFilePath} completed successfully`)
            } catch (err) {
                console.log('\x1b[31m%s\x1b[0m', "unzip error: " + err);

                throw new Error("unzip error: " + err);
            }

            const groupedTestReports = await this.consolidateTestResults();

            const finalReports = await this.GenerateTestReport(groupedTestReports);

            //await fsPromises.writeFile(path.join(this.autoReportDir, "finalReport.json"), JSON.stringify(finalReport));

            let result = await this.writeCSV(pathToCSV, finalReports);

            allResults.push(result);

            await fsPromises.rm(path.join(autoReportsDir, "files"), { recursive: true, force: true });
        }

        if (allResults.filter(r => r == true).length == zipFiles.length) {
                console.log('\x1b[32m%s\x1b[0m', "All test reports exported successfully to the CSV file ((:");
        }
        else {
            console.log('\x1b[31m%s\x1b[0m', "Some test reports failed to export!!!");
        }
    }

    async writeCSV(reportPath: string, testReports: Array<TestReport>): Promise<boolean> {
        try {
            await fsPromises.appendFile(reportPath, `${testReports[0].appName}\n`);

            for (const testReportAppSuite of testReports) {
                await fsPromises.appendFile(reportPath, `${testReportAppSuite.appName}.${testReportAppSuite.suiteName}\n`);

                await fsPromises.appendFile(reportPath, `Failed, ${testReportAppSuite.failedTestsNumber}\n`);

                if (testReportAppSuite.faildTestList.length > 0) {
                    fsPromises.appendFile(reportPath, "Test Name, Bug, Owner, Remarks\n");
                }

                for (const failedTests of testReportAppSuite.faildTestList) {

                    fsPromises.appendFile(reportPath, `${failedTests.testName}\n`);
                }

                await fsPromises.appendFile(reportPath, `passed, ${testReportAppSuite.passedTestsNumber}\n`);

                await fsPromises.appendFile(reportPath, `Total, ${testReportAppSuite.totalTestsNumber}\n`);
            }
        }
        catch (err) {
            throw new Error(`writeCSV error: ${err}`);
        }
        return true;
    }

    private async GenerateTestReport(groupedTestReports: TestReport[][]): Promise<Array<TestReport>> {
        const finalReport = new Array<TestReport>();

        for (const appSuiteGroupTestReports of groupedTestReports) {
            const consolidatedTestReport = new TestReport();
            consolidatedTestReport.appName = appSuiteGroupTestReports[0].appName;
            consolidatedTestReport.suiteName = appSuiteGroupTestReports[0].suiteName;

            for (const testReport of appSuiteGroupTestReports) {
                consolidatedTestReport.faildTestList.push(...testReport.faildTestList);

                consolidatedTestReport.failedTestsNumber;

                consolidatedTestReport.passedTestsNumber += testReport.passedTestsNumber;

                consolidatedTestReport.totalTestsNumber;
            }

            finalReport.push(consolidatedTestReport);
        }

        return finalReport;
    }

    private async consolidateTestResults(): Promise<TestReport[][]> {

        const testReports = new Array<TestReport>();

        const autoReportDir = path.join(this.autoReportDir, "files");

        const files = await fsPromises.readdir(autoReportDir);

        for (const file of files) {
            const fileDataString = await fsPromises.readFile(path.join(autoReportDir, file), { encoding: "utf8" });

            const FileData = JSON.parse(fileDataString) as TestReport;

            testReports.push(FileData);
        };


        const group = this.groupBy(testReports, t => t.appName && t.suiteName);

        return group;
    }

    groupBy<T, K>(list: T[], getKey: (item: T) => K) {
        const map = new Map<string, T[]>();

        list.forEach((item) => {
            const key = JSON.stringify(getKey(item));

            const collection = map.get(key)

            if (!collection) {
                map.set(key, [item]);
            } else {
                collection.push(item);
            }
        });
        return Array.from(map.values());
    }
}
import path from "path";
import { TestReport } from "./types/test-report";
import fs from "fs";
import extract from 'extract-zip';
import { Group } from "./helpers/group";

const fsPromises = fs.promises;

export class BL {
    autoReportDir = "./auto-reports";
    tempFilesDir = "files";
    parentPath = path.resolve(__dirname, '..');
    autoReportsDir = path.join(this.parentPath, this.autoReportDir);
    pathToCSV = path.join(this.autoReportDir, "Report.csv");

    async ProcessTestResults(): Promise<void> {
        const allResults = new Array<boolean>();

        const finalReports = new Array<TestReport[]>();


        const allFiles = await fsPromises.readdir(this.autoReportsDir, { encoding: "utf8" });

        const zipFiles = allFiles.filter(zf => zf.split('.')[zf.split('.').length - 1] == "zip");

        if (!zipFiles || (zipFiles && zipFiles.length < 1)) {
            const err = "No zip files found!";

            console.log('\x1b[31m%s\x1b[0m', err);

            throw new Error(err);
        }

        await fsPromises.writeFile(this.pathToCSV, `Automation Report\n`);

        for (const zipFile of zipFiles) {
            await fsPromises.mkdir(path.join(this.autoReportsDir, this.tempFilesDir), { recursive: true });

            try {
                const zipFilePath = path.join(this.parentPath, this.autoReportDir, zipFile);

                await extract(zipFilePath, { dir: path.join(this.parentPath, this.autoReportDir, this.tempFilesDir) })

                console.log('\x1b[36m%s\x1b[0m', `Zip extraction of '${zipFilePath}' completed successfully (:)`)
            } catch (err) {
                console.log('\x1b[31m%s\x1b[0m', "unzip error: " + err);

                throw new Error("unzip error: " + err);
            }

            const groupedTestReports = await this.consolidateTestResults();

            const finalReport = this.GenerateTestReport(groupedTestReports);

            finalReports.push(finalReport);

            await fsPromises.rm(path.join(this.autoReportsDir, this.tempFilesDir), { recursive: true, force: true });
        }

        await this.writeCSV(finalReports);
    }

    private async writeCSV(testReports: Array<TestReport[]>): Promise<void> {
        // Run through each app
        for (const testReport of testReports) {
            const reportText = new Array<string>();
            const passed = testReport.reduce((result, curr) => { return result + curr.passedTestsNumber }, 0);
            const total = testReport.reduce((result, curr) => { return result + curr.totalTestsNumber }, 0);
            const passRate = (100 * (passed / total)).toFixed(0);

            reportText.push(`${testReport[0].appName}\n`);

            reportText.push(`Success Rate, ${passRate}\n`);

            reportText.push(`--------------------------\n`);
            
            // prepare suites
            for (const testReportAppSuite of testReport) {
                
                reportText.push(`${testReportAppSuite.appName}.${testReportAppSuite.suiteName}\n`);

                reportText.push(`Failed, ${testReportAppSuite.failedTestsNumber}\n`);

                if (testReportAppSuite.faildTestList.length > 0) {
                    reportText.push("Test Name, Bug, Owner, Remarks\n");
                }

                for (const failedTests of testReportAppSuite.faildTestList) {
                    reportText.push(`${failedTests.testName}\n`);
                }

                reportText.push(`passed, ${testReportAppSuite.passedTestsNumber}\n`)

                reportText.push(`Total, ${testReportAppSuite.totalTestsNumber}\n`);
            }

            reportText.push("\n");

            // writre to file
            for (let i = 0; i < reportText.length; i++) {
                try {
                    await fsPromises.appendFile(this.pathToCSV, reportText[i]);
                }
                catch (err) {
                    console.log('\x1b[31m%s\x1b[0m', `Write to CSV error: ${err}`);
                }
            }

            console.log('\x1b[32m%s\x1b[0m', `${testReports.indexOf(testReport) + 1}) report for ${testReport[0].appName} exported successfully to the CSV file (:`);
        }
    }

    private GenerateTestReport(groupedTestReports: TestReport[][]): Array<TestReport> {
        const finalReport = new Array<TestReport>();

        for (const appSuiteGroupTestReports of groupedTestReports) {
            const consolidatedTestReport = new TestReport();
            consolidatedTestReport.appName = appSuiteGroupTestReports[0].appName;
            consolidatedTestReport.suiteName = appSuiteGroupTestReports[0].suiteName;

            for (const testReport of appSuiteGroupTestReports) {
                consolidatedTestReport.faildTestList.push(...testReport.faildTestList);
            }

            consolidatedTestReport.totalTestsNumber = appSuiteGroupTestReports.reduce((sum, t) => { return sum + t.totalTestsNumber }, 0);

            consolidatedTestReport.failedTestsNumber = consolidatedTestReport.faildTestList.length;

            consolidatedTestReport.passedTestsNumber = consolidatedTestReport.totalTestsNumber - consolidatedTestReport.failedTestsNumber;

            finalReport.push(consolidatedTestReport);
        }

        return finalReport;
    }

    private async consolidateTestResults(): Promise<TestReport[][]> {
        let files = new Array<string>();
        const testReports = new Array<TestReport>();

        const autoReportDir = path.join(this.autoReportDir, this.tempFilesDir);

        try {
            files = await fsPromises.readdir(autoReportDir);
        }
        catch (err) {
            console.log(`Rreaddir error: ${err}`);
        }

        for (const file of files) {
            let fileDataString: string = "";
            let filePath = "";

            try {
                filePath = path.join(autoReportDir, file);

                fileDataString = await fsPromises.readFile(filePath, { encoding: "utf8" });
            }
            catch (err) {
                console.log(`Read file error of ${filePath}: ${err}`);
            }

            const FileData = JSON.parse(fileDataString) as TestReport;

            testReports.push(FileData);
        };

        const group = new Group().groupBy(testReports, t => t.suiteName);

        return group;
    }
}
import path from "path";
import { TestReport } from "./test-report";
import fs from "fs";

const fsPromises = fs.promises;

export class BL {
    get autoReportDir(): string {
        return "./auto-reports";
    }

    async ProcessTestResults(): Promise<void> {
        const groupedTestReports = await this.consolidateTestResults();

        // TODO: delete
        console.info("groupedTestReports = " + JSON.stringify(groupedTestReports));

        const finalReport = await this.GenerateTestReport(groupedTestReports);

        await fsPromises.writeFile(path.join(this.autoReportDir, "finalReport.txt"), JSON.stringify(finalReport));
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
            }

            finalReport.push(consolidatedTestReport);
        }

        return finalReport;
    }

    private async consolidateTestResults(): Promise<TestReport[][]> {

        const testReports = new Array<TestReport>();
        const autoReportDir = path.join(this.autoReportDir, "files");
        console.log("Files path= " + autoReportDir);
        const files = await fsPromises.readdir(autoReportDir);

        // TODO: delete
        console.log("GetConsolidateFiles from: " + autoReportDir + ";" + JSON.stringify(files));

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
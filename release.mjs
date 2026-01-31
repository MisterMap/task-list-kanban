import { execSync } from "child_process";
import { readFileSync } from "fs";

// Read the updated version from package.json
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const version = packageJson.version;

console.log(`Releasing version ${version}`);

// Commit, tag, and push
execSync(`git commit -am "Release ${version}"`, { stdio: "inherit" });
execSync(`git tag ${version}`, { stdio: "inherit" });
execSync("git push", { stdio: "inherit" });
execSync("git push --tags", { stdio: "inherit" });

console.log(`Successfully released version ${version}`);


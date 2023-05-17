import * as core from "@actions/core";
import * as installer from "./installer";

async function run() {
  try {
    let version = core.getInput("version");
    let includePreReleases = convertToBoolean(
      core.getInput("include-pre-releases")
    );
    let repoToken = core.getInput("repo-token");
    await installer.getProtoc(version, includePreReleases, repoToken);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();

function convertToBoolean(input: string): boolean {
  try {
    return JSON.parse(input);
  } catch (e) {
    return false;
  }
}

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load tempDirectory before it gets wiped by tool-cache
let tempDirectory = process.env["RUNNER_TEMP"] || "";
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const util = __importStar(require("util"));
const restm = __importStar(require("typed-rest-client/RestClient"));
const semver = __importStar(require("semver"));
if (!tempDirectory) {
    let baseLocation;
    if (process.platform === "win32") {
        // On windows use the USERPROFILE env variable
        baseLocation = process.env["USERPROFILE"] || "C:\\";
    }
    else {
        if (process.platform === "darwin") {
            baseLocation = "/Users";
        }
        else {
            baseLocation = "/home";
        }
    }
    tempDirectory = path.join(baseLocation, "actions", "temp");
}
const core = __importStar(require("@actions/core"));
const tc = __importStar(require("@actions/tool-cache"));
const exc = __importStar(require("@actions/exec"));
const io = __importStar(require("@actions/io"));
let osPlat = os.platform();
let osArch = os.arch();
function getProtoc(version, includePreReleases, repoToken) {
    return __awaiter(this, void 0, void 0, function* () {
        // resolve the version number
        const targetVersion = yield computeVersion(version, includePreReleases, repoToken);
        if (targetVersion) {
            version = targetVersion;
        }
        process.stdout.write("Getting protoc version: " + version + os.EOL);
        // look if the binary is cached
        let toolPath;
        toolPath = tc.find("protoc", version);
        // if not: download, extract and cache
        if (!toolPath) {
            toolPath = yield downloadRelease(version);
            process.stdout.write("Protoc cached under " + toolPath + os.EOL);
        }
        // add the bin folder to the PATH
        toolPath = path.join(toolPath, "bin");
        core.addPath(toolPath);
        // make available Go-specific compiler to the PATH,
        // this is needed because of https://github.com/actions/setup-go/issues/14
        const goBin = yield io.which("go", false);
        if (goBin) {
            // Go is installed, add $GOPATH/bin to the $PATH because setup-go
            // doesn't do it for us.
            let stdOut = "";
            let options = {
                listeners: {
                    stdout: (data) => {
                        stdOut += data.toString();
                    }
                }
            };
            yield exc.exec("go", ["env", "GOPATH"], options);
            const goPath = stdOut.trim();
            core.debug("GOPATH: " + goPath);
            core.addPath(path.join(goPath, "bin"));
        }
    });
}
exports.getProtoc = getProtoc;
function downloadRelease(version) {
    return __awaiter(this, void 0, void 0, function* () {
        // Download
        version = denormalizeVersion(version);
        let fileName = getFileName(version);
        let downloadUrl = util.format("https://github.com/protocolbuffers/protobuf/releases/download/%s/%s", version, fileName);
        process.stdout.write("Downloading archive: " + downloadUrl + os.EOL);
        let downloadPath = null;
        try {
            downloadPath = yield tc.downloadTool(downloadUrl);
        }
        catch (error) {
            core.debug(error);
            throw `Failed to download version ${version}: ${error}`;
        }
        // Extract
        let extPath = yield tc.extractZip(downloadPath);
        // Install into the local tool cache - node extracts with a root folder that matches the fileName downloaded
        return yield tc.cacheDir(extPath, "protoc", version);
    });
}
function denormalizeVersion(version) {
    const parsed = semver.parse(version);
    // We normalized versions like 21.10 into 21.10.0 earlier; to actually get
    // their file we have to de-normalize them back to 21.10.
    if (parsed.major > 3) {
        // We intentionally re-add the `v` prefix here, since the version
        // coming in is from computeVersion, which also explicitly adds it.
        version = `v${parsed.major}.${parsed.minor}`;
        core.debug(`denormalized ${parsed.version} to ${version}`);
    }

    return version;
}
function getFileName(version) {
    // to compose the file name, strip the leading `v` char
    if (version.startsWith("v")) {
        version = version.slice(1, version.length);
    }
    // The name of the Windows package has a different naming pattern
    if (osPlat == "win32") {
        const arch = osArch == "x64" ? "64" : "32";
        return util.format("protoc-%s-win%s.zip", version, arch);
    }
    const arch = osArch == "x64" ? "x86_64" : "x86_32";
    if (osPlat == "darwin") {
        return util.format("protoc-%s-osx-%s.zip", version, arch);
    }
    return util.format("protoc-%s-linux-%s.zip", version, arch);
}
// Retrieve a list of versions scraping tags from the Github API
function fetchVersions(includePreReleases, repoToken) {
    return __awaiter(this, void 0, void 0, function* () {
        let rest;
        if (repoToken != "") {
            rest = new restm.RestClient("setup-protoc", "", [], {
                headers: { Authorization: "Bearer " + repoToken }
            });
        }
        else {
            rest = new restm.RestClient("setup-protoc");
        }
        let tags = [];
        for (let pageNum = 1, morePages = true; morePages; pageNum++) {
            let nextPage = (yield rest.get("https://api.github.com/repos/protocolbuffers/protobuf/releases?page=" +
                pageNum)).result || [];
            if (nextPage.length > 0) {
                tags = tags.concat(nextPage);
            }
            else {
                morePages = false;
            }
        }
        return tags
            .filter(tag => tag.tag_name.match(/v\d+\.[\w\.]+/g))
            .filter(tag => includePrerelease(tag.prerelease, includePreReleases))
            .map(tag => tag.tag_name.replace("v", ""))
            .map(normalizeTag);
    });
}
// Starting after v3.20.3, the tagging scheme switched to vX.Y, where
// X is the former minor and Y is the former patch.
// This "normalizes" the new tagging scheme into a semver-style vX.Y.Z,
// where Z is always 0.
function normalizeTag(tag) {
    if (tag.split(".").length === 3) {
        return tag;
    } else if (tag.split(".").length === 2) {
        core.debug(`normalizing release tag ${tag} to ${tag}.0`);
        return `${tag}.0`;
    }

    throw new Error(`unexpected release tag format: ${tag}`);
}
// Compute an actual version starting from the `version` configuration param.
function computeVersion(version, includePreReleases, repoToken) {
    return __awaiter(this, void 0, void 0, function* () {
        // strip leading `v` char (will be re-added later)
        if (version.startsWith("v")) {
            version = version.slice(1, version.length);
        }
        // strip trailing .x chars
        if (version.endsWith(".x")) {
            version = version.slice(0, version.length - 2);
        }
        const allVersions = yield fetchVersions(includePreReleases, repoToken);
        const validVersions = allVersions.filter(v => semver.valid(v));
        const possibleVersions = validVersions.filter(v => v.startsWith(version));
        const versionMap = new Map();
        possibleVersions.forEach(v => versionMap.set(normalizeVersion(v), v));
        const versions = Array.from(versionMap.keys())
            .sort(semver.rcompare)
            .map(v => versionMap.get(v));
        core.debug(`evaluating ${versions.length} versions`);
        if (versions.length === 0) {
            throw new Error("unable to get latest version");
        }
        core.debug(`matched: ${versions[0]}`);
        return "v" + versions[0];
    });
}
// Make partial versions semver compliant.
function normalizeVersion(version) {
    const preStrings = ["beta", "rc", "preview"];
    const versionPart = version.split(".");
    // drop invalid
    if (versionPart[1] == null) {
        //append minor and patch version if not available
        // e.g. 2 -> 2.0.0
        return version.concat(".0.0");
    }
    else {
        // handle beta and rc
        // e.g. 1.10beta1 -? 1.10.0-beta1, 1.10rc1 -> 1.10.0-rc1
        if (preStrings.some(el => versionPart[1].includes(el))) {
            versionPart[1] = versionPart[1]
                .replace("beta", ".0-beta")
                .replace("rc", ".0-rc")
                .replace("preview", ".0-preview");
            return versionPart.join(".");
        }
    }
    if (versionPart[2] == null) {
        //append patch version if not available
        // e.g. 2.1 -> 2.1.0
        return version.concat(".0");
    }
    else {
        // handle beta and rc
        // e.g. 1.8.5beta1 -> 1.8.5-beta1, 1.8.5rc1 -> 1.8.5-rc1
        if (preStrings.some(el => versionPart[2].includes(el))) {
            versionPart[2] = versionPart[2]
                .replace("beta", "-beta")
                .replace("rc", "-rc")
                .replace("preview", "-preview");
            return versionPart.join(".");
        }
    }
    return version;
}
function includePrerelease(isPrerelease, includePrereleases) {
    return includePrereleases || !isPrerelease;
}

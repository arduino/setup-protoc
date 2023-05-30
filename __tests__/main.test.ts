import * as io from "@actions/io";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import nock from "nock";

const toolDir = path.join(__dirname, "runner", "tools");
const tempDir = path.join(__dirname, "runner", "temp");
const dataDir = path.join(__dirname, "testdata");
const IS_WINDOWS = process.platform === "win32";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

process.env.RUNNER_TEMP = tempDir;
process.env.RUNNER_TOOL_CACHE = toolDir;
import * as installer from "../src/installer";

describe("filename tests", () => {
  const tests = [
    ["protoc-23.2-linux-x86_32.zip", "linux", ""],
    ["protoc-23.2-linux-x86_64.zip", "linux", "x64"],
    ["protoc-23.2-linux-aarch_64.zip", "linux", "arm64"],
    ["protoc-23.2-linux-ppcle_64.zip", "linux", "ppc64"],
    ["protoc-23.2-linux-s390_64.zip", "linux", "s390x"],
    ["protoc-23.2-osx-aarch_64.zip", "darwin", "arm64"],
    ["protoc-23.2-osx-x86_64.zip", "darwin", "x64"],
    ["protoc-23.2-win64.zip", "win32", "x64"],
    ["protoc-23.2-win32.zip", "win32", "x32"],
  ];
  it(`Downloads all expected versions correctly`, () => {
    for (const [expected, plat, arch] of tests) {
      const actual = installer.getFileName("23.2", plat, arch);
      expect(expected).toBe(actual);
    }
  });
});

describe("installer tests", () => {
  beforeEach(async function () {
    await io.rmRF(toolDir);
    await io.rmRF(tempDir);
    await io.mkdirP(toolDir);
    await io.mkdirP(tempDir);
  });

  afterAll(async () => {
    try {
      await io.rmRF(toolDir);
      await io.rmRF(tempDir);
    } catch {
      console.log("Failed to remove test directories");
    }
  });

  it("Downloads version of protoc if no matching version is installed", async () => {
    await installer.getProtoc("v23.0", true, GITHUB_TOKEN);
    const protocDir = path.join(toolDir, "protoc", "v23.0", os.arch());

    expect(fs.existsSync(`${protocDir}.complete`)).toBe(true);

    if (IS_WINDOWS) {
      expect(fs.existsSync(path.join(protocDir, "bin", "protoc.exe"))).toBe(
        true
      );
    } else {
      expect(fs.existsSync(path.join(protocDir, "bin", "protoc"))).toBe(true);
    }
  }, 100000);

  describe("Gets the latest release of protoc", () => {
    beforeEach(() => {
      nock("https://api.github.com")
        .get("/repos/protocolbuffers/protobuf/releases?page=1")
        .replyWithFile(200, path.join(dataDir, "releases-1.json"));

      nock("https://api.github.com")
        .get("/repos/protocolbuffers/protobuf/releases?page=2")
        .replyWithFile(200, path.join(dataDir, "releases-2.json"));

      nock("https://api.github.com")
        .get("/repos/protocolbuffers/protobuf/releases?page=3")
        .replyWithFile(200, path.join(dataDir, "releases-3.json"));

      nock("https://api.github.com")
        .get("/repos/protocolbuffers/protobuf/releases?page=4")
        .replyWithFile(200, path.join(dataDir, "releases-4.json"));

      nock("https://api.github.com")
        .get("/repos/protocolbuffers/protobuf/releases?page=5")
        .replyWithFile(200, path.join(dataDir, "releases-5.json"));

      nock("https://api.github.com")
        .get("/repos/protocolbuffers/protobuf/releases?page=6")
        .replyWithFile(200, path.join(dataDir, "releases-6.json"));
    });

    afterEach(() => {
      nock.cleanAll();
      nock.enableNetConnect();
    });

    const tests = [
      ["v23.1", "v23.1"],
      ["v22.x", "v22.5"],
      ["v23.0-rc2", "v23.0-rc2"],
    ];
    tests.forEach(function (testCase) {
      const [input, expected] = testCase;
      it(`Gets latest version of protoc using ${input} and no matching version is installed`, async () => {
        await installer.getProtoc(input, true, GITHUB_TOKEN);
        const protocDir = path.join(toolDir, "protoc", expected, os.arch());

        expect(fs.existsSync(`${protocDir}.complete`)).toBe(true);
        if (IS_WINDOWS) {
          expect(fs.existsSync(path.join(protocDir, "bin", "protoc.exe"))).toBe(
            true
          );
        } else {
          expect(fs.existsSync(path.join(protocDir, "bin", "protoc"))).toBe(
            true
          );
        }
      }, 100000);
    });
  });
});

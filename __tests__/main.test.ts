import io = require("@actions/io");
import path = require("path");
import os = require("os");
import fs = require("fs");
import nock = require("nock");

const toolDir = path.join(__dirname, "runner", "tools");
const tempDir = path.join(__dirname, "runner", "temp");
const dataDir = path.join(__dirname, "testdata");
const IS_WINDOWS = process.platform === "win32";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

process.env["RUNNER_TEMP"] = tempDir;
process.env["RUNNER_TOOL_CACHE"] = toolDir;
import * as installer from "../src/installer";

describe("filename tests", () => {
  const tests = [
    ["protoc-3.20.2-linux-x86_32.zip", "linux", ""],
    ["protoc-3.20.2-linux-x86_64.zip", "linux", "x64"],
    ["protoc-3.20.2-linux-aarch_64.zip", "linux", "arm64"],
    ["protoc-3.20.2-linux-ppcle_64.zip", "linux", "ppc64"],
    ["protoc-3.20.2-linux-s390_64.zip", "linux", "s390x"],
    ["protoc-3.20.2-osx-aarch_64.zip", "darwin", "arm64"],
    ["protoc-3.20.2-osx-x86_64.zip", "darwin", "x64"]
  ];
  for (const [expected, plat, arch] of tests) {
    it(`downloads ${expected} correctly`, () => {
      const actual = installer.getFileName("3.20.2", plat, arch);
      expect(expected).toBe(actual);
    });
  }
});

describe("installer tests", () => {
  beforeEach(async function() {
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
    await installer.getProtoc("3.9.0", true, GITHUB_TOKEN);
    const protocDir = path.join(toolDir, "protoc", "3.9.0", os.arch());

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
    });

    afterEach(() => {
      nock.cleanAll();
      nock.enableNetConnect();
    });

    it("Gets the latest 3.7.x version of protoc using 3.7 and no matching version is installed", async () => {
      await installer.getProtoc("3.7", true, GITHUB_TOKEN);
      const protocDir = path.join(toolDir, "protoc", "3.7.1", os.arch());

      expect(fs.existsSync(`${protocDir}.complete`)).toBe(true);
      if (IS_WINDOWS) {
        expect(fs.existsSync(path.join(protocDir, "bin", "protoc.exe"))).toBe(
          true
        );
      } else {
        expect(fs.existsSync(path.join(protocDir, "bin", "protoc"))).toBe(true);
      }
    }, 100000);

    it("Gets latest version of protoc using 3.x and no matching version is installed", async () => {
      await installer.getProtoc("3.x", true, GITHUB_TOKEN);
      const protocDir = path.join(toolDir, "protoc", "3.12.4", os.arch());

      expect(fs.existsSync(`${protocDir}.complete`)).toBe(true);
      if (IS_WINDOWS) {
        expect(fs.existsSync(path.join(protocDir, "bin", "protoc.exe"))).toBe(
          true
        );
      } else {
        expect(fs.existsSync(path.join(protocDir, "bin", "protoc"))).toBe(true);
      }
    }, 100000);
  });

  describe("Gets the latest release of protoc with broken latest rc tag", () => {
    beforeEach(() => {
      nock("https://api.github.com")
        .get("/repos/protocolbuffers/protobuf/releases?page=1")
        .replyWithFile(200, path.join(dataDir, "releases-broken-rc-tag.json"));

      nock("https://api.github.com")
        .get("/repos/protocolbuffers/protobuf/releases?page=2")
        .replyWithFile(200, path.join(dataDir, "releases-2.json"));

      nock("https://api.github.com")
        .get("/repos/protocolbuffers/protobuf/releases?page=3")
        .replyWithFile(200, path.join(dataDir, "releases-3.json"));
    });

    afterEach(() => {
      nock.cleanAll();
      nock.enableNetConnect();
    });

    it("Gets latest version of protoc using 3.x with a broken rc tag, filtering pre-releases", async () => {
      await installer.getProtoc("3.x", false, "");
      const protocDir = path.join(toolDir, "protoc", "3.9.1", os.arch());

      expect(fs.existsSync(`${protocDir}.complete`)).toBe(true);
      if (IS_WINDOWS) {
        expect(fs.existsSync(path.join(protocDir, "bin", "protoc.exe"))).toBe(
          true
        );
      } else {
        expect(fs.existsSync(path.join(protocDir, "bin", "protoc"))).toBe(true);
      }
    }, 100000);
  });
});

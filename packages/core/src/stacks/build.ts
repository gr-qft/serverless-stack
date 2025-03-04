import { Config } from "../config";
import * as esbuild from "esbuild";
import fs from "fs-extra";
import { State } from "..";
import path from "path";
import {
  createProgram,
  Diagnostic,
  getLineAndCharacterOfPosition,
  getPreEmitDiagnostics,
} from "typescript";
import chalk from "chalk";

export async function build(root: string, config: Config) {
  const buildDir = State.stacksPath(root);
  const pkg = await fs.readJson(path.join(root, "package.json"));
  const entry = path.join(root, config.main);
  if (!fs.existsSync(entry))
    throw new Error(
      `Cannot find app handler. Make sure to add a "${config.main}" file`
    );

  await esbuild.build({
    external: [
      "aws-cdk-lib",
      ...Object.keys({
        ...pkg.devDependencies,
        ...pkg.dependencies,
        ...pkg.peerDependencies,
      }),
    ],
    keepNames: true,
    bundle: true,
    format: "cjs",
    sourcemap: true,
    platform: "node",
    target: "node14",
    // The entry can have any file name (ie. "stacks/anything.ts"). We want the
    // build output to be always named "lib/index.js". This allow us to always
    // import from "buildDir" without needing to pass "anything" around.
    outfile: `${buildDir}/index.js`,
    entryPoints: [entry],
  });
}

// This is used to typecheck JS code to provide helpful errors even if the user isn't using typescript
export function check(root: string, config: Config) {
  const entry = path.join(root, config.main);
  const program = createProgram({
    rootNames: [entry],
    options: {
      incremental: true,
      tsBuildInfoFile: path.join(root, ".sst", "tsbuildinfo"),
      allowJs: true,
      checkJs: true,
      noEmit: true,
      strict: true,
      noImplicitAny: false,
    },
  });
  const result = program.emit();
  return getPreEmitDiagnostics(program).concat(result.diagnostics);
}

export function formatDiagnostics(list: Diagnostic[]) {
  function bottom(msg: Diagnostic["messageText"]): string {
    if (typeof msg === "string") return msg;
    if (msg.next?.[0]) return bottom(msg.next?.[0]);
    return msg.messageText;
  }
  return list.map((diagnostic) => {
    if (diagnostic.file) {
      const { line, character } = getLineAndCharacterOfPosition(
        diagnostic.file,
        diagnostic.start!
      );
      const message = bottom(diagnostic.messageText);
      return [
        `${diagnostic.file.fileName} (${line + 1},${
          character + 1
        }): ${message}`,
        `${line - 1}. ${diagnostic.file.text.split("\n")[line - 1]}`,
        chalk.yellow(`${line}. ${diagnostic.file.text.split("\n")[line]}`),
        `${line + 1}. ${diagnostic.file.text.split("\n")[line + 1]}`,
      ].join("\n");
    } else {
      return bottom(diagnostic.messageText);
    }
  });
}

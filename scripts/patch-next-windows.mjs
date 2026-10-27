import fs from "fs";

const files = [
  "node_modules/next/dist/build/webpack/plugins/next-trace-entrypoints-plugin.js",
  "node_modules/next/dist/build/collect-build-traces.js",
  "node_modules/next/dist/build/adapter/build-complete.js",
];

const oldPattern = "e.code === 'EINVAL' || e.code === 'ENOENT' || e.code === 'UNKNOWN'";
const newPattern = "e.code === 'EINVAL' || e.code === 'ENOENT' || e.code === 'UNKNOWN' || e.code === 'EPERM'";

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, "utf8");
    if (content.includes(oldPattern)) {
      content = content.replaceAll(oldPattern, newPattern);
    }
    // Also patch if (e.code === 'EINVAL') in build-complete.js
    if (content.includes("if (e.code === 'EINVAL')")) {
      content = content.replaceAll(
        "if (e.code === 'EINVAL')",
        "if (e.code === 'EINVAL' || e.code === 'EPERM' || e.code === 'UNKNOWN')"
      );
    }
    fs.writeFileSync(file, content, "utf8");
  }
}

// Cross-platform copy of .next/static + public into .next/standalone
// Replaces `cp -r` which doesn't work on Windows.
async function main() {
  const fs = await import("node:fs");
  const path = await import("node:path");

  function copyDir(src, dest) {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const source = path.join(src, entry.name);
      const destination = path.join(dest, entry.name);
      if (entry.isDirectory()) copyDir(source, destination);
      else fs.copyFileSync(source, destination);
    }
  }

  const root = path.resolve(__dirname, "..");
  copyDir(
    path.join(root, ".next", "static"),
    path.join(root, ".next", "standalone", ".next", "static"),
  );
  copyDir(path.join(root, "public"), path.join(root, ".next", "standalone", "public"));
  console.log("Copied .next/static + public into .next/standalone");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

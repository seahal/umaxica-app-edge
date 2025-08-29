#!/usr/bin/env node
import { rmSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const cwd = new URL("..", import.meta.url);
const root = new URL(".", cwd);

const TARGETS = [
	"build",
	"dist",
	".react-router",
	"tsconfig.cloudflare.tsbuildinfo",
	"tsconfig.node.tsbuildinfo",
];

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

const toDelete = [];
for (const target of TARGETS) {
	const p = join(new URL(root).pathname, target);
	if (existsSync(p)) {
		toDelete.push(p);
	}
}

// Also remove stray .map files in dist/build (if present)
for (const dir of ["build", "dist"]) {
	const dirPath = join(new URL(root).pathname, dir);
	if (existsSync(dirPath)) {
		try {
			for (const f of readdirSync(dirPath)) {
				const fp = join(dirPath, f);
				try {
					if (statSync(fp).isFile() && /\.map$/.test(f)) {
						toDelete.push(fp);
					}
				} catch {}
			}
		} catch {}
	}
}

if (toDelete.length === 0) {
	console.log("[clean] Nothing to remove.");
	process.exit(0);
}

if (dryRun) {
	console.log("[clean] Dry run. Would remove:");
	for (const p of toDelete) console.log("  -", p);
	process.exit(0);
}

for (const p of toDelete) {
	try {
		rmSync(p, { recursive: true, force: true });
		console.log("[clean] removed", p);
	} catch (e) {
		console.warn("[clean] failed to remove", p, e?.message ?? e);
	}
}

console.log("[clean] Done.");

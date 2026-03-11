import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const packageJsonPath = path.join(rootDir, "package.json");
const registryPath = path.join(rootDir, "feature-registry.json");
const outputPath = path.join(rootDir, "FEATURES.md");

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
}).format(new Date());
const totalGroups = registry.moduleGroups.length;
const totalItems = registry.moduleGroups.reduce((count, group) => count + group.items.length, 0);

const renderGroup = (group) => {
    const lines = [`## ${group.name}`, "", group.description, ""];

    for (const item of group.items) {
        lines.push(`### ${item.name}`);
        if (item.serviceId) lines.push(`- Service ID: \`${item.serviceId}\``);
        if (item.component) lines.push(`- Component: \`${item.component}\``);
        if (item.path) lines.push(`- Path: \`${item.path}\``);
        if (item.responsibility) lines.push(`- Responsibility: ${item.responsibility}`);
        if (item.capabilities) {
            lines.push("- Capabilities:");
            for (const capability of item.capabilities) {
                lines.push(`  - ${capability}`);
            }
        }
        lines.push("");
    }

    return lines.join("\n");
};

const renderReleaseHistory = (history) => {
    const lines = ["## Release History", ""];

    for (const release of history) {
        lines.push(`### Version ${release.version} (${release.date})`);
        lines.push(release.summary);
        lines.push("");
        lines.push("- Highlights:");
        for (const highlight of release.highlights) {
            lines.push(`  - ${highlight}`);
        }
        lines.push("");
    }

    return lines.join("\n");
};

const markdown = [
    "# Feature Catalog",
    "",
    "> This file is auto-generated from `feature-registry.json`. Edit the registry first, then run `npm run features:sync`.",
    "",
    `## Product Snapshot`,
    "",
    `- Product: ${registry.productName}`,
    `- Package Name: \`${packageJson.name}\``,
    `- Package Version: \`${packageJson.version}\``,
    `- Catalog Version: \`${registry.documentationVersion}\``,
    `- Last Synced: ${today}`,
    `- Module Groups: ${totalGroups}`,
    `- Total Catalog Entries: ${totalItems}`,
    "",
    "## Summary",
    "",
    `**Tagline:** ${registry.productSummary.tagline}`,
    "",
    `**Positioning:** ${registry.productSummary.positioning}`,
    "",
    "## Maintenance Workflow",
    ""
];

for (const step of registry.maintainersGuide.updateWorkflow) {
    markdown.push(`1. ${step}`);
}

markdown.push("");

for (const group of registry.moduleGroups) {
    markdown.push(renderGroup(group));
}

markdown.push(renderReleaseHistory(registry.releaseHistory));

fs.writeFileSync(outputPath, `${markdown.join("\n")}\n`, "utf8");
console.log(`Feature catalog generated at ${outputPath}`);

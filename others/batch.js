const fs = require("fs");
const path = require("path");

// ===== CONFIG =====
const STARTUP_CHANNEL_ID = "1376285160038731797";

// ===== BUFFER LOGGER =====
const startupBuffer = [];

function log(level, message, meta = {}) {
    startupBuffer.push({
        level,
        message,
        time: new Date().toISOString(),
        ...meta
    });
}

// ===== SAFE REQUIRE CHECK =====
function checkModule(pkg) {
    try {
        require.resolve(pkg);
        log("info", "module.loaded", { module: pkg });
    } catch {
        log("error", "module.missing", { module: pkg });
    }
}

// ===== FILE CHECK =====
function checkFile(filePath) {
    const full = path.join(__dirname, filePath);

    log("debug", "file.check.start", { file: filePath });

    if (!fs.existsSync(full)) {
        log("error", "file.missing", { file: filePath });
        return;
    }

    try {
        fs.readFileSync(full);
        log("info", "file.ready", { file: filePath });
    } catch {
        log("error", "file.corrupt", { file: filePath });
    }
}

// ===== FOLDER CHECK =====
function checkFolder(folderPath) {
    const full = path.join(__dirname, folderPath);

    log("debug", "folder.scan.start", { folder: folderPath });

    if (!fs.existsSync(full)) {
        log("error", "folder.missing", { folder: folderPath });
        return;
    }

    const files = fs.readdirSync(full);
    log("info", "folder.scan.complete", {
        folder: folderPath,
        files: files.length
    });
}

// ===== NODE_MODULES CHECK =====
function checkNodeModules() {
    const full = path.join(__dirname, "node_modules");

    if (!fs.existsSync(full)) {
        log("error", "node_modules.missing");
        return;
    }

    log("info", "node_modules.present");
}

// ===== MAIN SCAN =====
function runStartupScan() {
    log("info", "startup.begin");

    // Core files
    checkFile("index.js");
    checkFile("Config.js");

    // Your JSON/data files
    checkFile("eventfunctionmode.json");

    // Folders
    checkFolder("API");
    checkFolder("letterCommands");
    checkFolder("Commands");

    // Dependencies
    checkModule("discord.js");
    checkModule("noblox.js");

    // node_modules existence
    checkNodeModules();

    log("info", "startup.complete");
}

// ===== FLUSH LOGGER =====
async function flushStartupLogs(client) {
    try {
        const channel = await client.channels.fetch(STARTUP_CHANNEL_ID);
        if (!channel) return;

        const chunks = [];
        let current = "";

        for (const entry of startupBuffer) {
            const line =
                `[${entry.time}] [${entry.level.toUpperCase()}] ${entry.message}` +
                (entry.file ? ` (${entry.file})` : "") +
                (entry.folder ? ` (${entry.folder})` : "") +
                (entry.module ? ` (${entry.module})` : "") +
                (entry.files !== undefined ? ` [files: ${entry.files}]` : "") +
                "\n";

            if ((current + line).length > 1900) {
                chunks.push(current);
                current = "";
            }

            current += line;
        }

        if (current) chunks.push(current);

        await Promise.all(
            chunks.map(chunk =>
                channel.send({
                    content: "```log\n" + chunk + "```"
                })
            )
        );

    } catch (err) {
        console.error("Startup log error:", err);
    }
}

module.exports = {
    runStartupScan,
    flushStartupLogs
};
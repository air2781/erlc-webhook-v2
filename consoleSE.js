const fs = require("fs");
const path = require("path");

const uptimePath = path.join(__dirname, "../others/uptimebot.json");

// ensure file exists
if (!fs.existsSync(uptimePath)) {
  fs.writeFileSync(
    uptimePath,
    JSON.stringify(
      {
        lastStart: 0,
        lastDay: "",
        errorRestarted: false
      },
      null,
      2
    )
  );
}

const uptimeData = JSON.parse(fs.readFileSync(uptimePath, "utf8"));

const now = new Date();
const estNow = new Date(
  now.toLocaleString("en-US", { timeZone: "America/New_York" })
);

const today =
  String(estNow.getMonth() + 1).padStart(2, "0") +
  "/" +
  String(estNow.getDate()).padStart(2, "0") +
  "/" +
  estNow.getFullYear();

// detect same-day restart
if (uptimeData.lastDay === today && uptimeData.lastStart !== 0) {
  uptimeData.errorRestarted = true;
}

// update start info
uptimeData.lastStart = Date.now();
uptimeData.lastDay = today;

fs.writeFileSync(uptimePath, JSON.stringify(uptimeData, null, 2));

// ⏱️ 5 HOUR UPTIME CHECK
setTimeout(() => {
  const upForMs = Date.now() - uptimeData.lastStart;
  const hours = Math.floor(upForMs / 3600000);
  const minutes = Math.floor((upForMs % 3600000) / 60000);

  const timeUp = `${hours}h ${minutes}m`;

  console.log(
    `Bot has been up for ${timeUp} | ${today}. ` +
      `The bot has ${uptimeData.errorRestarted ? "experienced a restart" : "not faced any errors or unregulated restarts"} today.`
  );
}, 5 * 60 * 60 * 1000); // 5 hours

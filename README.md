<div align="center">

# SAMP-Link

### The bridge between Discord and SA-MP.

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=22&duration=2800&pause=900&color=8B5CF6&center=true&vCenter=true&width=650&lines=Discord+Integration+for+SA-MP;Built+for+SA-MP+%26+open.mp;Connect.+Monitor.+Manage." alt="SAMP-Link typing animation" />

<p>
  <b>An open-source Discord bot for SA-MP and open.mp communities.</b>
</p>

<p>
  <a href="https://github.com/rzkirmdni/samp-link/stargazers"><img src="https://img.shields.io/github/stars/rzkirmdni/samp-link?style=for-the-badge&color=8b5cf6" alt="GitHub Stars"></a>
  <a href="https://github.com/rzkirmdni/samp-link/network/members"><img src="https://img.shields.io/github/forks/rzkirmdni/samp-link?style=for-the-badge&color=6366f1" alt="GitHub Forks"></a>
  <a href="https://github.com/rzkirmdni/samp-link/issues"><img src="https://img.shields.io/github/issues/rzkirmdni/samp-link?style=for-the-badge&color=a78bfa" alt="GitHub Issues"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/rzkirmdni/samp-link?style=for-the-badge&color=7c3aed" alt="License"></a>
</p>

[Features](#features) · [Tech Stack](#tech-stack) · [Installation](#installation) · [Configuration](#configuration) · [Contributing](#contributing)

</div>

---

## About

**SAMP-Link** is an open-source Discord bot built to connect Discord communities with SA-MP and open.mp multiplayer servers.

Designed with server owners and developers in mind, SAMP-Link aims to bring server information, player statistics, account linking, and UCP integration into one connected experience.

Whether you're managing a roleplay community or building your own multiplayer project, SAMP-Link provides a foundation for connecting your game server with Discord.

> **One community. Two platforms. Connected.**

## Features

<table>
  <tr>
    <td width="50%">
      <h3>Discord Integration</h3>
      Connect your multiplayer community with a Discord bot powered by discord.js.
    </td>
    <td width="50%">
      <h3>UCP Integration</h3>
      Support for connecting the bot with a User Control Panel workflow.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>Player Statistics</h3>
      Integrate player-related information into the Discord experience.
    </td>
    <td width="50%">
      <h3>Account Linking</h3>
      Build a connection between Discord identities and game accounts.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>Customizable Commands</h3>
      A foundation for commands tailored to your community's needs.
    </td>
    <td width="50%">
      <h3>Database Integration</h3>
      MySQL connectivity for features that need persistent data.
    </td>
  </tr>
</table>

*Feature availability depends on the current implementation. Check the source code for the latest supported commands and integrations.*

## Tech Stack

<div align="center">

<img src="https://skillicons.dev/icons?i=nodejs,mysql" alt="Node.js and MySQL" />

<br><br>

<img src="https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="discord.js">
<img src="https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL">
<img src="https://img.shields.io/badge/dotenv-Configuration-ECD53F?style=for-the-badge" alt="dotenv">
<img src="https://img.shields.io/badge/SA--MP-Multiplayer-2F81F7?style=for-the-badge" alt="SA-MP">

</div>

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| discord.js v14 | Discord bot framework |
| mysql2 | MySQL database connectivity |
| dotenv | Environment variable configuration |
| samp-query | SA-MP server query integration |
| MySQL | Persistent data storage |

## Installation

### Requirements

Before getting started, make sure you have:

- Node.js installed.
- A Discord application and bot token.
- A MySQL database.
- Access to the SA-MP server you want to integrate.
- Git installed to clone the repository.

### 1. Clone the repository

```bash
git clone https://github.com/rzkirmdni/samp-link.git
cd samp-link
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create your local `.env` file using the example:

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
```

**Linux**

```bash
cp .env.example .env
```

### 4. Set up your configuration

Open `.env` and configure the required values.

```env
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=samp_database

BOT_NAME="SA-MP Link"
LOGO_LINK=
BANNER_LINK=

SERVER_IP=127.0.0.1:7777
```

Replace the example values with your actual configuration. Do not publish your Discord token or database password.

### 5. Start the bot

The main entry point listed in the project is `src/index.js`.

```bash
node src/index.js
```

Check the source code for any additional setup requirements before running the bot in production.

## Configuration Reference

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Discord bot token |
| `CLIENT_ID` | Discord application ID |
| `GUILD_ID` | Discord server ID for guild-specific configuration |
| `DB_HOST` | MySQL hostname or IP |
| `DB_PORT` | MySQL port |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name |
| `BOT_NAME` | Display name used for bot branding |
| `LOGO_LINK` | Logo image URL |
| `BANNER_LINK` | Banner image URL |
| `SERVER_IP` | SA-MP server address and query port |

## Project Structure

```text
samp-link/
├── src/                # Bot source code
├── .env.example        # Example environment configuration
├── .gitignore          # Git exclusions
├── deploy-commands.js  # Discord command deployment
├── package.json        # Dependencies and project metadata
├── package-lock.json   # Dependency lockfile
├── LICENSE             # MIT License
└── README.md           # Project documentation
```

## Security

- Keep `.env` out of version control.
- Never expose Discord bot tokens or database credentials.
- Use a dedicated database user with only the permissions the bot requires.
- Keep dependencies updated.
- Rotate credentials immediately if they are exposed.

## Roadmap

- [ ] Improve setup and installation documentation.
- [ ] Expand SA-MP and open.mp server integrations.
- [ ] Improve player statistics and account linking workflows.
- [ ] Expand UCP integration options.
- [ ] Improve command customization.
- [ ] Add automated tests and CI checks.

*The roadmap represents potential development goals, not a guarantee that every feature is currently implemented.*

## Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a branch for your changes.
3. Implement and test your changes.
4. Commit with a descriptive message.
5. Open a Pull Request.

For bug reports and feature requests, visit the [Issues page](https://github.com/rzkirmdni/samp-link/issues).

## License

SAMP-Link is released under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<div align="center">

### SAMP-Link

**Connecting Discord with the multiplayer world.**

<sub>Open source · Community driven · Built for SA-MP and open.mp</sub>

<br>

<a href="https://github.com/rzkirmdni/samp-link">View Repository</a>

</div>

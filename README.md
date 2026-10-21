<div align="center">

  # 🎮 SA-MP Link Gateway
  ### Enterprise Discord Integration & Automated User Control Panel (UCP) for San Andreas Multiplayer

  <p align="center">
    <a href="https://github.com/ikyyxzdev/samp-link/stargazers"><img src="https://img.shields.io/github/stars/ikyyxzdev/samp-link?color=yellow&style=for-the-badge" alt="Stars"></a>
    <a href="https://github.com/ikyyxzdev/samp-link/network/members"><img src="https://img.shields.io/github/forks/ikyyxzdev/samp-link?color=orange&style=for-the-badge" alt="Forks"></a>
    <a href="https://github.com/ikyyxzdev/samp-link/issues"><img src="https://img.shields.io/github/issues/ikyyxzdev/samp-link?color=red&style=for-the-badge" alt="Issues"></a>
    <a href="https://github.com/ikyyxzdev/samp-link/blob/main/LICENSE"><img src="https://img.shields.io/github/license/ikyyxzdev/samp-link?color=blue&style=for-the-badge" alt="License"></a>
  </p>

  <p align="center">
    <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&duration=3000&pause=1000&color=3498DB&center=true&vCenter=true&width=650&lines=Seamless+SA-MP+%2B+Discord+Synchronizer;Automated+UCP+Registration+%26+Verification;Real-time+Server+Query+%26+Player+Directory;Zero-Downtime+Slash+Command+Auto-Deployer" alt="Typing SVG" />
  </p>

  <p align="center">
    <b>A modular, enterprise-grade Discord bot bridge designed to connect SA-MP (San Andreas Multiplayer) gamemode databases with modern Discord communities.</b>
  </p>

  ---
</div>

## 📌 Table of Contents
- [About The Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Commands & Capabilities](#-commands--capabilities)
- [Database Schema Contract](#-database-schema-contract)
- [Customization](#-customization)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 About The Project

**SA-MP Link Gateway** bridges the gap between your game server and your Discord community. Built on Discord.js v14 and modern MySQL connection pooling, it eliminates manual admin registration workflows through self-service modal forms, automated verification code dispatches, real-time UDP server telemetry, and continuous presence tracking.

---

## ⚡ Key Features

* **🛡️ Self-Service UCP Panel (`/panelucp`)**
  * Persistent interactive message embed with dynamic button controls.
  * Native Discord Modal submission with alphanumeric validation rules.
  * One-to-one Discord ID constraint to prevent multi-account exploits.
* **🔐 Multi-Action Account Operations**
  * **Automated Dispatch:** Generates 6-digit numeric verification codes delivered via Direct Message.
  * **Code Resend:** Dispatches refreshed verification codes straight to user DMs on demand.
  * **Role & Nickname Re-sync:** Restores verified roles and formats member server nicknames (`Verified - Username`).
  * **Password Wipe & Recovery:** Clears previous password and salt hashes, generating instant recovery tokens.
* **📡 Real-Time Telemetry & Presence Engine**
  * Direct UDP querying using `samp-query` to pull hostname, player count, gamemode, and map name.
  * Dynamic Bot Presence updating every 30 seconds (`Listening to Server Name | X/Y Players`).
  * Automatic failover state rendering DND status when the game server is unreachable.
* **👥 Monospace Paginated Player Directory (`/players`)**
  * Displays online players in formatted monospace tables (`ID | Player Name | Score | Ping`).
  * Interactive previous/next pagination buttons scoped strictly to the command caller.
* **🚀 Zero-Configuration Auto-Deployment**
  * Automatically scans, validates, and deploys slash commands to the Discord REST API on startup.

---

## 🛠️ Tech Stack

<div align="center">

| Technology | Purpose | Documentation |
| :--- | :--- | :--- |
| **Node.js** (v18+) | JavaScript Runtime Environment | [nodejs.org](https://nodejs.org/) |
| **Discord.js v14** | Official Discord API Client | [discord.js.org](https://discord.js.org/) |
| **MySQL2 / MariaDB** | High-Performance Database Driver with Pooling | [npmjs.com/package/mysql2](https://www.npmjs.com/package/mysql2) |
| **samp-query** | UDP Socket Query Wrapper for SA-MP Servers | [npmjs.com/package/samp-query](https://www.npmjs.com/package/samp-query) |
| **dotenv** | Environment Configuration Loader | [npmjs.com/package/dotenv](https://www.npmjs.com/package/dotenv) |

</div>

<p align="center">
  <img src="https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white" alt="NodeJS" />
  <img src="https://img.shields.io/badge/discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="DiscordJS" />
  <img src="https://img.shields.io/badge/mysql-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/mariadb-003545?style=for-the-badge&logo=mariadb&logoColor=white" alt="MariaDB" />
  <img src="https://img.shields.io/badge/json-000000?style=for-the-badge&logo=json&logoColor=white" alt="JSON" />
</p>

---

## 📂 System Architecture

```text
samp-link/
├── src/
│   ├── commands/              # Application Slash Commands
│   │   ├── admin/             # Restricted administrative controls (/panelucp)
│   │   ├── player/            # User-facing diagnostics (/ping)
│   │   └── server/            # Game server statistics (/serverinfo, /players)
│   ├── config/                # Centralized configuration & role mapping
│   ├── database/              # MySQL connection pool & transactional query runner
│   ├── events/                # Discord event listeners
│   │   ├── client/            # Client lifecycle & presence auto-updater (ready.js)
│   │   └── guild/             # Interaction router & modal pipelines (interactionCreate.js)
│   ├── handlers/              # Dynamic event/command loaders & REST auto-deployers
│   ├── text/                  # Decoupled JSON templates for DM dispatches & UI copy
│   │   ├── registerucp.json   # Panel UI text and instructions
│   │   ├── registerdm.json    # Initial registration DM template
│   │   ├── resendcodedm.json  # Resent code DM template
│   │   └── resetpassworddm.json # Password wipe recovery DM template
│   ├── utils/                 # Utility helpers (sampQuery Promise wrapper)
│   └── index.js               # Application bootstrap entry point
├── .env.example               # Environment variables specification
├── package.json               # Dependency declarations and npm scripts
└── README.md                  # System documentation
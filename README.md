# Minecraft Bot Batch Login (TypeScript)

This project provides a script to batch login multiple Minecraft bots using Mineflayer, written in TypeScript.

## Prerequisites

- Node.js
- A Minecraft server that supports offline mode authentication.

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Configure User List:**
    Create a `userlist.txt` file in the root directory and add the usernames of the bots, one per line.

3.  **Configure Bot Settings:**
    Open `src/minecraft_bot.ts` and adjust the server `host` and `port` as needed.

## Usage

To start the batch login process, run the following command:

```bash
npm start
```

This will compile the TypeScript code and run the bot. The script will read the usernames from `userlist.txt` and attempt to log in each bot sequentially. The status of each bot will be printed to the console.

## Development

To run the bot in development mode without compiling, you can use:

```bash
npm start
```

To compile the TypeScript code manually, run:
```bash
npm run build
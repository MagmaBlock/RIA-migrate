# Minecraft Login Client

A Python script to fully log into Minecraft servers (version 1.20.4) and maintain connection.

## Features

- Complete server login (not just simulation)
- Server status ping
- Protocol version 765 (Minecraft 1.20.4)
- Offline UUID generation
- Configuration phase handling
- Play phase with keep-alive responses
- Player visible on server
- Graceful disconnect with Ctrl+C

## Usage

```bash
python minecraft_login.py
```

The script will prompt for:
- Server host (default: localhost)
- Server port (default: 25565)  
- Username (default: TestPlayer)

The client will:
1. Ping the server for status
2. Complete the full login process
3. Enter play phase and become visible
4. Respond to keep-alive packets
5. Stay connected until Ctrl+C

## Requirements

- Python 3.6+
- Offline mode Minecraft server (1.20.4)

## Note

This client is designed for offline mode servers. It will handle the complete login flow including configuration and play phases, making the player visible on the server.
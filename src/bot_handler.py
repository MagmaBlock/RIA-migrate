#!/usr/bin/env python3
"""
Python wrapper to call PrismarineJS's node-minecraft-protocol.
"""

import subprocess
import os
import json
import time

class MinecraftBot:

    def check_dependencies(self):
        """Checks for Node.js and npm dependencies."""
        try:
            # Check Node.js
            result = subprocess.run(['node', '--version'], capture_output=True, text=True, check=False)
            if result.returncode != 0:
                print("Error: Node.js not found. Please install Node.js.")
                return False
            print(f"Node.js version: {result.stdout.strip()}")

            # Check npm
            result = subprocess.run(['npm', '--version'], capture_output=True, text=True, check=False)
            if result.returncode != 0:
                print("Error: npm not found.")
                return False
            print(f"npm version: {result.stdout.strip()}")

            return True
        except Exception as e:
            print(f"Error checking dependencies: {e}")
            return False

    def install_dependencies(self):
        """Installs node-minecraft-protocol dependencies."""
        print("Installing mineflayer...")
        try:
            # Check if package.json exists
            package_json_path = "/Users/lynn/Code/RIA-MCC/package.json"
            if not os.path.exists(package_json_path):
                # Create package.json
                package_data = {
                    "name": "minecraft-bot",
                    "version": "1.0.0",
                    "description": "Minecraft bot using mineflayer",
                    "main": "minecraft_bot.js",
                    "dependencies": {
                        "mineflayer": "^4.17.0"
                    }
                }
                with open(package_json_path, 'w') as f:
                    json.dump(package_data, f, indent=2)
                print("Created package.json")

            # Install dependencies
            result = subprocess.run(
                ['npm', 'install'],
                cwd="/Users/lynn/Code/RIA-MCC",
                capture_output=True, text=True, check=False
            )
            if result.returncode != 0:
                print(f"npm install failed: {result.stderr}")
                return False

            print("✓ Dependencies installed successfully.")
            return True
        except Exception as e:
            print(f"Error installing dependencies: {e}")
            return False

    def run_bot(self, username="TestPlayer"):
        """
        Runs the bot and returns the login status without blocking.
        The Node.js process continues to run in the background.
        """
        try:
            process = subprocess.Popen(
                ['node', 'minecraft_bot.js', username],
                cwd="/Users/lynn/Code/RIA-MCC",
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding='utf-8'
            )

            # Non-blocking read of stdout to get login status
            start_time = time.time()
            while time.time() - start_time < 30: # 30-second timeout for login signal
                line = process.stdout.readline()
                if not line:
                    # If the process exits prematurely, check stderr
                    if process.poll() is not None:
                        error_output = process.stderr.read()
                        # print(f"Bot for {username} exited early. Stderr: {error_output}")
                        return False
                    time.sleep(0.1) # Wait briefly for more output
                    continue

                if "LOGIN_SUCCESS" in line:
                    return True
                if "LOGIN_FAILURE" in line:
                    return False
            
            # If timeout is reached
            process.kill() # Kill the process if it fails to signal in time
            return False

        except Exception as e:
            print(f"Error running bot for {username}: {e}")
            return False
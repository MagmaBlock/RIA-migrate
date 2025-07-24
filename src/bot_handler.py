#!/usr/bin/env python3
"""
Python包装器 - 调用PrismarineJS的node-minecraft-protocol
"""

import subprocess
import sys
import os
import json
import time
import threading


class MinecraftBot:
    def __init__(self):
        self.server_host = "192.168.0.113"
        self.server_port = 25565
        self.process = None

    def check_dependencies(self):
        """检查Node.js和npm依赖"""
        try:
            # 检查Node.js
            result = subprocess.run(['node', '--version'], capture_output=True, text=True)
            if result.returncode != 0:
                print("错误: 未找到Node.js，请先安装Node.js")
                return False
            print(f"Node.js版本: {result.stdout.strip()}")

            # 检查npm
            result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
            if result.returncode != 0:
                print("错误: 未找到npm")
                return False
            print(f"npm版本: {result.stdout.strip()}")

            return True
        except Exception as e:
            print(f"检查依赖时出错: {e}")
            return False

    def install_dependencies(self):
        """安装node-minecraft-protocol依赖"""
        print("正在安装mineflayer...")

        try:
            # 检查package.json是否存在
            package_json_path = "/Users/lynn/Code/RIA-MCC/package.json"
            if not os.path.exists(package_json_path):
                # 创建package.json
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
                print("已创建package.json")

            # 安装依赖
            result = subprocess.run(['npm', 'install'],
                                 cwd="/Users/lynn/Code/RIA-MCC",
                                 capture_output=True, text=True)

            if result.returncode != 0:
                print(f"npm install失败: {result.stderr}")
                return False

            print("✓ 依赖安装成功")
            return True

        except Exception as e:
            print(f"安装依赖时出错: {e}")
            return False

    def run_bot(self, username="TestPlayer"):
        """运行机器人"""
        try:
            # 将输出重定向到DEVNULL以静默化
            self.process = subprocess.Popen(
                ['node', 'minecraft_bot.js', username],
                cwd="/Users/lynn/Code/RIA-MCC",
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        except Exception as e:
            print(f"运行机器人时出错: {e}")

    def stop_bot(self):
        """停止机器人"""
        if self.process and self.process.poll() is None:
            self.process.terminate()
            self.process.wait()
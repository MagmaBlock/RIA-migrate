
#!/usr/bin/env python3
import threading
import time
from tqdm import tqdm
from src.bot_handler import MinecraftBot

def read_user_list(file_path="userlist.txt"):
    """读取用户列表"""
    with open(file_path, 'r') as f:
        users = [line.strip() for line in f if line.strip() and not line.startswith('#')]
    return users

def worker(username, progress_bar):
    """每个线程的工作函数"""
    bot = MinecraftBot()
    bot.run_bot(username)
    time.sleep(10)
    bot.stop_bot()
    progress_bar.update(1)

def main():
    """主函数"""
    print("Minecraft 批量登录机器人")
    print("=" * 50)

    bot = MinecraftBot()

    # 检查和安装依赖
    if not bot.check_dependencies() or not bot.install_dependencies():
        return

    # 读取用户列表
    users = read_user_list()
    if not users:
        print("用户列表为空，请检查 userlist.txt")
        return

    # 创建并启动线程
    threads = []
    with tqdm(total=len(users), desc="登录进度") as progress_bar:
        for username in users:
            thread = threading.Thread(target=worker, args=(username, progress_bar))
            threads.append(thread)
            thread.start()
            time.sleep(0.5) # 避免同时登录过多

        # 等待所有线程完成
        for thread in threads:
            thread.join()

    print("\n所有用户登录测试完成！")

if __name__ == "__main__":
    main()

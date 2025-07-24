
#!/usr/bin/env python3
import threading
import time
from tqdm import tqdm
from src.bot_handler import MinecraftBot

MAX_CONCURRENT_LOGINS = 10
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds

failed_users = []
failed_users_lock = threading.Lock()

def read_user_list(file_path="userlist.txt"):
    """Reads the list of users from a file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        users = [line.strip() for line in f if line.strip() and not line.startswith('#')]
    return users

def worker(username, progress_bar, semaphore):
    """Worker function for each thread, with retry logic."""
    with semaphore:
        bot = MinecraftBot()
        for i in range(MAX_RETRIES):
            success = bot.run_bot(username)
            if success:
                # The bot is now running in the background and will self-terminate.
                progress_bar.update(1)
                return
            else:
                # Optional: Add a small delay before retrying
                if i < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY)
        
        # If all retries fail, record the failure
        with failed_users_lock:
            failed_users.append(username)
        progress_bar.update(1) # Still update progress bar to show completion

def main():
    """Main function."""
    print("Minecraft Bulk Login Bot")
    print("=" * 50)

    bot = MinecraftBot()

    # Check and install dependencies
    if not bot.check_dependencies() or not bot.install_dependencies():
        return

    # Read user list
    users = read_user_list()
    if not users:
        print("User list is empty. Please check userlist.txt")
        return

    # Create semaphore and threads
    semaphore = threading.Semaphore(MAX_CONCURRENT_LOGINS)
    threads = []
    with tqdm(total=len(users), desc="Login Progress") as progress_bar:
        for username in users:
            thread = threading.Thread(target=worker, args=(username, progress_bar, semaphore))
            threads.append(thread)
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join()

    print("\nAll user login tests completed!")

    # Report failed users
    if failed_users:
        print("\nThe following users failed to log in after multiple retries:")
        for user in failed_users:
            print(f"- {user}")

if __name__ == "__main__":
    main()

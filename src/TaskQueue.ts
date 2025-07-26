/**
 * 表示一个需要执行的任务。
 */
export interface Task {
    username: string;
    retries: number;
}

/**
 * 定义了任务执行器的函数签名。
 * @param task 要执行的任务。
 * @returns 一个解析为布尔值的 Promise，true 表示成功，false 表示失败。
 */
export type TaskExecutor = (task: Task) => Promise<boolean>;

/**
 * 一个简单的先进先出（FIFO）任务队列，支持延迟和自动重试。
 */
export class TaskQueue {
    private queue: Task[] = [];
    private executor: TaskExecutor;
    private delay: number;
    private isRunning: boolean = false;

    /**
     * 创建一个新的 TaskQueue 实例。
     * @param executor 用于处理队列中每个任务的函数。
     * @param delay 每个任务执行之间的延迟（毫秒）。
     */
    constructor(executor: TaskExecutor, delay: number = 500) {
        this.executor = executor;
        this.delay = delay;
    }

    /**
     * 向队列中添加单个任务。
     * 如果队列当前未运行，则会自动启动。
     * @param task 要添加的任务。
     */
    public addTask(task: Task): void {
        this.queue.push(task);
        console.log(`[TaskQueue] 用户 ${task.username} 已添加到队列。当前队列长度: ${this.queue.length}`);
        if (!this.isRunning) {
            this.start();
        }
    }

    /**
     * 向队列中批量添加多个任务。
     * 如果队列当前未运行，则会自动启动。
     * @param tasks 要添加的任务数组。
     */
    public addMultipleTasks(tasks: Task[]): void {
        this.queue.push(...tasks);
        console.log(`[TaskQueue] ${tasks.length} 个任务已批量添加到队列。当前队列长度: ${this.queue.length}`);
        if (!this.isRunning) {
            this.start();
        }
    }

    /**
     * 启动任务队列处理。
     * 如果队列已经在运行，则此方法无效。
     */
    public start(): void {
        if (this.isRunning) {
            console.warn('[TaskQueue] 队列已在运行中，无需重复启动。');
            return;
        }
        this.isRunning = true;
        console.log('[TaskQueue] 任务队列已启动...');
        this.processNext();
    }

    /**
     * 停止任务队列处理。
     * 当前正在执行的任务将继续完成，但不会处理新任务。
     */
    public stop(): void {
        this.isRunning = false;
        console.log('[TaskQueue] 任务队列已停止。');
    }

    /**
     * 递归处理队列中的下一个任务。
     * @private
     */
    private async processNext(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        const task = this.queue.shift();

        if (!task) {
            console.log('[TaskQueue] 队列为空，处理流程暂停。');
            this.isRunning = false;
            return;
        }

        console.log(`[TaskQueue] ==> 开始处理任务: ${task.username} (已重试 ${task.retries} 次)。当前队列长度: ${this.queue.length}`);
        
        try {
            const success = await this.executor(task);

            if (success) {
                console.log(`[TaskQueue] <== 任务成功: ${task.username}`);
            } else {
                console.log(`[TaskQueue] <== 任务失败: ${task.username}，将重新排队等待重试。`);
                task.retries += 1;
                this.addTask(task); // 失败后重新入队
            }
        } catch (error) {
            console.error(`[TaskQueue] 执行任务时捕获到未处理的异常: ${task.username}`, error);
            console.log(`[TaskQueue] <== 任务因异常失败: ${task.username}，将重新排队等待重试。`);
            task.retries += 1;
            this.addTask(task); // 异常后也重新入队
        }


        if (this.queue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, this.delay));
            this.processNext();
        } else {
            console.log('[TaskQueue] 所有任务处理完毕，队列关闭。');
            this.isRunning = false;
        }
    }
}
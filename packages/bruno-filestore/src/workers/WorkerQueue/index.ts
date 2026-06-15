import { Worker } from 'node:worker_threads';
import os from 'node:os';

interface QueuedTask {
  priority: number;
  scriptPath: string;
  data: any;
  taskType: 'parse' | 'stringify';
  resolve?: (value: any) => void;
  reject?: (reason?: any) => void;
}

type PoolItem = {
  taken: boolean;
  worker: Worker;
};

class WorkerPool {
  maxWorkers = os.availableParallelism() - 1;
  pool: PoolItem[] = [];
  mainScript: string;
  private waiters: Array<(worker: Worker) => void> = [];

  constructor(mainScript: string) {
    this.mainScript = mainScript;
    this.pool.push({ taken: false, worker: new Worker(mainScript) });
  }

  takeWorker(): Promise<Worker> {
    return new Promise((resolve) => {
      const poolItem = this.pool.find((d) => !d.taken);
      if (poolItem) {
        poolItem.taken = true;
        resolve(poolItem.worker);
        return;
      }

      if (this.maxWorkers > this.pool.length) {
        const newWorker = new Worker(this.mainScript);
        this.pool.push({ taken: true, worker: newWorker });
        resolve(newWorker);
        return;
      }

      this.waiters.push(resolve);
    });
  }

  releaseWorker(worker: Worker) {
    if (this.waiters.length > 0) {
      const resolve = this.waiters.shift()!;
      resolve(worker);
      return;
    }

    const wk = this.pool.find((d) => Object.is(d.worker, worker));
    if (!wk) return;
    wk.taken = false;
  }

  cleanup() {
    this.waiters = [];
    return Promise.allSettled(this.pool.map((d) => d.worker.terminate()));
  }
}

class WorkerQueue {
  private queue: QueuedTask[];
  private workers: Record<string, WorkerPool>;

  constructor() {
    this.queue = [];
    this.workers = {};
  }

  async getWorkerForScriptPath(scriptPath: string) {
    if (!this.workers[scriptPath]) {
      this.workers[scriptPath] = new WorkerPool(scriptPath);
    }
    const pool = this.workers[scriptPath];
    const worker = await pool.takeWorker();
    const release = pool.releaseWorker.bind(pool);
    return { worker, release };
  }

  async enqueue(task: QueuedTask) {
    const { priority, scriptPath, data, taskType } = task;

    return new Promise((resolve, reject) => {
      this.queue.push({ priority, scriptPath, data, taskType, resolve, reject });
      this.queue?.sort((taskX, taskY) => taskX?.priority - taskY?.priority);
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.queue.length === 0) {
      return;
    }

    const { scriptPath, data, taskType, resolve, reject } = this.queue.shift() as QueuedTask;

    try {
      const result = await this.runWorker({ scriptPath, data, taskType });
      resolve?.(result);
    } catch (error) {
      reject?.(error);
    } finally {
      this.processQueue();
    }
  }

  async runWorker({ scriptPath, data, taskType }: { scriptPath: string; data: any; taskType: 'parse' | 'stringify' }) {
    return new Promise(async (resolve, reject) => {
      const { worker, release } = await this.getWorkerForScriptPath(scriptPath);

      const messageHandler = (data: any) => {
        worker.off('message', messageHandler);
        worker.off('error', errorHandler);
        worker.off('exit', exitHandler);
        release(worker);

        if (data?.error) {
          reject(new Error(data?.error));
        } else {
          resolve(data);
        }
      };

      const errorHandler = (error: Error) => {
        worker.off('message', messageHandler);
        worker.off('error', errorHandler);
        worker.off('exit', exitHandler);
        release(worker);
        reject(error);
      };

      const exitHandler = (code: number) => {
        worker.off('message', messageHandler);
        worker.off('error', errorHandler);
        worker.off('exit', exitHandler);
        release(worker);
        reject(new Error(`Worker stopped with exit code ${code}`));
      };

      worker.on('message', messageHandler);
      worker.on('error', errorHandler);
      worker.on('exit', exitHandler);

      worker.postMessage({ taskType, data });
    });
  }

  async cleanup() {
    const promises = Object.values(this.workers).map((worker) => {
      return worker.cleanup();
    });

    await Promise.allSettled(promises);
    this.workers = {};
  }
}

export default WorkerQueue;

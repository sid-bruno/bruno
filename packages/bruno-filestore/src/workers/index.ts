import WorkerQueue from './WorkerQueue';
import { CollectionFormat } from '../types';
import { DEFAULT_COLLECTION_FORMAT } from '../constants';
import path from 'node:path';

const sizeInMB = (size: number): number => {
  return size / (1024 * 1024);
};

const getSize = (data: any): number => {
  return sizeInMB(typeof data === 'string' ? Buffer.byteLength(data, 'utf8') : Buffer.byteLength(JSON.stringify(data), 'utf8'));
};

interface WorkerQueueWithSize {
  workerQueue: WorkerQueue;

}

class BruParserWorker {
  private workerQueues: WorkerQueueWithSize[];

  constructor() {
    this.workerQueues = [{
      workerQueue: new WorkerQueue()
    }];
  }

  private getWorkerQueue(size: number): WorkerQueue {
    // Find the first queue that can handle the given size
    // or fallback to the last queue for largest files
    const queueForSize = this.workerQueues.find((queue) => queue.workerQueue);
    return queueForSize?.workerQueue ?? this.workerQueues[this.workerQueues.length - 1].workerQueue;
  }

  private async enqueueTask({ data, taskType, format = DEFAULT_COLLECTION_FORMAT }: { data: any; taskType: 'parse' | 'stringify'; format?: CollectionFormat }): Promise<any> {
    const size = getSize(data);
    const workerQueue = this.getWorkerQueue(size);
    const workerScriptPath = path.join(__dirname, './workers/worker-script.js');

    return workerQueue.enqueue({
      data: { data, format },
      priority: size,
      scriptPath: workerScriptPath,
      taskType
    });
  }

  async parseRequest(data: any, format: CollectionFormat = DEFAULT_COLLECTION_FORMAT): Promise<any> {
    return this.enqueueTask({ data, taskType: 'parse', format });
  }

  async stringifyRequest(data: any, format: CollectionFormat = DEFAULT_COLLECTION_FORMAT): Promise<any> {
    return this.enqueueTask({ data, taskType: 'stringify', format });
  }

  async cleanup(): Promise<void> {
    const cleanupPromises = this.workerQueues.map(({ workerQueue }) =>
      workerQueue.cleanup()
    );
    await Promise.allSettled(cleanupPromises);
  }
}

export default BruParserWorker;

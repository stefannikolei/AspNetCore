(global as any).DotNet = { attachReviver: jest.fn() };

import RenderQueue, { BatchStatus } from '../src/Platform/Circuits/RenderQueue';
import { NullLogger } from '../src/Platform/Logging/Loggers';
import * as signalR from '@aspnet/signalr';

jest.mock('../src/Rendering/Renderer', () => ({
  renderBatch: jest.fn()
}));

describe('RenderQueue', () => {

  it('getOrCreateRenderQueue returns a new queue if one does not exist for a renderer', () => {
    const queue = RenderQueue.getOrCreateQueue(1, NullLogger.instance);

    expect(queue).toBeDefined();

  });

  it('getOrCreateRenderQueue returns an existing queue if one exists for a renderer', () => {
    const queue = RenderQueue.getOrCreateQueue(1, NullLogger.instance);
    const secondQueue = RenderQueue.getOrCreateQueue(1, NullLogger.instance);

    expect(secondQueue).toBe(queue);

  });

  it('enqueue queues the next batch', () => {
    const queue = RenderQueue.getOrCreateQueue(1, NullLogger.instance);

    const result = queue.enqueue(2, new Uint8Array(0));

    expect(result).toBe(BatchStatus.Queued);
  });

  it('enqueue does not enqueue older batches', () => {
    const queue = RenderQueue.getOrCreateQueue(2, NullLogger.instance);

    const batch = new Uint8Array(0);
    queue.enqueue(2, batch);
    queue.renderPendingBatches({ send: jest.fn() } as any as signalR.HubConnection)
    const result = queue.enqueue(2, batch);

    expect(result).toBe(BatchStatus.Processed);
  });

  it('enqueue queues future batches', () => {
    const queue = RenderQueue.getOrCreateQueue(3, NullLogger.instance);

    const batch = new Uint8Array(0);
    const result = queue.enqueue(4, batch);

    expect(result).toBe(BatchStatus.Queued);
  });

  it('enqueue does not queue duplicate batches', () => {
    const queue = RenderQueue.getOrCreateQueue(4, NullLogger.instance);

    const batch = new Uint8Array(0);
    queue.enqueue(4, batch);
    const result = queue.enqueue(4, batch);

    expect(result).toBe(BatchStatus.Pending);
  });

  it('renderPendingBatches renders pending batches', () => {
    const queue = RenderQueue.getOrCreateQueue(5, NullLogger.instance);

    const connection = {
      send: jest.fn()
    } as any as signalR.HubConnection;

    queue.enqueue(2, new Uint8Array(0));

    queue.renderPendingBatches(connection);

    expect(queue.getLastBatchid()).toEqual(2);
  });

  it('renderPendingBatches does not render future batches when next batch is missing', () => {
    const queue = RenderQueue.getOrCreateQueue(6, NullLogger.instance);

    const connection = {
      send: jest.fn()
    } as any as signalR.HubConnection;

    queue.enqueue(4, new Uint8Array(0));

    queue.renderPendingBatches(connection);

    expect(queue.getLastBatchid()).toEqual(1);
  });

  it('renderPendingBatches renders all available batches in sequence', () => {
    const queue = RenderQueue.getOrCreateQueue(7, NullLogger.instance);

    const connection = {
      send: jest.fn()
    } as any as signalR.HubConnection;

    queue.enqueue(2, new Uint8Array(0));
    queue.enqueue(3, new Uint8Array(0));
    queue.enqueue(4, new Uint8Array(0));
    queue.enqueue(6, new Uint8Array(0));

    queue.renderPendingBatches(connection);

    expect(queue.getLastBatchid()).toEqual(4);
  });


});

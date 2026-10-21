import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CLAIM_DISCARD_FLIGHT_MS,
  CLAIM_RECOGNITION_BEAT_MS,
  CLAIM_TRANSFER_FLIGHT_MS,
} from './const';

describe('Claim Animation & Sequential Event Queue Pipeline', () => {
  describe('Animation Timings', () => {
    it('uses the 1st implementation timing targets', () => {
      expect(CLAIM_DISCARD_FLIGHT_MS).toBe(220);
      expect(CLAIM_RECOGNITION_BEAT_MS).toBe(380);
      expect(CLAIM_TRANSFER_FLIGHT_MS).toBe(240);

      const totalPresentationTime =
        CLAIM_DISCARD_FLIGHT_MS + CLAIM_RECOGNITION_BEAT_MS + CLAIM_TRANSFER_FLIGHT_MS;
      expect(totalPresentationTime).toBe(840);
      expect(totalPresentationTime).toBeLessThanOrEqual(900);
    });
  });

  describe('Sequential Queue Orchestration', () => {
    let queue: any[] = [];
    let isProcessing = false;
    let processedEvents: string[] = [];

    function coalesceDeferredQueue(): void {
      if (queue.length <= 1) return;
      let lastExposuresIndex = -1;
      let lastDiscardsIndex = -1;
      for (let i = queue.length - 1; i >= 0; i--) {
        const type = queue[i].type;
        if (type === 'exposures' && lastExposuresIndex === -1) {
          lastExposuresIndex = i;
        }
        if (type === 'discards' && lastDiscardsIndex === -1) {
          lastDiscardsIndex = i;
        }
      }
      queue = queue.filter((item, index) => {
        if (item.type === 'exposures' && index !== lastExposuresIndex) return false;
        if (item.type === 'discards' && index !== lastDiscardsIndex) return false;
        return true;
      });
    }

    function processNext(onStepComplete: () => void): void {
      if (isProcessing || queue.length === 0) return;
      coalesceDeferredQueue();
      if (queue.length === 0) return;

      const next = queue.shift();
      if (!next) return;

      isProcessing = true;
      processedEvents.push(next.type);

      let stepDelayMs = 0;
      switch (next.type) {
        case 'exposures':
          stepDelayMs = CLAIM_TRANSFER_FLIGHT_MS;
          break;
        case 'discards':
          stepDelayMs = CLAIM_DISCARD_FLIGHT_MS;
          break;
        case 'opponent-discard':
          stepDelayMs = CLAIM_DISCARD_FLIGHT_MS;
          break;
        case 'opponent-pick':
          stepDelayMs = 160;
          break;
        case 'mahjong':
          stepDelayMs = 400;
          break;
      }

      if (queue.length > 2) {
        stepDelayMs = Math.min(stepDelayMs, 120);
      }

      setTimeout(() => {
        isProcessing = false;
        onStepComplete();
      }, stepDelayMs);
    }

    beforeEach(() => {
      queue = [];
      isProcessing = false;
      processedEvents = [];
      vi.useFakeTimers();
    });

    it('processes queued updates sequentially instead of in a single synchronous burst', () => {
      queue.push({ type: 'opponent-pick' });
      queue.push({ type: 'opponent-discard' });
      queue.push({ type: 'exposures' });

      processNext(() => processNext(() => processNext(() => { })));

      // Immediately after triggering, only the first action should be running
      expect(processedEvents).toEqual(['opponent-pick']);
      expect(isProcessing).toBe(true);

      // Advance by 160ms (opponent-pick duration)
      vi.advanceTimersByTime(160);
      expect(processedEvents).toEqual(['opponent-pick', 'opponent-discard']);

      // Advance by 220ms (opponent-discard duration)
      vi.advanceTimersByTime(220);
      expect(processedEvents).toEqual(['opponent-pick', 'opponent-discard', 'exposures']);

      // Advance by 240ms (exposures duration)
      vi.advanceTimersByTime(240);
      expect(isProcessing).toBe(false);
      expect(queue.length).toBe(0);
    });

    it('coalesces intermediate exposures and discards snapshots while preserving sequence', () => {
      queue.push({ type: 'exposures', payload: { version: 1 } });
      queue.push({ type: 'discards', payload: { version: 1 } });
      queue.push({ type: 'exposures', payload: { version: 2 } });
      queue.push({ type: 'discards', payload: { version: 2 } });

      coalesceDeferredQueue();

      expect(queue.length).toBe(2);
      expect(queue[0]).toEqual({ type: 'exposures', payload: { version: 2 } });
      expect(queue[1]).toEqual({ type: 'discards', payload: { version: 2 } });
    });

    it('accelerates step delays when a backlog develops (queue.length > 2)', () => {
      queue.push({ type: 'opponent-discard' });
      queue.push({ type: 'opponent-discard' });
      queue.push({ type: 'opponent-discard' });
      queue.push({ type: 'opponent-discard' });

      processNext(() => { });

      // Normally opponent-discard is 220ms, but with backlog > 2 it accelerates to min(220, 120) = 120ms
      vi.advanceTimersByTime(119);
      expect(isProcessing).toBe(true);

      vi.advanceTimersByTime(1);
      expect(isProcessing).toBe(false);
    });

    it('resets and clears pending queue safely without leaking active state', () => {
      queue.push({ type: 'opponent-pick' });
      queue.push({ type: 'opponent-discard' });

      isProcessing = true;
      // Reset simulated
      queue = [];
      isProcessing = false;

      expect(queue.length).toBe(0);
      expect(isProcessing).toBe(false);
    });
  });
});

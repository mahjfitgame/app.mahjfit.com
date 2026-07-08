import { Service } from '@angular/core';
import { CreateDomObserverOptions } from './type';

@Service()
export class DomObserverService {
  public createMutationObserver(
    target: Node,
    callback: MutationCallback,
    options?: CreateDomObserverOptions,
  ): MutationObserver {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const wrappedCallback: MutationCallback = (mutations, observer) => {
      if (!options?.debounceMs || options.debounceMs <= 0) {
        callback(mutations, observer);
        return;
      }

      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        callback(mutations, observer);
      }, options.debounceMs);
    };

    const observer = new MutationObserver(wrappedCallback);

    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
      ...(options?.config ?? {}),
    });

    if (options?.runImmediately) {
      callback([], observer);
    }

    return observer;
  }

  public disconnectObserver(observer?: MutationObserver | null): void {
    observer?.disconnect();
  }
}
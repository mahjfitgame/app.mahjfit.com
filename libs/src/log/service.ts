import { inject, Service } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

@Service()
export class LogService {
  private readonly logger = inject(NGXLogger);

  public log(message?: unknown, ...args: unknown[]): void {
    this.logger.info(message, ...args);
  }

  public trace(message?: unknown, ...args: unknown[]): void {
    this.logger.trace(message, ...args);
  }

  public debug(message?: unknown, ...args: unknown[]): void {
    this.logger.debug(message, ...args);
  }

  public info(message?: unknown, ...args: unknown[]): void {
    this.logger.info(message, ...args);
  }

  public warn(message?: unknown, ...args: unknown[]): void {
    this.logger.warn(message, ...args);
  }

  public error(message?: unknown, ...args: unknown[]): void {
    this.logger.error(message, ...args);
  }

  public fatal(message?: unknown, ...args: unknown[]): void {
    this.logger.fatal(message, ...args);
  }
}

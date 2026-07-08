import { HttpHeaders } from '@angular/common/http';
import { EnvironmentProviders, importProvidersFrom } from '@angular/core';
import { ConfService } from '../conf/service';
import {
  INGXLoggerConfig,
  LoggerModule,
  NgxLoggerLevel,
  TOKEN_LOGGER_CONFIG,
} from 'ngx-logger';
import { Capacitor } from '@capacitor/core';

function buildLoggerConfig(conf: ConfService): INGXLoggerConfig {
  const token = conf.bfwApiSdkJwtAccessToken?.trim();
  const sourceMap = (!conf.isProductionEnv && !Capacitor.isNativePlatform());

  return {
    level: conf.isProductionEnv ? NgxLoggerLevel.INFO : NgxLoggerLevel.TRACE,
    enableSourceMaps: sourceMap,
    disableFileDetails: !sourceMap,
    proxiedSteps: 1,
    serverLogLevel: NgxLoggerLevel.ERROR,
    serverLoggingUrl: conf.backofficeServerSideLogUrl,
    disableConsoleLogging: conf.isProductionEnv ? true : false,
    withCredentials: false,
    customHttpHeaders: token
      ? new HttpHeaders({
          Authorization: `Bearer ${token}`,
        })
      : undefined,
  };
}

export function provideLogModule(): EnvironmentProviders {
  return importProvidersFrom(
    LoggerModule.forRoot(undefined, {
      configProvider: {
        provide: TOKEN_LOGGER_CONFIG,
        useFactory: buildLoggerConfig,
        deps: [ConfService],
      },
    }),
  );
}

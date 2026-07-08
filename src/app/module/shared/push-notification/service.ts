// file: ./src/app/module/shared/push-notification/service.ts
import { Service, Type, inject } from '@angular/core';
import { ConfService } from '@libs/conf/service';
import { LogService } from '@libs/log/service';

@Service()
export class PushNotificationService {
    private readonly conf = inject(ConfService);
    private readonly log = inject(LogService);
    
}
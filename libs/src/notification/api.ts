// file: libs/src/notification/api.ts

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  NotificationInboxInput,
  NotificationInboxOutput,
  NotificationMarkReadInput,
  PushDeviceDisableInput,
  PushDeviceRegisterInput,
} from './model';
import { NOTIFICATION_CONFIG } from './token';
import { NotificationConfig } from './model';

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    [key: string]: any;
  }>;
}

@Injectable({ providedIn: 'root' })
export class NotificationApi {
  constructor(
    private readonly http: HttpClient,

    @Inject(NOTIFICATION_CONFIG)
    private readonly config: NotificationConfig,
  ) {}

  public async registerDevice(input: PushDeviceRegisterInput): Promise<void> {
    const query = `
      mutation UserDeviceNotificationTokenCreate($input: [UserDeviceNotificationTokenCreateInputDto!]!) {
        UserDeviceNotificationTokenCreate(input: $input) {
          id
          provider
          token
          u_id
          udvc_id
          deleted
        }
      }
    `;

    await this.execute(query, { input });
  }

  public async disableDevice(input: PushDeviceDisableInput): Promise<void> {
    const query = `
      mutation PushDeviceDisable($input: PushDeviceDisableInputDto!) {
        PushDeviceDisable(input: $input)
      }
    `;

    await this.execute(query, { input });
  }

  public async inbox(input: NotificationInboxInput): Promise<NotificationInboxOutput> {
    const query = `
      query NotificationInbox($input: NotificationInboxInputDto!) {
        NotificationInbox(input: $input) {
          total
          items {
            id
            app_code
            user_id
            type
            title
            body
            data
            read_at
            created_at
          }
        }
      }
    `;

    const response = await this.execute<{
      NotificationInbox: NotificationInboxOutput;
    }>(query, { input });

    return response.NotificationInbox;
  }

  public async markRead(input: NotificationMarkReadInput): Promise<void> {
    const query = `
      mutation NotificationMarkRead($input: NotificationMarkReadInputDto!) {
        NotificationMarkRead(input: $input)
      }
    `;

    await this.execute(query, { input });
  }

  private async execute<T>(
    query: string,
    variables: Record<string, any>,
  ): Promise<T> {
    const response = await firstValueFrom(
      this.http.post<GraphQLResponse<T>>(
        this.config.graphqlEndpoint,
        {
          query,
          variables,
        },
        {
          headers: this.buildHeaders(),
        },
      ),
    );

    if (response.errors?.length) {
      throw new Error(response.errors[0].message);
    }

    if (!response.data) {
      throw new Error('GraphQL response data is empty.');
    }

    return response.data;
  }

  private buildHeaders(): HttpHeaders {
    const authHeaders = this.config.getAuthHeaders?.() || {};

    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    const keys = Object.keys(authHeaders);
    let i = 0;

    while (i < keys.length) {
      const key = keys[i];
      headers = headers.set(key, authHeaders[key]);
      i++;
    }

    return headers;
  }
}
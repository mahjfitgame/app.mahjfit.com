import { Service, inject } from '@angular/core';
import { UserModuleState } from './state';
import { UserModuleRecordType } from './type';

/** Feature workflows/API calls stay in the service; signals stay in the state. */
@Service({ autoProvided: false })
export class UserModuleService {
  public readonly state = inject(UserModuleState);

  /** Call when the authenticated user/session becomes available. */
  public initializeUser(userId: string | number): void {
    this.state.setUserScope(userId);
  }

  public async loadUsers(): Promise<void> {
    this.state.setLoading(true);
    this.state.setError(null);

    try {
      // Replace with the real API call.
      const users: UserModuleRecordType[] = [];
      this.state.setUsers(users);
    } catch (error) {
      this.state.setError(error instanceof Error ? error.message : 'Unable to load users.');
    } finally {
      this.state.setLoading(false);
    }
  }

  public logout(): void {
    this.state.clearUserScope();
    this.state.resetRuntimeState();
  }
}

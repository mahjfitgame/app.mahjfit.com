import { Provider } from '@angular/core';

/**
 * Intentionally empty.
 *
 * SignoutRoute, SignoutState and SignoutService are root @Service() so any
 * module (signin today, others later) can inject SignoutService without
 * providing anything. All three must stay root together: a root service
 * cannot reach a component-scoped provider.
 *
 * ⚠ Do NOT add them back here and list SIGNOUT_PROVIDER in a component's
 * providers — that shadows the root singletons with a second set.
 */
export const SIGNOUT_PROVIDER: Provider[] = [];

import { TestBed } from '@angular/core/testing';
import { ConfService } from '@libs/conf/service';
import { AppStateRepository } from '@libs/sqlite/module/app-state/repository';
import { SignalStateLocalDb } from './local.db';
import { SignalStateLocalDbSourceType } from './type';
import { SignalStateUtility } from './utility';

describe('SignalStateLocalDb local DB switch', () => {
  const appStateRepository = {
    getValue: vi.fn(),
    setValue: vi.fn(),
    deleteKey: vi.fn(),
  };
  const utility = {
    normalizeStorageKey: vi.fn(),
    maybeNormalizeStorageKey: vi.fn(),
    buildRecord: vi.fn(),
  };

  let service: SignalStateLocalDb;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        SignalStateLocalDb,
        {
          provide: ConfService,
          useValue: { enableLocalDb: false },
        },
        {
          provide: AppStateRepository,
          useValue: appStateRepository,
        },
        {
          provide: SignalStateUtility,
          useValue: utility,
        },
      ],
    });

    service = TestBed.inject(SignalStateLocalDb);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('returns no stored value and skips the default repository when disabled', async () => {
    await expect(service.load('profile')).resolves.toBeNull();
    await service.save('profile', { id: 7 });
    await service.remove('profile');

    expect(appStateRepository.getValue).not.toHaveBeenCalled();
    expect(appStateRepository.setValue).not.toHaveBeenCalled();
    expect(appStateRepository.deleteKey).not.toHaveBeenCalled();
    expect(utility.normalizeStorageKey).not.toHaveBeenCalled();
    expect(utility.maybeNormalizeStorageKey).not.toHaveBeenCalled();
  });

  it('does not invoke a custom local DB source when disabled', async () => {
    const source = {
      getValue: vi.fn().mockResolvedValue(null),
      setValue: vi.fn().mockResolvedValue(undefined),
      deleteKey: vi.fn().mockResolvedValue(undefined),
    } as unknown as SignalStateLocalDbSourceType;

    await expect(service.load('custom', 1, source)).resolves.toBeNull();
    await service.save('custom', 'value', 1, source);
    await service.remove('custom', source);

    expect(source.getValue).not.toHaveBeenCalled();
    expect(source.setValue).not.toHaveBeenCalled();
    expect(source.deleteKey).not.toHaveBeenCalled();
  });
});

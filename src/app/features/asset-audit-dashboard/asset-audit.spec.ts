import { TestBed } from '@angular/core/testing';

import { AssetAudit } from './asset-audit';

describe('AssetAudit', () => {
  let service: AssetAudit;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssetAudit);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

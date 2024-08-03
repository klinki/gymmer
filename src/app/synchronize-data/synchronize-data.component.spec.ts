import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SynchronizeDataComponent } from './synchronize-data.component';

describe('SynchronizeDataComponent', () => {
  let component: SynchronizeDataComponent;
  let fixture: ComponentFixture<SynchronizeDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SynchronizeDataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SynchronizeDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

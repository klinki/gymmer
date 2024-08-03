import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingPlanEditComponent } from './training-plan-edit.component';

describe('TrainingPlanEditComponent', () => {
  let component: TrainingPlanEditComponent;
  let fixture: ComponentFixture<TrainingPlanEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingPlanEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrainingPlanEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

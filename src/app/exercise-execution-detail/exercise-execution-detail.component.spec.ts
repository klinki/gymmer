import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExerciseExecutionDetailComponent } from './exercise-execution-detail.component';

describe('ExerciseExecutionDetailComponent', () => {
  let component: ExerciseExecutionDetailComponent;
  let fixture: ComponentFixture<ExerciseExecutionDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseExecutionDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExerciseExecutionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

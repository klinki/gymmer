import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseListComponent } from './exercise-list.component';
import { DatabaseService } from '../database.service';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

describe('ExerciseListComponent', () => {
  let component: ExerciseListComponent;
  let fixture: ComponentFixture<ExerciseListComponent>;

  // Mock DatabaseService
  const dbServiceMock = {
    exercises: {
      toArray: () => Promise.resolve([])
    },
    exerciseExecutions: {
      where: () => ({
        equals: () => ({
          count: () => Promise.resolve(0)
        })
      })
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExerciseListComponent],
      imports: [
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatListModule,
        MatToolbarModule,
        MatButtonModule,
        FormsModule,
        NoopAnimationsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: DatabaseService, useValue: dbServiceMock }
      ]
    });
    fixture = TestBed.createComponent(ExerciseListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SettingsComponent } from './settings.component';
import { DatabaseService } from '../database.service';
import { SupabaseAuthService } from '../supabase-auth.service';
import { Router } from '@angular/router';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let database: jasmine.SpyObj<DatabaseService>;

  beforeEach(async () => {
    database = jasmine.createSpyObj<DatabaseService>('DatabaseService', ['importFromJson']);
    database.importFromJson.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        { provide: DatabaseService, useValue: database },
        { provide: SupabaseAuthService, useValue: { $user: of(null) } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows progress while importing and a success status after completion', async () => {
    let finishImport!: () => void;
    database.importFromJson.and.returnValue(new Promise<void>(resolve => finishImport = resolve));
    const input = {
      files: [{ text: () => Promise.resolve('{"trainings":[]}') }],
      value: 'database.json',
    };

    const importPromise = component.onChange({ target: input } as unknown as Event);
    await Promise.resolve();
    fixture.detectChanges();

    expect(component.importing()).toBeTrue();
    expect(fixture.nativeElement.querySelector('mat-progress-bar')).not.toBeNull();
    const importButton: HTMLButtonElement = fixture.nativeElement.querySelector('button:nth-of-type(2)');
    expect(importButton.disabled).toBeTrue();
    expect(importButton.textContent).toContain('Importing…');

    finishImport();
    await importPromise;
    fixture.detectChanges();

    expect(database.importFromJson).toHaveBeenCalledOnceWith('{"trainings":[]}');
    expect(component.importing()).toBeFalse();
    expect(component.importStatus()).toBe('Import completed successfully.');
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent)
      .toContain('Import completed successfully.');
    expect(input.value).toBe('');
  });

  it('shows an error and no success status when import fails', async () => {
    spyOn(console, 'error');
    database.importFromJson.and.rejectWith(new Error('Invalid backup'));
    const input = {
      files: [{ text: () => Promise.resolve('invalid') }],
      value: 'database.json',
    };

    await component.onChange({ target: input } as unknown as Event);
    fixture.detectChanges();

    expect(component.importing()).toBeFalse();
    expect(component.importStatus()).toBeNull();
    expect(component.importError()).toBe('Import failed. No database changes were saved.');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent)
      .toContain('Import failed. No database changes were saved.');
  });

  it('does nothing when file selection is cancelled', async () => {
    await component.onChange({ target: { files: [] } } as unknown as Event);

    expect(database.importFromJson).not.toHaveBeenCalled();
    expect(component.importing()).toBeFalse();
  });
});

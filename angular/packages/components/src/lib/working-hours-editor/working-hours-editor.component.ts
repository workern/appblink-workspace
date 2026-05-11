import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output
} from '@angular/core';

export interface DayTimings {
  openTime: string;
  closeTime: string;
  closed: boolean;
}

export interface WeeklyTimings {
  monday: DayTimings;
  tuesday: DayTimings;
  wednesday: DayTimings;
  thursday: DayTimings;
  friday: DayTimings;
  saturday: DayTimings;
  sunday: DayTimings;
}

export const DEFAULT_WEEKLY_TIMINGS: WeeklyTimings = {
  monday: { openTime: '09:00', closeTime: '18:00', closed: false },
  tuesday: { openTime: '09:00', closeTime: '18:00', closed: false },
  wednesday: { openTime: '09:00', closeTime: '18:00', closed: false },
  thursday: { openTime: '09:00', closeTime: '18:00', closed: false },
  friday: { openTime: '09:00', closeTime: '18:00', closed: false },
  saturday: { openTime: '09:00', closeTime: '18:00', closed: false },
  sunday: { openTime: '09:00', closeTime: '18:00', closed: true }
};

type DayKey = keyof WeeklyTimings;

export const DAY_LABELS: { key: DayKey; label: string }[] = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' }
];

@Component({
  selector: 'app-working-hours-editor',
  standalone: true,
  imports: [],
  templateUrl: './working-hours-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkingHoursEditorComponent {
  readonly value = input.required<WeeklyTimings>();
  readonly valueChange = output<WeeklyTimings>();

  readonly dayLabels = DAY_LABELS;

  readonly rows = computed(() => {
    const w = this.value();
    return DAY_LABELS.map(({ key, label }) => ({ key, label, day: w[key] }));
  });

  updateDay(key: DayKey, partial: Partial<DayTimings>): void {
    const current = this.value();
    this.valueChange.emit({
      ...current,
      [key]: { ...current[key], ...partial }
    });
  }

  toggleClosed(key: DayKey, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateDay(key, { closed: checked });
  }

  setOpenTime(key: DayKey, event: Event): void {
    this.updateDay(key, { openTime: (event.target as HTMLInputElement).value });
  }

  setCloseTime(key: DayKey, event: Event): void {
    this.updateDay(key, {
      closeTime: (event.target as HTMLInputElement).value
    });
  }
}

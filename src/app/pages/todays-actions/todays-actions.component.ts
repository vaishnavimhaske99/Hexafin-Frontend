
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Subject,
  timer,
  switchMap,
  takeUntil,
  catchError,
  of
} from 'rxjs';

interface TodaysActivity {
  id: number;
  leadId: number;
  leadName: string;
  type: string;
  description: string;
  userId: number;
  userName: string;
  activityDateTime: string;
  createdAt: string;
}

@Component({
  selector: 'app-todays-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './todays-actions.component.html',
  styleUrls: ['./todays-actions.component.css']
})
export class TodaysActionsComponent implements OnInit, OnDestroy {

  activities: TodaysActivity[] = [];
  loading = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  private apiUrl =
    'https://api.hexafin.cloud/api/leads/activities/today';

  constructor(private http: HttpClient) {}

  // LOAD TODAY'S ACTIVITIES
  ngOnInit(): void {

    timer(0, 30000)
      .pipe(
        takeUntil(this.destroy$),

        switchMap(() => {

          this.loading = true;

          return this.http
            .get<TodaysActivity[]>(this.apiUrl)
            .pipe(
              catchError(error => {

                console.error(
                  "Today's Actions API Error:",
                  error
                );

                this.errorMessage =
                  "Unable to load today's activities.";

                return of(null);
              })
            );
        })
      )
      .subscribe(data => {

        if (data !== null) {
          this.activities = data;
          this.errorMessage = '';
        }

        this.loading = false;
      });
  }

  // MANUAL REFRESH
  refreshActivities(): void {

    this.loading = true;
    this.errorMessage = '';

    this.http
      .get<TodaysActivity[]>(this.apiUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({

        next: data => {
          this.activities = data;
          this.loading = false;
        },

        error: error => {

          console.error(
            'Refresh Activities Error:',
            error
          );

          this.errorMessage =
            'Unable to refresh activities.';

          this.loading = false;
        }
      });
  }

  // ACTIVITY ICON
  getActivityIcon(type: string): string {

    const icons: { [key: string]: string } = {
      CALL: '📞',
      WHATSAPP: '💬',
      EMAIL: '📧',
      TEXT: '✉️',
      MEETING: '🤝',
      OTHER: '📌'
    };

    return icons[type] || '📌';
  }

  // DESTROY SUBSCRIPTION
  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();
  }
}

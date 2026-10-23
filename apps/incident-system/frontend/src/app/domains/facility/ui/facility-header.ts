import { Component, input, output } from '@angular/core';
import type { DisplayMode } from '../model/facility';
@Component({
  selector: 'app-facility-header',
  template: `
    <header class="page-header">
      <div class="brand-lockup">
        <a
          class="corporate-logo-link"
          href="https://soverius.ai/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit the Soverius AI website"
        >
          <img class="corporate-logo" src="/soverius-ai-original.png" alt="Soverius AI" />
        </a>
        <div class="brand-copy">
          <p class="eyebrow">Soverius Chocolate operations</p>
          <h1 class="product-title">Incident Management</h1>
          <p class="subtitle">
            Persistent factory telemetry, historical readings, operator-managed alarms, and reviewed
            SQL investigations.
          </p>
          <p class="stage-label">AI DevCraft · Agentic UI · CopilotKit</p>
        </div>
      </div>
      <div class="header-actions">
        <span class="database-state">SQLite connected</span>
        <span class="mode-state" [class.mode-state-live]="mode() === 'snapshot'">
          <span aria-hidden="true"></span>
          @switch (mode()) {
            @case ('snapshot') {
              Snapshot live
            }
            @case ('reading-log') {
              Reading log
            }
            @case ('historian-result') {
              Historian result
            }
          }
        </span>
        <span class="alarm-summary" [class.has-alarms]="activeAlarmCount() > 0">
          {{ activeAlarmCount() }} active {{ activeAlarmCount() === 1 ? 'alarm' : 'alarms' }}
        </span>
        <button class="secondary-button" type="button" (click)="refresh.emit()">Refresh</button>
      </div>
    </header>
  `,
  styles: `
    @use './surface';
    :host {
      display: block;
      min-width: 0;
    }

    .page-header {
      align-items: flex-start;
      margin-bottom: 36px;
    }

    .brand-lockup {
      min-width: 0;
    }

    .brand-copy {
      min-width: 0;
    }

    .corporate-logo-link {
      display: inline-block;
      border-radius: 6px;
    }

    .corporate-logo-link:focus-visible {
      outline: 3px solid var(--so-brand);
      outline-offset: 4px;
    }

    .corporate-logo {
      display: block;
      width: 200px;
      max-width: 55vw;
      height: auto;
      margin-bottom: 16px;
    }

    .product-title {
      margin: 3px 0 8px;
      color: var(--so-text);
      font-size: clamp(2.2rem, 5vw, 3.6rem);
      font-weight: 800;
      letter-spacing: -0.045em;
    }

    .stage-label {
      margin: 10px 0 0;
      color: var(--so-brand);
      font-size: 0.72rem;
      font-weight: 750;
      letter-spacing: 0.04em;
    }

    .header-actions {
      justify-content: flex-end;
      flex-wrap: wrap;
    }

    .database-state {
      background: var(--so-success-soft);
      color: var(--so-success-text);
    }

    .alarm-summary,
    .room-heading > span {
      background: var(--so-surface-tint);
      color: var(--so-brand);
    }

    .alarm-summary.has-alarms {
      background: #f7d7d1;
      color: #71291f;
    }

    .mode-state {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 11px;
      border-radius: 999px;
      background: var(--so-surface-tint);
      color: var(--so-text-muted);
      font-size: 0.76rem;
      font-weight: 800;
      white-space: nowrap;
    }

    .mode-state > span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--so-text-muted);
    }

    .mode-state-live {
      background: var(--so-success-soft);
      color: var(--so-success-text);
    }

    .mode-state-live > span {
      background: var(--so-success);
      box-shadow: 0 0 0 4px var(--so-success-halo);
    }

    @media (max-width: 780px) {
      .page-header,
      .section-heading,
      .room-heading,
      .history-heading {
        align-items: flex-start;
        flex-direction: column;
      }
      .header-actions {
        justify-content: flex-start;
      }
      .corporate-logo {
        width: 175px;
      }
    }
  `,
})
export class FacilityHeader {
  readonly mode = input.required<DisplayMode>();
  readonly activeAlarmCount = input.required<number>();
  readonly refresh = output<void>();
}

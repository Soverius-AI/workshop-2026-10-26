import { Component, input } from '@angular/core';
import type { ActivityRenderer } from '@copilotkit/angular';
import type { InvestigationProgress } from '@packt-workshop/contracts';

@Component({
  selector: 'app-investigation-progress-card',
  template: `
    <section role="status" aria-live="polite">
      <div class="label">
        <span aria-hidden="true" class="indicator" [class.running]="content().status === 'running'">
          {{ content().status === 'completed' ? '✓' : content().status === 'running' ? '◌' : '!' }}
        </span>
        <span class="message">{{ content().message }}</span>
        <strong>{{ content().progress }}%</strong>
      </div>
      <progress
        max="100"
        [value]="content().progress"
        aria-label="SQL workflow progress"
        [attr.aria-valuetext]="content().progress + '% · ' + content().message"
      ></progress>
    </section>
  `,
  styles: `
    section {
      margin: 12px 0;
      padding: 14px;
      color: var(--so-brand);
      background: var(--so-surface-soft);
      border: 1px solid var(--so-border);
      border-radius: 10px;
      font-size: 0.82rem;
      line-height: 1.5;
      box-shadow: 0 3px 10px var(--so-shadow);
    }
    .label {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .message {
      flex: 1;
    }
    strong {
      font-variant-numeric: tabular-nums;
    }
    progress {
      display: block;
      width: 100%;
      height: 8px;
      margin-top: 12px;
      border: 0;
      border-radius: 4px;
      overflow: hidden;
      background: var(--so-surface-tint);
      accent-color: var(--so-brand);
    }
    progress::-webkit-progress-bar {
      background: var(--so-surface-tint);
    }
    progress::-webkit-progress-value {
      background: var(--so-brand);
    }
    progress::-moz-progress-bar {
      background: var(--so-brand);
    }
    .indicator {
      font-size: 1.3rem;
      font-weight: bold;
    }
    .running {
      animation: turn 1.4s linear infinite;
    }
    @keyframes turn {
      to {
        transform: rotate(360deg);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .running {
        animation: none;
      }
    }
  `,
})
export class InvestigationProgressCard implements ActivityRenderer<InvestigationProgress> {
  readonly activityType = input.required<string>();
  readonly content = input.required<InvestigationProgress>();
  readonly message = input.required<ReturnType<ActivityRenderer['message']>>();
  readonly agent = input.required<ReturnType<ActivityRenderer['agent']>>();
}

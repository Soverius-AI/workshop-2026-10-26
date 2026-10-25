import { Component } from '@angular/core';
import { CopilotChat } from '@copilotkit/angular';
import { StreamingAutoScrollDirective } from './streaming-auto-scroll.directive';
import { CHAT_STYLES } from './chat.styles';

@Component({
  selector: 'app-agent-chat',
  imports: [CopilotChat, StreamingAutoScrollDirective],
  template: `
    <aside aria-labelledby="chat-title">
        <div class="chat-heading">
          <div>
            <p class="eyebrow">CopilotKit · AG-UI streaming</p>
            <h2 id="chat-title">Factory assistant</h2>
          </div>
          <span>Frontend + SQL + approval</span>
        </div>
        <p class="chat-boundary">
          The assistant can adjust this view, query the historian, and propose raising an alarm.
          Only the operator can approve the audited alarm action.
        </p>

        <div class="copilot-chat-shell">
          <copilot-chat agentId="default" appStreamingAutoScroll />
        </div>
    </aside>
`,
  styles: CHAT_STYLES,
})
export class AgentChatComponent {}

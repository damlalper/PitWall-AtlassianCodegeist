import ForgeUI, { render, Fragment, Text, Strong, StatusLozenge } from '@forge/ui';

/**
 * Panel Handler
 * Displays PitWall telemetry in Jira issue panel
 */
export const handler = render(
  <Fragment>
    <Text>
      <Strong>🏎️ PitWall Race Engineer</Strong>
    </Text>
    <Text>Your AI-powered incident analysis system</Text>
    <Text>---</Text>
    <Text>
      Status: <StatusLozenge text="Online" appearance="success" />
    </Text>
    <Text>📡 Telemetry: Ready</Text>
    <Text>🤖 AI Engine: Active</Text>
    <Text>⏱️ MTTR Target: &lt; 5 minutes</Text>
    <Text>---</Text>
    <Text>Williams Racing • Powered by Atlassian Forge</Text>
  </Fragment>
);

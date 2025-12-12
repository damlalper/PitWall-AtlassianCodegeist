import ForgeUI, { Fragment, Text, Strong, Heading } from '@forge/ui';

/**
 * Team Dashboard Gadget
 * Real-time incident metrics and KPIs for Jira dashboard
 *
 * Note: This is a placeholder UI component.
 * Actual metrics are provided via the dashboardResolver.
 */
const DashboardGadget = () => {
  return (
    <Fragment>
      <Heading size="medium">🏎️ PitWall Dashboard</Heading>
      <Text>
        <Strong>Enterprise Incident Management</Strong>
      </Text>
      <Text>Track MTTR, SLA compliance, and incident patterns in real-time.</Text>
      <Text>View detailed metrics in the PitWall admin panel.</Text>
    </Fragment>
  );
};

export default DashboardGadget;

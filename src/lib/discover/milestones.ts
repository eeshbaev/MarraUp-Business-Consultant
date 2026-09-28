// My Path / Discover — milestones. Updated for the Entrepreneur Journey
// Redesign v2.0: Problems/Opportunities/Idea Candidates were merged into
// Projects (see the Find & Develop implementation plan), so these
// milestones now read off Project stage/count instead of the old tables.

export interface MilestoneStatus {
  id: string;
  label: string;
  achieved: boolean;
}

export interface DiscoverProgressInput {
  discoveryCompleted: boolean;
  directionExplored: boolean; // tracked client-side today via a simple flag; see note in profile page
  projectCount: number;
  activeProjectCount: number;
  anyProjectPastFind: boolean; // reached blueprint/developing/testing/revenue
}

export function computeMilestones(input: DiscoverProgressInput): MilestoneStatus[] {
  return [
    { id: "discovery_completed", label: "Discovery completed", achieved: input.discoveryCompleted },
    { id: "first_direction_explored", label: "First direction explored", achieved: input.directionExplored },
    { id: "first_project_started", label: "First project started", achieved: input.projectCount > 0 },
    { id: "first_blueprint_written", label: "First Blueprint written", achieved: input.anyProjectPastFind },
    { id: "three_active_projects", label: "Three active projects reached", achieved: input.activeProjectCount >= 3 },
  ];
}

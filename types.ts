//! changing this to a .d.ts file caused rollup build to fail

export enum MEETING_STATUS {
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed'
}

export type MeetingDetails = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: MEETING_STATUS;
};

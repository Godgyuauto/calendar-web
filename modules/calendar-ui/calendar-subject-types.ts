export interface CalendarSubjectMember {
  userId: string;
  name: string;
  working: boolean;
  color: string;
  isSelf: boolean;
}

export interface CalendarSubjectContext {
  selfUserId: string;
  members: CalendarSubjectMember[];
}

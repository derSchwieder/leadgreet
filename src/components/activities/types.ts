export type TimelineActivity = {
  id: string;
  type: string;
  subject: string | null;
  note: string | null;
  occurredAt: string;
  outcome: string | null;
  contactId: string | null;
  contactName: string | null;
  contactRole?: string | null;
  responseToActivityId: string | null;
};

export type TimelineStatusChange = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  changedAt: string;
};

export type TimelineContact = {
  id: string;
  fullName: string;
  role?: string | null;
};

export type WorkbenchTodo = {
  id: string;
  title: string;
  dueAt: string;
  status: string;
  completedAt: string | null;
  contactId: string | null;
  contactName: string | null;
  contactRole?: string | null;
  relatedActivityId: string | null;
};

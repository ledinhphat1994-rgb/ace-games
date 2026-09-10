export type AnnouncementPriority = 'NORMAL' | 'EMERGENCY';

export interface AnnouncementReaction {
  emoji: string;
  count: number;
  userReacted?: boolean;
}

export interface StudentAcknowledgment {
  studentId: string;
  studentName: string;
  avatar: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export interface AnnouncementAttachment {
  name: string;
  size: string;
  url: string;
  type: 'pdf' | 'doc' | 'image';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    role: string;
    avatar: string;
    verified: boolean;
  };
  priority: AnnouncementPriority;
  timestamp: string;
  relativeTime: string;
  expiresAt?: string;
  totalStudents: number;
  acknowledgments: StudentAcknowledgment[];
  reactions: Record<string, AnnouncementReaction>;
  attachments?: AnnouncementAttachment[];
}

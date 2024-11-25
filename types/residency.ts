// types/residency.ts

export interface Residency {
  id: string;
  _status: "draft" | "published";
  _createdAt: string;
  _updatedAt: string;
  title: string;
  description: string;
  photo?: {
    url: string;
  };
  startDate: string;
  endDate: string;
  slug: string;
  activeStatus:
    | "new"
    | "pending_input"
    | "pending_review"
    | "changes_requested"
    | "approved";
}

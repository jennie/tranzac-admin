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
    | "resident_action_required"
    | "pending_review"
    | "resident_action_required"
    | "approved";
}

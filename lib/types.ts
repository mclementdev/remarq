import type { Database } from "@/lib/database.types";

type Tables = Database["public"]["Tables"];
type Views = Database["public"]["Views"];

export type Furniture = Tables["furnitures"]["Row"];
export type FurnitureUpdate = Tables["furnitures"]["Update"];
export type FurnitureOverview = Views["furniture_overview"]["Row"];
export type Photo = Tables["photos"]["Row"];
export type StatusHistory = Tables["status_history"]["Row"];
export type ActivityLog = Tables["activity_log"]["Row"];
export type TimeEntry = Tables["time_entries"]["Row"];
export type FinanceLine = Tables["finance_lines"]["Row"];
export type Appointment = Tables["appointments"]["Row"];
export type Note = Tables["notes"]["Row"];
export type Attachment = Tables["attachments"]["Row"];
export type Brand = Tables["brands"]["Row"];

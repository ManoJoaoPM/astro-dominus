import { FieldInterface } from "@discovery-solutions/struct/client";
import { ReportBlockInterface } from "./index";
import { ColumnDef } from "@tanstack/react-table";

export const reportBlockColumns: ColumnDef<ReportBlockInterface>[] = [
  { header: "Template", accessorKey: "templateId" },
  { header: "Ordem", accessorKey: "order" },
];

export const reportBlockFields: FieldInterface[] = [
  // Usually blocks are managed via drag-and-drop editor, not standard forms
];

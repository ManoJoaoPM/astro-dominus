import { FieldInterface } from "@discovery-solutions/struct/client";
import { MetricSnapshotInterface } from "./index";
import { ColumnDef } from "@tanstack/react-table";

export const metricSnapshotColumns: ColumnDef<MetricSnapshotInterface>[] = [
  { header: "Métrica", accessorKey: "metricKey" },
  { header: "Data", accessorKey: "date" },
  { header: "Valor", accessorKey: "value" },
];

export const metricSnapshotFields: FieldInterface[] = [
  // Read-only usually
];

# Implementation Plan: Fix Database Connection Import

The user encountered a `Module not found` error because `src/app/api/public/reports/[slug]/route.ts` imports `connectDB` from `@/lib/mongo`, which does not exist. The correct database connection utility is located at `@/lib/mongoose`.

## 1. Fix Import and Connection Logic
We will update `src/app/api/public/reports/[slug]/route.ts`.

- **Remove**: `import { connectDB } from "@/lib/mongo";`
- **Import**: `import { startConnection } from "@/lib/mongoose";`
- **Update Usage**: Replace `await connectDB();` with `await startConnection();`.

This aligns with the existing project structure seen in `src/lib/mongoose.ts`.

## 2. Execution Steps

1.  **Modify Route File**: Edit `src/app/api/public/reports/[slug]/route.ts` to use the correct import and function.

No other changes are required as the models already use the correct `db` instance from `@/lib/mongoose`.

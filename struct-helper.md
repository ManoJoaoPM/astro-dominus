# @discovery-solutions/struct

A structured framework for building forms, CRUDs, and admin interfaces with Next.js, React Hook Form, Zod, TanStack Query, and TailwindCSS. The goal is to provide a consistent way to define UI elements and data workflows while keeping the UI layer customizable through an injected `StructUIProvider`.

## 🚀 Key Features

- **UI Agnostic** → works with ShadCN, Radix, or any custom design system
- **Structured CRUDs** → generate list, detail, and edit views with minimal boilerplate
- **Forms with Validation** → powered by react-hook-form + zod
- **Async Data Management** → built on top of @tanstack/react-query
- **Composable** → all building blocks are exposed, no hidden magic
- **Type-Safe** → full TypeScript support with generic types
- **Flexible Hooks** → lifecycle hooks for custom business logic
- **Soft Delete Support** → optional soft delete strategy for data preservation
- **Role-Based Access** → built-in RBAC per HTTP method

---

## 📦 Installation

### Dependencies

First, install the required peer dependencies:

```bash
npm i lucide-react @tanstack/react-query zod sonner mongoose class-variance-authority
# or
yarn add lucide-react @tanstack/react-query zod sonner mongoose class-variance-authority
# or
pnpm add lucide-react @tanstack/react-query zod sonner mongoose class-variance-authority
```

### Main Package

Install the struct package from GitHub:

```bash
npm install github:discovery-solutions/struct
# or
yarn add github:discovery-solutions/struct
# or
pnpm add github:discovery-solutions/struct
```

---

## 🛠️ Configuration

### 1. Create a Bootstrap File

Create a `struct.ts` file at the root of your project (`/src` or `/`):

```typescript
// struct.ts
import { connectDB, closeDB } from "@/lib/mongo";
import { Struct } from "@discovery-solutions/struct";

// Re-export everything from the package
export * from "@discovery-solutions/struct";

Struct.configure({
  database: {
    startConnection: connectDB,
    closeConnection: closeDB, // Optional: cleanup function
  },
  // Optional auth integration
  // auth: {
  //   getSession: async (req, context) => null,
  //   getUser: async () => null,
  // },
});
```

**Important:** Always import from this file instead of the raw package:

```typescript
// ✅ Good
import { Struct } from "@/struct";

// ❌ Avoid
import { Struct } from "@discovery-solutions/struct";
```

### 2. Configure Next.js

Update your `next.config.js` to transpile the package:

```javascript
import { type NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@discovery-solutions/struct" // Required for Tailwind + bundling
  ],
  webpack(config) {
    // Optional: extra Webpack aliases
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src"),
    };
    return config;
  },
};

export default nextConfig;
```

### 3. Global CSS Setup

Add this line to your **`app/globals.css`** (or equivalent global CSS file):

```css
@source "../../node_modules/@discovery-solutions/struct";
```

This ensures Tailwind classes from Struct UI components are registered.

### 4. Extend StructUser (Optional)

You can extend the default `StructUser` type to include custom roles or permissions:

```typescript
// types/struct.d.ts
import type { StructUser as BaseUser } from "@discovery-solutions/struct";

declare module "@discovery-solutions/struct" {
  export interface StructUser extends BaseUser {
    role: "admin" | "user" | "superadmin";
    permissions?: string[];
  }
}
```

---

## 📁 Project Structure & Model Organization

### Recommended Model Structure

Organize your models following this pattern for better maintainability:

```
@/models/
└── identity/
    └── user/
        ├── index.ts          # Types and Zod schemas
        ├── model.ts          # Mongoose model definition
        ├── schema.ts         # UI schemas (columns, fields)
        └── constants.ts      # Enums, options, static data
```

#### 1. Types & Validation (`index.ts`)

Define your TypeScript interfaces and Zod schemas:

```typescript
// @/models/identity/user/index.ts
import { z } from "zod";

export type UserRole = "admin" | "manager" | "broker" | "sdr";

export interface UserInterface {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole | "*";
  enterprise?: string;
  avatar?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export const userCreateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
  role: z.enum(["admin", "manager", "broker", "sdr"]).default("broker"),
  enterprise: z.string().optional(),
  avatar: z.string().url().optional(),
  phone: z.string().optional(),
});

export const userUpdateSchema = userCreateSchema.partial();
```

#### 2. Mongoose Model (`model.ts`)

Define your Mongoose schema and model:

```typescript
// @/models/identity/user/model.ts
import { compass, Schema } from "@/lib/mongoose";
import { UserInterface } from "@/models/identity/user";
import { Enterprise } from "@/models/identity/enterprise/model";

export * from "@/models/identity/user";

const UserSchema = new Schema<UserInterface>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["admin", "manager", "broker", "sdr"],
      default: "broker",
      required: true,
    },
    enterprise: {
      type: Schema.Types.ObjectId,
      ref: Enterprise,
      nullable: true,
      index: true,
    },
    avatar: { type: String },
    phone: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export const User =
  compass.models?.User ||
  compass.model<UserInterface>("User", UserSchema);
```

#### 3. UI Schemas (`schema.ts`)

Define columns for tables and fields for forms:

```typescript
// @/models/identity/user/schema.ts
import { UserInterface } from "@/models/identity/user";
import { FieldInterface } from "@discovery-solutions/struct/client";
import { ColumnDef } from "@tanstack/react-table";

export * from "@/models/identity/user";

export const userColumns: ColumnDef<UserInterface>[] = [
  {
    header: "Nome",
    accessorKey: "name",
  },
  {
    header: "Email",
    accessorKey: "email",
  },
  {
    header: "Cargo",
    accessorKey: "role",
  },
  {
    header: "Telefone",
    accessorKey: "phone",
  },
];

export const userFields: FieldInterface[] = [
  {
    name: "name",
    type: "text",
    label: "Nome Completo",
    placeholder: "João Silva",
    required: true,
  },
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "joao@imobiliaria.com",
    required: true,
  },
  {
    name: "password",
    type: "password",
    label: "Senha",
    placeholder: "••••••",
    description: "Deixe em branco para manter a senha atual",
  },
  {
    name: "role",
    type: "select",
    label: "Cargo",
    required: true,
    options: [
      { label: "Administrador", value: "admin" },
      { label: "Gestor", value: "manager" },
      { label: "Corretor", value: "broker" },
      { label: "SDR (Pré-vendas)", value: "sdr" },
    ],
  },
  {
    name: "enterprise",
    type: "model-select",
    label: "Empresa",
    model: "identity/enterprise",
    required: true,
  },
  {
    name: "phone",
    type: "text",
    label: "Telefone",
    placeholder: "(11) 99999-9999",
  },
  {
    name: "avatar",
    type: "avatar",
    label: "Foto de Perfil",
  },
];
```

#### 4. Constants (`constants.ts`)

Define enums, options, and static data:

```typescript
// @/models/identity/user/constants.ts
export const ROLES = {
  admin: "Administrador",
  manager: "Gestor",
  broker: "Corretor",
  sdr: "SDR (Pré-vendas)",
  "*": "Indefinido"
}

export const COUNTRIES = [
  { value: "BR", label: "Brasil" },
  { value: "US", label: "Estados Unidos" },
  { value: "ES", label: "Espanha" },
  // ... more countries
].sort((a, b) => a.label.localeCompare(b.label));

export const LANGUAGES = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en-US", label: "Inglês (EUA)" },
  { value: "es-ES", label: "Espanhol (Espanha)" },
  { value: "fr-FR", label: "Francês (França)" },
];
```

---

### Using the Model Structure

#### In API Routes

```typescript
// app/api/identity/users/[[...id]]/route.ts
import { User, UserInterface, userCreateSchema, userUpdateSchema } from "@/models/identity/user/model";
import { CRUDController } from "@/struct";

export const { GET, POST, PATCH, DELETE } = new CRUDController<UserInterface>(User, {
  softDelete: true,
  createSchema: userCreateSchema,
  updateSchema: userUpdateSchema,
  populate: ["enterprise"],
  roles: {
    GET: "admin",
    POST: "admin",
    PATCH: "admin",
    DELETE: "admin"
  }
});
```

#### In Client Components

```typescript
// app/(dashboard)/identity/users/page.tsx
import { TableView } from "@discovery-solutions/struct/client";
import { userColumns } from "@/models/identity/user/schema";

export default function UsersPage() {
  return (
    <TableView
      endpoint="identity/users"
      columns={userColumns}
      asChild={true}
    />
  );
}
```

#### In Forms

```typescript
// app/(dashboard)/identity/users/register/page.tsx
import { ModelForm } from "@discovery-solutions/struct/client";
import { userFields, userCreateSchema } from "@/models/identity/user/schema";

export default function UserRegisterPage() {
  return (
    <ModelForm
      endpoint="identity/users"
      schema={userCreateSchema}
      fields={userFields}
      mode="register"
    />
  );
}
```

## 📖 Core Concepts

### CRUDController

#### Basic Usage

**1. Define your Mongoose model:**

```typescript
// @/models/identity/user/index.ts
import { z } from "zod";

export interface UserInterface {
  _id?: string;
  name: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export const userCreateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
});

export const userUpdateSchema = userCreateSchema.partial();
```

```typescript
// @/models/identity/user/model.ts
import { Schema } from "mongoose";
import { UserInterface } from "@/models/identity/user";
import mongoose from "mongoose";

export * from "@/models/identity/user";

const UserSchema = new Schema<UserInterface>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  deletedAt: { type: Date },
}, { timestamps: true });

export const User = mongoose?.models?.User || mongoose.model<UserInterface>("User", UserSchema);
```

**2. Create a Next.js API Route:**

```typescript
// app/api/identity/users/[[...id]]/route.ts
import { User, UserInterface, userCreateSchema, userUpdateSchema } from "@/models/identity/user/model";
import { CRUDController } from "@/struct";

export const { GET, POST, PATCH, DELETE } = new CRUDController<UserInterface>(User, {
  softDelete: true,
  createSchema: userCreateSchema,
  updateSchema: userUpdateSchema,
  roles: {
    GET: "admin",
    POST: "admin",
    PATCH: "admin",
    DELETE: "superadmin"
  }
});
```

---

#### Example With Hooks

```typescript
// app/api/identity/users/[[...id]]/route.ts
import { User, UserInterface, userCreateSchema, userUpdateSchema } from "@/models/identity/user/model";
import { CRUDController } from "@/struct";

export const { GET, POST, PATCH, DELETE } = new CRUDController<UserInterface>(User, {
  softDelete: true,
  createSchema: userCreateSchema,
  updateSchema: userUpdateSchema,
  hooks: {
    beforeCreate: async ({ user, data }) => {
      if (user.role !== "admin") throw new Error("Unauthorized");
      return { createdBy: user.id };
    },
    afterGet: async ({ result }) => {
      if (Array.isArray(result)) return result.map(r => ({ ...r, secret: undefined }));
      return result ? { ...result, secret: undefined } : null;
    },
  }
});
```

---

### ModelService

#### Usage

```typescript
import { User, UserInterface } from "@/models/identity/user/model";
import { ModelService } from "@/struct";

const userService = new ModelService<UserInterface>(User);

// Fetch user
const user = await userService.findOne({ email: "john@example.com" });
```

---

## 🎨 Client Components

### TableView

#### Usage Example

```typescript
// app/(dashboard)/identity/users/page.tsx
import { TableView } from "@discovery-solutions/struct/client";
import { userColumns } from "@/models/identity/user/schema";

export default function UsersPage() {
  return (
    <TableView
      endpoint="identity/users"
      columns={userColumns}
      asChild={true}
      LeftItems={(data) => <span>Total: {data.length}</span>}
    />
  );
}
```

**Columns definition:**

```typescript
// @/models/identity/user/schema.ts
import { UserInterface } from "@/models/identity/user";
import { ColumnDef } from "@tanstack/react-table";

export const userColumns: ColumnDef<UserInterface>[] = [
  { header: "Nome", accessorKey: "name" },
  { header: "Email", accessorKey: "email" },
  {
    header: "Status",
    cell: ({ row }) => <span>{row.original.active ? "Ativo" : "Inativo"}</span>
  },
];
```

---

### ListView

#### Usage Example

```typescript
// app/(dashboard)/products/page.tsx
import { ListView } from "@discovery-solutions/struct/client";

interface Product {
  _id: string;
  name: string;
  price: number;
}

export default function ProductsPage() {
  return (
    <ListView<Product>
      endpoint="products"
      enablePagination={true}
      pageSize={20}
      renderItem={(product) => (
        <div className="card">
          <h3>{product.name}</h3>
          <p>{product.price}</p>
        </div>
      )}
      keyExtractor={(p) => p._id}
    />
  );
}
```

---

### ModelForm

#### Usage Example

```typescript
// app/(dashboard)/identity/users/register/page.tsx
import { ModelForm } from "@discovery-solutions/struct/client";
import { userFields, userCreateSchema } from "@/models/identity/user/schema";

export default function UserRegisterPage() {
  return (
    <ModelForm
      endpoint="identity/users"
      schema={userCreateSchema}
      fields={userFields}
      mode="register"
      onAfterSubmit={(res) => console.log("Created user:", res)}
    />
  );
}
```

**Fields definition:**

```typescript
// @/models/identity/user/schema.ts
import { FieldInterface } from "@discovery-solutions/struct/client";

export const userFields: FieldInterface[] = [
  { name: "name", type: "text", label: "Nome", required: true },
  { name: "email", type: "email", label: "Email", required: true },
  { name: "avatar", type: "avatar", label: "Foto do perfil" },
];
```

---

### ModalForm

#### Usage

**Basic Create Modal:**

```typescript
// app/(dashboard)/profiling/questions/page.tsx
import { ModalFormProvider, ModalForm } from "@discovery-solutions/struct/client";
import { questionFields, questionCreateSchema } from "@/models/profiling/question/schema";

export default function QuestionsPage() {
  return (
    <ModalFormProvider>
      <ModalForm
        modalId="question-form"
        title="Add Question"
        endpoint="profiling/question"
        schema={questionCreateSchema}
        fields={questionFields}
        buttonLabel="Save Question"
        cols={2}
      />
    </ModalFormProvider>
  );
}
```

**Edit Mode via Hook:**

```typescript
// app/(dashboard)/profiling/questions/page.tsx
import { ModalFormProvider, ModalForm, useModalForm } from "@discovery-solutions/struct/client";
import { questionFields, questionCreateSchema } from "@/models/profiling/question/schema";

function QuestionsList() {
  const { openModal } = useModalForm();

  return (
    <>
      <button onClick={() => openModal({ id: "123", modalId: "question-form" })}>
        Edit Question
      </button>

      <ModalForm
        modalId="question-form"
        title="Edit Question"
        endpoint="profiling/question"
        schema={questionCreateSchema}
        fields={questionFields}
        buttonLabel="Update"
      />
    </>
  );
}

export default function QuestionsPage() {
  return (
    <ModalFormProvider>
      <QuestionsList />
    </ModalFormProvider>
  );
}
```

---

### ConfirmDialog

#### Usage Examples

**Inline Trigger:**

```typescript
// app/(dashboard)/identity/users/page.tsx
import { ConfirmDialog } from "@discovery-solutions/struct/client";

export default function UsersPage() {
  return (
    <ConfirmDialog
      endpoint="identity/users"
      params={{ id: "123" }}
    >
      <button className="btn-destructive">Delete User</button>
    </ConfirmDialog>
  );
}
```

**Hook-Controlled:**

```typescript
// app/(dashboard)/identity/users/page.tsx
import { ConfirmDialog, useConfirmDialog } from "@discovery-solutions/struct/client";

export default function UsersPage() {
  const { open, setOpen, trigger } = useConfirmDialog();

  return (
    <>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        endpoint="identity/users"
        params={{ id: "123" }}
      />

      <button onClick={trigger}>Delete User</button>
    </>
  );
}
```

## 🔧 Utilities

### withSession

A higher-order function that wraps API route handlers with authentication and database connection logic.

```typescript
import { withSession } from "@/struct";

export const GET = withSession(async ({ user }, req, context) => {
  // Your logic here
  return Response.json({ user });
}, { roles: "admin", database: "mydb" });
```

**Options:**
- `roles?: string | string[]` → required role(s) to access the endpoint
- `database?: string` → optional database name for multi-tenant setups

### parseEntityToObject

Converts Mongoose documents to plain JavaScript objects:

```typescript
import { parseEntityToObject } from "@/struct";

const plainUser = parseEntityToObject(mongooseUser);
```

### fetcher

A utility function for making HTTP requests with automatic error handling:

```typescript
import { fetcher } from "@discovery-solutions/struct/client";

const data = await fetcher("/api/users", {
  method: "POST",
  body: { name: "John" },
  params: { filter: "active" }
});
```

---

## 📚 Type Definitions

### StructUser

```typescript
export type StructUser = {
  id: string;
  email?: string;
  role?: string;
  [key: string]: any;
};
```

### FieldInterface

```typescript
export interface FieldInterface {
  name: string;
  type: string;
  label?: string;
  required?: boolean;
  conditional?: {
    field: string;
    value: string | string[];
  };
  options?: string[] | { value: string | boolean | number; label: string }[];
  colSpan?: number;
  defaultValue?: any;
  className?: string;
  [key: string]: any;
}
```

### CRUDOptions

```typescript
export interface CRUDOptions<T, U extends StructUser = StructUser> {
  populate?: (keyof T)[] | any;
  createSchema?: z.infer<any>;
  updateSchema?: z.infer<any>;
  hooks?: Hooks<T, U>;
  softDelete?: boolean;
  customParser?: (req: NextRequest) => Promise<Partial<T>>;
  roles?: Partial<Record<"GET" | "POST" | "PATCH" | "DELETE", string | string[]>>;
  sort?: Record<string, 1 | -1> | string[];
}
```

### StructConfig

```typescript
export type StructConfig = {
  database?: {
    startConnection: (dbName?: string) => Promise<any>;
    closeConnection?: (dbName?: string) => Promise<any>;
  }
  auth?: {
    getSession?: (req?: NextRequest, context?: { params: Promise<any> }) => Promise<any>
    getUser?: () => Promise<any>
  }
}
```

---

## 🎯 Best Practices

1. **Always use the configured Struct instance** from your `struct.ts` file
2. **Define Zod schemas** for all forms to ensure type safety and validation
3. **Use hooks** to inject custom business logic without modifying core functionality
4. **Leverage soft delete** for data preservation and audit trails
5. **Implement role-based access** to secure your endpoints
6. **Use TypeScript** to get full type inference and autocomplete
7. **Keep your UI components** in the StructUIProvider for consistency
8. **Use React Query** for efficient data fetching and caching
9. **Implement closeConnection** in your database config for proper cleanup
10. **Use advanced filtering** with comma/pipe syntax and nested fields for complex queries

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests if applicable
5. Submit a pull request

---

## 📄 License

This project is proprietary software owned by Discovery Solutions.

---

## 🆘 Support

For issues, questions, or feature requests, please contact the Discovery Solutions team or open an issue in the repository.

---

## 🔗 Related Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Mongoose](https://mongoosejs.com/)
- [TailwindCSS](https://tailwindcss.com/)

---

Made with ❤️ by Discovery Solutions
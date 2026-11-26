import { isAdmin } from "@/lib/auth";
import { listAllNominations, listCodeHolders } from "@/lib/store";
import { AdminLogin, AdminTable } from "./AdminView";

// Nominations are only loaded (and only sent to the browser) once the admin cookie is valid.
export default async function AdminPage() {
  if (!(await isAdmin())) return <AdminLogin />;
  const [nominations, codeHolders] = await Promise.all([listAllNominations(), listCodeHolders()]);
  return <AdminTable nominations={nominations} codeHolders={codeHolders} />;
}

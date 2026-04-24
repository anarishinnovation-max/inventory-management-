/**
 * RBAC SYSTEM USAGE EXAMPLES
 */

// ------------------------------------------------------------------
// 1. PROTECTING AN API ROUTE (SERVER ACTION OR ROUTE HANDLER)
// ------------------------------------------------------------------
/*
import { requirePermission } from "@/lib/rbac-utils";
import { prisma } from "@/lib/prisma";

export async function deleteItem(itemId: string) {
  // Enforce permission on server side
  await requirePermission("items:delete");

  return await prisma.item.delete({
    where: { id: itemId }
  });
}
*/

// ------------------------------------------------------------------
// 2. CONDITIONAL UI RENDERING (PERMISSION GUARD)
// ------------------------------------------------------------------
/*
import { PermissionGuard } from "@/components/auth/PermissionGuard";

export function ItemTable({ items }) {
  return (
    <table>
      {items.map(item => (
        <tr key={item.id}>
          <td>{item.name}</td>
          <td>
            <PermissionGuard permission="items:delete">
              <button onClick={() => handleDelete(item.id)}>Delete</button>
            </PermissionGuard>
          </td>
        </tr>
      ))}
    </table>
  );
}
*/

// ------------------------------------------------------------------
// 3. MULTI-TENANT ISOLATION (QUERYING DATA)
// ------------------------------------------------------------------
/*
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getMyItems() {
  const session = await getSession();
  
  if (!session) throw new Error("Unauthorized");

  // Always filter by companyId
  return await prisma.item.findMany({
    where: {
      companyId: session.companyId
    }
  });
}
*/

// ------------------------------------------------------------------
// 4. UTILITY HELPERS
// ------------------------------------------------------------------
/*
import { isOwner, isManager } from "@/lib/rbac-utils";

async function someSensitiveAction() {
  if (await isOwner()) {
    // Perform owner-only logic
  }
}
*/

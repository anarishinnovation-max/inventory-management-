import prisma from "./prisma";

export type ActionType = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "ADJUSTMENT" | "ORDER_STATUS_CHANGE";
export type EntityType = "ITEM" | "VENDOR" | "CUSTOMER" | "PURCHASE_ORDER" | "DISPATCH_ORDER" | "USER" | "RACK" | "INVENTORY";

interface LogParams {
  actionType: ActionType;
  entityType: EntityType;
  entityId?: string;
  performedBy: string;
  performedByName: string;
  oldValue?: any;
  newValue?: any;
  companyId: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Compares two objects and returns an array of keys that have changed.
 */
function getChangedFields(oldVal: any, newVal: any): string[] {
  if (!oldVal || !newVal) return [];
  
  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
  
  for (const key of allKeys) {
    // Skip internal fields
    if (["createdAt", "updatedAt", "id", "companyId"].includes(key)) continue;
    
    const v1 = oldVal[key];
    const v2 = newVal[key];
    
    // Deep comparison for basic types or simple nested objects
    if (JSON.stringify(v1) !== JSON.stringify(v2)) {
      changed.push(key);
    }
  }
  
  return changed;
}

export async function createActivityLog(params: LogParams) {
  const {
    actionType,
    entityType,
    entityId,
    performedBy,
    performedByName,
    oldValue = {},
    newValue = {},
    companyId,
    ipAddress,
    userAgent
  } = params;

  // Calculate changed fields for UPDATE actions
  const changedFields = actionType === "UPDATE" 
    ? getChangedFields(oldValue, newValue) 
    : [];

  try {
    return await (prisma as any).activityLog.create({
      data: {
        actionType,
        entityType,
        entityId,
        performedBy,
        performedByName,
        oldValue: oldValue || {},
        newValue: newValue || {},
        changedFields: changedFields || [],
        ipAddress,
        userAgent,
        companyId
      }
    });
  } catch (error) {
    console.error("Failed to create activity log:", error);
  }
}

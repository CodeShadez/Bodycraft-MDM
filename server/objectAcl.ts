// Reference: blueprint:javascript_object_storage
import { File } from "@google-cloud/storage";

const ACL_POLICY_METADATA_KEY = "custom:aclPolicy";

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

// ACL policy for objects (invoices in our case)
export interface ObjectAclPolicy {
  owner: string; // User ID who uploaded
  visibility: "public" | "private";
  locationId?: number; // For location-based access control
}

// Sets the ACL policy to the object metadata
export async function setObjectAclPolicy(
  objectFile: File,
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }

  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy),
    },
  });
}

// Gets the ACL policy from the object metadata
export async function getObjectAclPolicy(
  objectFile: File,
): Promise<ObjectAclPolicy | null> {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy as string);
}

// Checks if the user can access the object based on role and location
export async function canAccessObject({
  userId,
  userRole,
  userLocationId,
  objectFile,
  requestedPermission,
}: {
  userId?: string;
  userRole?: string;
  userLocationId?: number | null;
  objectFile: File;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }

  // Public objects are always accessible for read (we don't use this for invoices)
  if (
    aclPolicy.visibility === "public" &&
    requestedPermission === ObjectPermission.READ
  ) {
    return true;
  }

  // Access control requires the user id
  if (!userId) {
    return false;
  }

  // The owner can always access their own uploads
  if (aclPolicy.owner === userId) {
    return true;
  }

  // Super admin and admin can access all invoices
  if (userRole === "super_admin" || userRole === "admin") {
    return true;
  }

  // Location users can only access invoices from their location
  if (userRole === "location_user" && aclPolicy.locationId === userLocationId) {
    return true;
  }

  return false;
}

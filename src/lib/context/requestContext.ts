import { AsyncLocalStorage } from "async_hooks";

interface RequestContext {
  requestId: string;
}

// AsyncLocalStorage provides transparent requestId propagation through
// the entire async call chain of a single API request without passing it
// as a parameter through every function.
export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}

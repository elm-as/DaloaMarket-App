/**
 * Réponse des RPC métier : `{ success, reason, message, ... }`.
 *
 * Le client typé déclare le retour des fonctions `json` comme `Json` (union
 * large) ; ce helper le ramène à un objet exploitable, ou `null` si la RPC n'a
 * rien renvoyé d'objet.
 */
export interface RpcOutcome {
  success?: boolean;
  reason?: string;
  message?: string;
}

export function rpcOutcome<T extends object = Record<string, never>>(data: unknown): (RpcOutcome & T) | null {
  return data !== null && typeof data === 'object' && !Array.isArray(data)
    ? (data as RpcOutcome & T)
    : null;
}

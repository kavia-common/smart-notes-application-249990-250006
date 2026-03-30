/**
 * Shared frontend types for the Notes app.
 * Backend schema is not yet fully available in the current OpenAPI spec,
 * so we keep types flexible and map from unknown payloads defensively.
 */

export type ID = string;

export interface Tag {
  id: ID;
  name: string;
}

export interface Note {
  id: ID;
  title: string;
  content: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

/** Draft used by the editor before persistence. */
export interface NoteDraft {
  title: string;
  content: string;
  tags: string[];
}

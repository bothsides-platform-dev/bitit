/**
 * Storage constants — kept node-free so client components (e.g. the
 * RFP dropzone) can import without pulling `node:crypto`/`node:fs`
 * into the browser bundle.
 */

/**
 * Sentinel `ownerId` for `rfq_rfp` attachments uploaded before the RFQ
 * row exists. The dropzone uploads on file-select; the RFQ id is only
 * minted at form submit. `createRfqAction` patches matching rows to
 * the real `Q-YYMM-NNNN` id, scoped by `uploadedBy` + `ownerKind`.
 *
 * Drift between the dropzone, upload route, and action would silently
 * break the link-up query — every site uses this constant.
 */
export const DRAFT_OWNER_ID = '__draft__';

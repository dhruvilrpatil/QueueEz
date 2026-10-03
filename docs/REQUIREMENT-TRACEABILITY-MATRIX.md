# REQUIREMENT TRACEABILITY MATRIX (RTM)
## MODULE: CUSTOMER QUERY & STAFF MESSAGING (MOD-MSG)

**Standard:** ISO/IEC/IEEE 29148:2018 Systems and software engineering — Life cycle processes — Requirements engineering  

---

| Req ID | Requirement Summary | Design References | Backend Implementation | Frontend Implementation | Test Case | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **FR-MSG-001** | Create customer query | SRS 4.4, DFD 1.0, UC-MSG-01 | `controller.createConversation`<br>`service.createConversation`<br>`schema.createConversationSchema` | `NewQueryModal.tsx`<br>`useSendMessage.ts` | TC-MSG-001<br>TC-MSG-002<br>TC-MSG-003 | **PASS** |
| **FR-MSG-002** | Select query category | SRS 4.4, DT Rule R01-R14 | `schema.categoryEnum`<br>`types.ConversationCategory` | `NewQueryModal.tsx`<br>`constants.ts` | TC-MSG-004 | **PASS** |
| **FR-MSG-003** | Link appointment context | SRS 4.8, UC-MSG-10, DT C1 | `repository.createConversation`<br>`repository.getConversationById` | `ConversationContext.tsx`<br>`NewQueryModal.tsx` | TC-MSG-005<br>TC-MSG-026 | **PASS** |
| **FR-MSG-004** | Link queue ticket context | SRS 4.8, UC-MSG-10, DT C2 | `repository.createConversation`<br>`repository.getConversationById` | `ConversationContext.tsx`<br>`NewQueryModal.tsx` | TC-MSG-006 | **PASS** |
| **FR-MSG-005** | Chronological message history | SRS 4.4, DFD 2.0 | `repository.getMessages`<br>`service.getMessages` | `MessageList.tsx`<br>`MessageItem.tsx` | TC-MSG-007 | **PASS** |
| **FR-MSG-006** | Staff facility query inbox | SRS 4.8, UC-MSG-04, DFD 1.0 | `controller.getConversations`<br>`policies.canAccessConversation` | `ConversationList.tsx`<br>`ChatPage.tsx` | TC-MSG-008<br>TC-MSG-009 | **PASS** |
| **FR-MSG-007** | Staff reply capability | SRS 4.4, UC-MSG-03, FSM | `controller.sendMessage`<br>`service.sendStaffReply` | `MessageComposer.tsx`<br>`ChatPage.tsx` | TC-MSG-010<br>TC-MSG-014 | **PASS** |
| **FR-MSG-008** | Unread message tracking & badges | SRS 4.4, DFD 3.0 | `repository.getUnreadCount`<br>`repository.markAsRead` | `AppSidebar.tsx`<br>`UnreadBadge.tsx` | TC-MSG-011<br>TC-MSG-012 | **PASS** |
| **FR-MSG-009** | Realtime message updates | SRS 4.11, UC-MSG-12 | Supabase Realtime Channels<br>`service.broadcastMessage` | `useMessagingRealtime.ts`<br>`ChatPage.tsx` | TC-MSG-013<br>TC-MSG-028 | **PASS** |
| **FR-MSG-010** | Manage conversation status | SRS 4.4, FSM State Matrix | `controller.updateStatus`<br>`service.transitionStatus` | `ConversationHeader.tsx`<br>`ChatPage.tsx` | TC-MSG-014<br>TC-MSG-015 | **PASS** |
| **FR-MSG-011** | Assign conversation to staff | SRS 4.4, UC-MSG-06, DT A3 | `controller.assignStaff`<br>`policies.canAssign` | `ConversationHeader.tsx`<br>`ChatPage.tsx` | TC-MSG-016<br>TC-MSG-017 | **PASS** |
| **FR-MSG-012** | Prevent unauthorized access | SRS 4.10, NFR-MSG-002 | `policies.ts`<br>PostgreSQL RLS policies | Protected Routes<br>`AuthProvider.tsx` | TC-MSG-009<br>TC-MSG-018 | **PASS** |
| **FR-MSG-013** | Customer historical queries view | SRS 4.8, UC-MSG-04 | `controller.getConversations` (role: customer) | `MessagesPage.tsx`<br>`ConversationList.tsx` | TC-MSG-019 | **PASS** |
| **FR-MSG-014** | Resolve & reopen conversations | SRS 4.8, UC-MSG-08, FSM | `service.resolveConversation`<br>`service.reopenConversation` | `ConversationHeader.tsx`<br>`MessageComposer.tsx` | TC-MSG-020<br>TC-MSG-021 | **PASS** |
| **NFR-MSG-001** | Reliable data persistence | SRS 4.5, System Design 1.0 | PostgreSQL Transactions<br>`repository.ts` | React Query optimistic cache | TC-MSG-001<br>TC-MSG-007 | **PASS** |
| **NFR-MSG-002** | Security & tenant isolation | SRS 4.10, System Design 3.0 | `middleware/auth.ts`<br>`002_messaging_schema.sql` (RLS) | Client Token Provider | TC-MSG-009<br>TC-MSG-018 | **PASS** |
| **NFR-MSG-003** | Internal notes confidentiality | SRS 4.10, UC-MSG-11 | `policies.canReadInternalNotes`<br>`WHERE message_type != 'INTERNAL_NOTE'` | `MessageItem.tsx` (Staff note styling) | TC-MSG-022<br>TC-MSG-023 | **PASS** |
| **NFR-MSG-004** | Low-latency realtime sync | SRS 4.11, System Design 1.0 | Supabase CDC WebSocket streaming | `useMessagingRealtime.ts` | TC-MSG-013 | **PASS** |
| **NFR-MSG-005** | Responsive interface | SRS 4.5, DESIGN.md | - | Tailwind CSS fluid dual-pane | Headless Viewport Test | **PASS** |
| **NFR-MSG-006** | Composer retry on network failure | SRS 4.5, FSM 3.0 | - | `MessageComposer.tsx`<br>`MessageStatus.tsx` | TC-MSG-025 | **PASS** |
| **NFR-MSG-007** | Strict server-side validation | SRS 4.10, NFR-MSG-007 | `schema.ts` (Zod schemas)<br>Plain text rendering | DOM text escape | TC-MSG-002<br>TC-MSG-024 | **PASS** |
| **NFR-MSG-008** | Bounded context modularity | SRS 4.7, System Design 2.0 | `apps/api/src/modules/messaging/` | `apps/web/src/features/messaging/` | Architecture Inspection | **PASS** |

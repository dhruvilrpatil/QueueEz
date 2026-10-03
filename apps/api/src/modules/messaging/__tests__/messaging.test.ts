import {
  createConversationSchema,
  sendMessageSchema,
  updateStatusSchema,
  updatePrioritySchema,
} from '../schema';
import { MessagingPolicies } from '../policies';
import { MessagingRepository } from '../repository';
import { MessagingService } from '../service';
import { ConversationStatus, MessageType } from '../types';

async function runTests() {
  console.log('====================================================');
  console.log('EZQUEUE MESSAGING SUBSYSTEM - SDM VERIFICATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // ── TEST SUITE 1: Zod Schema Validation ───────────────────────
  console.log('--- SUITE 1: Schema & Payload Validation ---');

  // TC-MSG-001: Valid query creation payload
  try {
    const valid = createConversationSchema.parse({
      facility_id: '00000000-0000-0000-0000-000000000010',
      subject: 'Appointment timing inquiry',
      category: 'appointment',
      message: 'Can I arrive early?',
    });
    assert(valid.subject === 'Appointment timing inquiry', 'TC-MSG-001: Valid conversation schema parses successfully');
  } catch (e) {
    assert(false, 'TC-MSG-001: Valid conversation schema parses successfully');
  }

  // TC-MSG-002: Reject empty message
  try {
    createConversationSchema.parse({
      facility_id: '00000000-0000-0000-0000-000000000010',
      subject: 'Appointment query',
      category: 'appointment',
      message: '   ',
    });
    assert(false, 'TC-MSG-002: Rejects empty query message');
  } catch {
    assert(true, 'TC-MSG-002: Rejects empty query message');
  }

  // TC-MSG-003: Reject oversized message (>10,000 characters)
  try {
    const longMsg = 'a'.repeat(10001);
    sendMessageSchema.parse({ content: longMsg });
    assert(false, 'TC-MSG-003: Rejects oversized message (>10,000 chars)');
  } catch {
    assert(true, 'TC-MSG-003: Rejects oversized message (>10,000 chars)');
  }

  // TC-MSG-004: Reject invalid status in update status schema
  try {
    updateStatusSchema.parse({ status: 'invalid_status' });
    assert(false, 'TC-MSG-004: Rejects invalid conversation status');
  } catch {
    assert(true, 'TC-MSG-004: Rejects invalid conversation status');
  }

  // ── TEST SUITE 2: Authorization & Security Policies ───────────
  console.log('\n--- SUITE 2: RBAC & Access Control Policies ---');

  const customerUser = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'customer@demo.com',
    role: 'customer',
  };

  const otherCustomerUser = {
    id: '00000000-0000-0000-0000-000000000099',
    email: 'other@demo.com',
    role: 'customer',
  };

  const staffUser = {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'staff@demo.com',
    role: 'staff',
    facilityId: '00000000-0000-0000-0000-000000000010',
  };

  const mockConv: any = {
    id: 'c-1',
    customer_id: customerUser.id,
    facility_id: staffUser.facilityId,
    status: 'open' as ConversationStatus,
    priority: 'normal',
  };

  // TC-MSG-005: Customer can view their own conversation
  try {
    MessagingPolicies.assertCanViewConversation(customerUser, mockConv);
    assert(true, 'TC-MSG-005: Customer authorized to view own conversation');
  } catch {
    assert(false, 'TC-MSG-005: Customer authorized to view own conversation');
  }

  // TC-MSG-006: Customer cannot view other customer's conversation
  try {
    MessagingPolicies.assertCanViewConversation(otherCustomerUser, mockConv);
    assert(false, 'TC-MSG-006: Other customer blocked from viewing conversation');
  } catch {
    assert(true, 'TC-MSG-006: Other customer blocked from viewing conversation');
  }

  // TC-MSG-007: Customer cannot create confidential internal notes
  try {
    MessagingPolicies.assertCanSendMessage(customerUser, mockConv, 'internal_note');
    assert(false, 'TC-MSG-007: Customer blocked from posting internal note');
  } catch {
    assert(true, 'TC-MSG-007: Customer blocked from posting internal note');
  }

  // TC-MSG-008: Staff authorized to post internal note
  try {
    MessagingPolicies.assertCanSendMessage(staffUser, mockConv, 'internal_note');
    assert(true, 'TC-MSG-008: Staff authorized to post confidential internal note');
  } catch {
    assert(false, 'TC-MSG-008: Staff authorized to post confidential internal note');
  }

  // TC-MSG-009: Customer cannot see internal notes
  const canCustomerSeeNote = MessagingPolicies.canViewMessageType('customer', 'internal_note');
  const canStaffSeeNote = MessagingPolicies.canViewMessageType('staff', 'internal_note');
  assert(!canCustomerSeeNote && canStaffSeeNote, 'TC-MSG-009: Internal note visibility strictly enforced by role');

  // ── TEST SUITE 3: State Machine Transitions ───────────────────
  console.log('\n--- SUITE 3: State Machine Transitions ---');

  // TC-MSG-010: Valid transition open -> in_progress
  try {
    MessagingPolicies.assertCanTransitionStatus(staffUser, 'open', 'in_progress');
    assert(true, 'TC-MSG-010: Transition open -> in_progress allowed');
  } catch {
    assert(false, 'TC-MSG-010: Transition open -> in_progress allowed');
  }

  // TC-MSG-011: Valid transition in_progress -> resolved
  try {
    MessagingPolicies.assertCanTransitionStatus(staffUser, 'in_progress', 'resolved');
    assert(true, 'TC-MSG-011: Transition in_progress -> resolved allowed');
  } catch {
    assert(false, 'TC-MSG-011: Transition in_progress -> resolved allowed');
  }

  // TC-MSG-012: Reject invalid transition closed -> in_progress (must reopen first)
  try {
    MessagingPolicies.assertCanTransitionStatus(staffUser, 'closed', 'in_progress');
    assert(false, 'TC-MSG-012: Rejected invalid transition closed -> in_progress');
  } catch {
    assert(true, 'TC-MSG-012: Rejected invalid transition closed -> in_progress');
  }

  // ── TEST SUITE 4: Service & Repository Operations ──────────────
  console.log('\n--- SUITE 4: Service & Business Workflow Execution ---');

  const repo = new MessagingRepository();
  const service = new MessagingService(repo);

  // TC-MSG-013: List conversations for customer
  const customerList = await service.listConversations(customerUser, {});
  assert(customerList.items.length > 0, 'TC-MSG-013: Customer lists own conversations successfully');

  // TC-MSG-014: List conversations for staff (scoped to facility)
  const staffList = await service.listConversations(staffUser, {});
  assert(staffList.items.length > 0, 'TC-MSG-014: Staff lists facility conversations successfully');

  // TC-MSG-015: Customer creates query with appointment and queue context
  const created = await service.createCustomerQuery(customerUser, {
    facility_id: '00000000-0000-0000-0000-000000000010',
    subject: 'Appointment timing verification',
    category: 'appointment',
    message: 'Can I check in 15 minutes before 3:00 PM?',
    appointment_id: 'a0000000-0000-0000-0000-000000000001',
    queue_ticket_id: 'q0000000-0000-0000-0000-000000000001',
  });
  assert(created.conversation.id !== undefined, 'TC-MSG-015: Query created with appointment and queue context');

  // TC-MSG-016: Staff sends reply
  const reply = await service.sendMessage(staffUser, created.conversation.id, {
    content: 'Yes, please check in at counter 2.',
    message_type: 'staff_reply',
  });
  assert(reply.id !== undefined && reply.status === 'sent', 'TC-MSG-016: Staff sends reply successfully');

  // TC-MSG-017: Mark conversation as read
  await service.markRead(staffUser, created.conversation.id);
  assert(true, 'TC-MSG-017: Mark conversation as read succeeds');

  // TC-MSG-018: Staff updates status to resolved
  const resolved = await service.updateStatus(staffUser, created.conversation.id, 'resolved');
  assert(resolved.status === 'resolved', 'TC-MSG-018: Status updated to resolved');

  // TC-MSG-019: Staff updates status to reopened
  const reopened = await service.updateStatus(staffUser, created.conversation.id, 'reopened');
  assert(reopened.status === 'reopened', 'TC-MSG-019: Status updated to reopened');

  // TC-MSG-020: Staff assigns conversation to self
  const assigned = await service.assignStaff(staffUser, created.conversation.id, staffUser.id);
  assert(assigned.assigned_staff_id === staffUser.id, 'TC-MSG-020: Conversation assigned to staff member');

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});

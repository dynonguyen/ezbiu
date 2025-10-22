import type { ImportedBackup } from '../features/group-detail/helpers/group-backup';
import type { Bill, BillId, CategoryId, Group, GroupId, Member, MemberId } from '../types/entities';

export interface IApiClient {
	// Group
	fetchGroups(ids: GroupId[]): Promise<{ groups: Group[]; notFoundIds: GroupId[] }>;
	createGroup(
		group: Pick<Group, 'name' | 'id' | 'paymentTrackingMode'> & Partial<Group>,
	): Promise<void>;
	fetchGroup(id: GroupId): Promise<Group>;
	updateGroup(data: { id: GroupId; updated: Partial<Group> }): Promise<void>;
	deleteGroup(id: GroupId): Promise<void>;

	// Member
	addMember(data: { groupId: GroupId; member: Member }): Promise<void>;
	removeMember(data: { groupId: GroupId; memberId: MemberId }): Promise<void>;
	updateMember(data: { groupId: GroupId; newValue: Member }): Promise<void>;

	// Bill
	fetchBills(groupId: GroupId): Promise<Bill[]>;
	createBill(bill: Omit<Bill, 'id' | 'createdAt'>): Promise<void>;
	updateBill(updated: Omit<Bill, 'createdAt'>): Promise<void>;
	deleteBill(data: { groupId: GroupId; billId: BillId }): Promise<void>;
	markBillsAsPaid(data: { groupId: GroupId; memberId: MemberId; billIds: BillId[] }): Promise<void>;

	// Category
	deleteCategory(data: { groupId: GroupId; categoryId: CategoryId }): Promise<void>;

	// Import
	importGroup(data: {
		imported: ImportedBackup;
		newGroupInfo: Pick<Group, 'name' | 'id' | 'paymentTrackingMode'>;
	}): Promise<void>;

	// Error log
	createErrorLog(error: any): Promise<void>;
}

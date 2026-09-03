import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import {
	ManagementField,
	ManagementSection,
} from "@/components/features/sajang/management/management-ui";
import { AppColors, AppSpacing } from "@/constants/theme";
import type { Vendor } from "@/database/vendors/vendor.type";
import { useAppToastStore } from "@/store/app-toast-store";
import { useContentManagementStore } from "@/store/content-management-store";
import { defaultVendorStoreId } from "@/lib/vendors/supabase-vendors-repository";

export function VendorEditorForm({ vendorId }: { vendorId?: string }) {
	const vendors = useContentManagementStore(state => state.vendors);
	const upsertVendor = useContentManagementStore(state => state.upsertVendor);
	const showToast = useAppToastStore(state => state.showToast);
	const existingVendor = useMemo(
		() => vendors.find(vendor => vendor.id === vendorId),
		[vendorId, vendors],
	);
	const [name, setName] = useState(existingVendor?.name ?? "");
	const [contactName, setContactName] = useState(existingVendor?.contactName ?? "");
	const [phone, setPhone] = useState(existingVendor?.phone ?? "");
	const [address, setAddress] = useState(existingVendor?.address ?? "");
	const [items, setItems] = useState(existingVendor?.items.join(", ") ?? "");
	const [memo, setMemo] = useState(existingVendor?.memo ?? "");
	const [errorMessage, setErrorMessage] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const saveVendor = async () => {
		const trimmedName = name.trim();

		if (!trimmedName) {
			setErrorMessage("거래처명을 입력해 주세요.");
			return;
		}

		setSubmitting(true);
		const vendor: Vendor = {
			address: address.trim() || undefined,
			contactName: contactName.trim(),
			id: existingVendor?.id ?? `vendor-${Date.now()}`,
			items: items
				.split(/[\n,]/)
				.map(item => item.trim())
				.filter(Boolean),
			memo: memo.trim() || undefined,
			name: trimmedName,
			phone: phone.trim(),
			storeId: existingVendor?.storeId ?? defaultVendorStoreId,
			updatedAt: new Date().toISOString(),
		};

		try {
			await upsertVendor(vendor);
			setErrorMessage("");
			showToast("저장이 완료되었습니다.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<View style={styles.container}>
			<ManagementSection title="거래처 정보">
				<ManagementField label="거래처명" onChangeText={setName} placeholder="거래처명" value={name} />
				<ManagementField label="담당자" onChangeText={setContactName} placeholder="담당자명" value={contactName} />
				<ManagementField
					keyboardType="phone-pad"
					label="연락처"
					onChangeText={setPhone}
					placeholder="연락처"
					value={phone}
				/>
				<ManagementField label="주소" multiline onChangeText={setAddress} placeholder="거래처 주소" value={address} />
				<ManagementField
					label="품목"
					multiline
					onChangeText={setItems}
					placeholder="쉼표로 구분"
					value={items}
				/>
				<ManagementField label="Memo" multiline onChangeText={setMemo} placeholder="추가 메모" value={memo} />
			</ManagementSection>

			{errorMessage ? (
				<View accessibilityLiveRegion="polite" style={styles.error}>
					<AppText.Sm bold color="#B91C1C">
						{errorMessage}
					</AppText.Sm>
				</View>
			) : null}

			<View style={styles.saveArea}>
				<AppPressable
					accessibilityLabel="거래처 저장"
					disabled={submitting}
					onPress={() => void saveVendor()}
					pressedColor="#003E7A"
					radius="base"
					style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
				>
					<AppIcon.Sm color={AppColors.textOnPrimary} name="save-outline" pressable={false} />
					<AppText.Base bold color={AppColors.textOnPrimary}>
						{submitting ? "저장 중" : "저장"}
					</AppText.Base>
				</AppPressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
		paddingBottom: AppSpacing.xl,
	},
	error: {
		marginHorizontal: AppSpacing.md,
		marginTop: AppSpacing.md,
		borderWidth: 1,
		borderColor: "rgba(185, 28, 28, 0.28)",
		backgroundColor: "#FEF2F2",
		padding: AppSpacing.md,
	},
	saveArea: {
		padding: AppSpacing.md,
	},
	saveButton: {
		minHeight: 52,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: AppSpacing.sm,
		backgroundColor: AppColors.primary,
	},
	saveButtonDisabled: {
		opacity: 0.42,
	},
});

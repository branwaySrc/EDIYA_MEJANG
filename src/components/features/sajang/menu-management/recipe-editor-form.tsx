import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppIcon } from "@/components/base/app-icon";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { DynamicTextList } from "@/components/features/sajang/management/dynamic-text-list";
import {
	ManagementActionButton,
	ManagementField,
	ManagementOptionSelector,
	ManagementSection,
} from "@/components/features/sajang/management/management-ui";
import {
	type ManagedVisualDraft,
	VisualEditorList,
} from "@/components/features/sajang/management/visual-editor-list";
import { AppColors, AppSpacing } from "@/constants/theme";
import {
	bakerySubCategories,
	beverageSubCategories,
	eventSubCategories,
} from "@/database/recipe/recipe";
import type {
	RecipeDetail,
	RecipeStep,
	RecipeVisual,
} from "@/database/recipe/recipe-details.type";
import type {
	Recipe,
	RecipeCategory,
	RecipeSubCategory,
} from "@/database/recipe/recipe.type";
import { getChosung } from "@/lib/chosung-search";
import { upsertSupabaseRecipeBundleAsync } from "@/lib/sajang-content/supabase-content-repository";
import { useAppToastStore } from "@/store/app-toast-store";
import { useSajangMenuContentStore } from "@/store/sajang-menu-content-store";

type RecipeStepDraft = {
	details: string[];
	id: string;
	title: string;
	visuals: ManagedVisualDraft[];
};

type RecipeDetailDraft = {
	delivery: ManagedVisualDraft[];
	heroVisuals: ManagedVisualDraft[];
	packaging: ManagedVisualDraft[];
	steps: RecipeStepDraft[];
	storeServing: ManagedVisualDraft[];
};

const categoryOptions: readonly { label: string; value: RecipeCategory }[] = [
	{ label: "음료", value: "음료" },
	{ label: "베이커리", value: "베이커리" },
	{ label: "이벤트", value: "이벤트" },
];

const subCategoriesByCategory: Record<RecipeCategory, RecipeSubCategory[]> = {
	음료: beverageSubCategories,
	베이커리: bakerySubCategories,
	이벤트: eventSubCategories,
};

function visualToDraft(visual: RecipeVisual): ManagedVisualDraft {
	return {
		desc: visual.desc ?? visual.description ?? "",
		id: visual.id,
		imageUri: visual.image ?? visual.imageUri ?? "",
		title: visual.title,
	};
}

function draftToVisual(visual: ManagedVisualDraft): RecipeVisual {
	return {
		id: visual.id,
		image: visual.imageUri || undefined,
		title: visual.title.trim() || "이미지",
		desc: visual.desc.trim() || undefined,
	};
}

function stepToDraft(step: RecipeStep): RecipeStepDraft {
	return {
		details: [...step.details],
		id: step.id,
		title: step.title,
		visuals: step.visuals.map(visualToDraft),
	};
}

function detailToDraft(detail?: RecipeDetail): RecipeDetailDraft {
	return {
		delivery: detail?.delivery.map(visualToDraft) ?? [],
		heroVisuals: detail?.heroVisuals.map(visualToDraft) ?? [],
		packaging: detail?.packaging.map(visualToDraft) ?? [],
		steps: detail?.steps.map(stepToDraft) ?? [],
		storeServing: detail?.storeServing.map(visualToDraft) ?? [],
	};
}

function createStepDraft(): RecipeStepDraft {
	return {
		details: [],
		id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		title: "",
		visuals: [],
	};
}

function RecipeStepEditor({
	index,
	onChange,
	onMove,
	onRemove,
	step,
	stepCount,
}: {
	index: number;
	onChange: (step: RecipeStepDraft) => void;
	onMove: (direction: -1 | 1) => void;
	onRemove: () => void;
	step: RecipeStepDraft;
	stepCount: number;
}) {
	return (
		<View style={styles.stepEditor}>
			<View style={styles.stepHeader}>
				<View style={styles.stepNumber}>
					<AppText.Xs bold color={AppColors.textOnPrimary}>
						{index + 1}
					</AppText.Xs>
				</View>
				<AppText.Base bold style={styles.stepHeaderTitle}>
					제조 순서 {index + 1}
				</AppText.Base>
				<View style={styles.stepActions}>
					<AppIcon.Sm
						accessibilityLabel={`제조 순서 ${index + 1} 위로 이동`}
						disabled={index === 0}
						name="chevron-up"
						onPress={() => onMove(-1)}
					/>
					<AppIcon.Sm
						accessibilityLabel={`제조 순서 ${index + 1} 아래로 이동`}
						disabled={index === stepCount - 1}
						name="chevron-down"
						onPress={() => onMove(1)}
					/>
					<AppIcon.Sm
						accessibilityLabel={`제조 순서 ${index + 1} 삭제`}
						color="#B91C1C"
						name="trash-outline"
						onPress={onRemove}
					/>
				</View>
			</View>

			<ManagementField
				label="제조 순서 제목"
				onChangeText={title => onChange({ ...step, title })}
				placeholder="예: 베이스 준비"
				value={step.title}
			/>

			<DynamicTextList
				addLabel="세부 내용 추가"
				itemLabel="세부 내용"
				multiline
				onChange={details => onChange({ ...step, details })}
				values={step.details}
			/>

			<View style={styles.visualArea}>
				<AppText.Sm bold color={AppColors.sub}>
					제조 순서 이미지
				</AppText.Sm>
				<VisualEditorList
					addLabel="제조 이미지 추가"
					onChange={visuals => onChange({ ...step, visuals })}
					visuals={step.visuals}
				/>
			</View>
		</View>
	);
}

export function RecipeEditorForm({ recipeId }: { recipeId?: string }) {
	const recipes = useSajangMenuContentStore(state => state.recipes);
	const recipeDetails = useSajangMenuContentStore(state => state.recipeDetails);
	const upsertRecipeBundle = useSajangMenuContentStore(state => state.upsertRecipeBundle);
	const showToast = useAppToastStore(state => state.showToast);
	const existingRecipe = useMemo(
		() => recipes.find(recipe => recipe.id === recipeId),
		[recipeId, recipes],
	);
	const existingDetail = existingRecipe ? recipeDetails[existingRecipe.id] : undefined;
	const [name, setName] = useState(existingRecipe?.name ?? "");
	const [category, setCategory] = useState<RecipeCategory>(existingRecipe?.category ?? "음료");
	const [subCategory, setSubCategory] = useState<RecipeSubCategory>(
		existingRecipe?.subCategory ?? beverageSubCategories[0],
	);
	const [detail, setDetail] = useState<RecipeDetailDraft>(() => detailToDraft(existingDetail));
	const [errorMessage, setErrorMessage] = useState("");
	const availableSubCategories = subCategoriesByCategory[category];

	const handleCategoryChange = (nextCategory: RecipeCategory) => {
		setCategory(nextCategory);
		const nextSubCategories = subCategoriesByCategory[nextCategory];

		if (!nextSubCategories.includes(subCategory)) {
			setSubCategory(nextSubCategories[0]);
		}
	};

	const updateStep = (index: number, nextStep: RecipeStepDraft) => {
		setDetail(current => ({
			...current,
			steps: current.steps.map((step, stepIndex) => (stepIndex === index ? nextStep : step)),
		}));
	};

	const moveStep = (index: number, direction: -1 | 1) => {
		setDetail(current => {
			const targetIndex = index + direction;

			if (targetIndex < 0 || targetIndex >= current.steps.length) {
				return current;
			}

			const steps = [...current.steps];
			[steps[index], steps[targetIndex]] = [steps[targetIndex], steps[index]];

			return { ...current, steps };
		});
	};

	const saveRecipe = async () => {
		const trimmedName = name.trim();

		if (!trimmedName) {
			setErrorMessage("메뉴명을 입력해 주세요.");
			return;
		}

		const now = new Date().toISOString();
		const id = existingRecipe?.id ?? `recipe-${Date.now()}`;
		const recipe: Recipe = {
			category,
			chosung: getChosung(trimmedName).replace(/\s/g, ""),
			createdAt: existingRecipe?.createdAt ?? now,
			id,
			name: trimmedName,
			subCategory,
			updatedAt: now,
		};
		const recipeDetail: RecipeDetail = {
			delivery: detail.delivery.map(draftToVisual),
			heroVisuals: detail.heroVisuals.map(draftToVisual),
			packaging: detail.packaging.map(draftToVisual),
			steps: detail.steps.map(step => ({
				details: step.details.map(item => item.trim()).filter(Boolean),
				id: step.id,
				title: step.title.trim() || "제조 순서",
				visuals: step.visuals.map(draftToVisual),
			})),
			storeServing: detail.storeServing.map(draftToVisual),
		};

		try {
			await upsertSupabaseRecipeBundleAsync({ detail: recipeDetail, recipe });
			upsertRecipeBundle({ detail: recipeDetail, recipe });
			setErrorMessage("");
			showToast("저장이 완료되었습니다.");
		} catch (error) {
			console.error("Failed to save recipe to Supabase.", error);
			setErrorMessage("Supabase 저장에 실패했습니다.");
		}
	};

	return (
		<View style={styles.container}>
			<ManagementSection title="메뉴 정보">
				<ManagementField
					label="메뉴명"
					onChangeText={setName}
					placeholder="예: HOT 아메리카노"
					value={name}
				/>
				<ManagementOptionSelector
					label="카테고리"
					onChange={handleCategoryChange}
					options={categoryOptions}
					value={category}
				/>
				<ManagementOptionSelector
					label="세부 카테고리"
					onChange={setSubCategory}
					options={availableSubCategories.map(value => ({ label: value, value }))}
					value={subCategory}
				/>
			</ManagementSection>

			<ManagementSection title="완성된 이미지">
				<VisualEditorList
					addLabel="완성 이미지 추가"
					onChange={heroVisuals => setDetail(current => ({ ...current, heroVisuals }))}
					visuals={detail.heroVisuals}
				/>
			</ManagementSection>

			<ManagementSection title="제조 순서">
				<View style={styles.stepList}>
					{detail.steps.map((step, index) => (
						<RecipeStepEditor
							key={step.id}
							index={index}
							onChange={nextStep => updateStep(index, nextStep)}
							onMove={direction => moveStep(index, direction)}
							onRemove={() =>
								setDetail(current => ({
									...current,
									steps: current.steps.filter((_, stepIndex) => stepIndex !== index),
								}))
							}
							step={step}
							stepCount={detail.steps.length}
						/>
					))}
					<ManagementActionButton
						icon="add-circle-outline"
						label="제조 순서 추가"
						onPress={() =>
							setDetail(current => ({
								...current,
								steps: [...current.steps, createStepDraft()],
							}))
						}
					/>
				</View>
			</ManagementSection>

			<ManagementSection title="매장으로 준비하기">
				<VisualEditorList
					onChange={storeServing => setDetail(current => ({ ...current, storeServing }))}
					visuals={detail.storeServing}
				/>
			</ManagementSection>

			<ManagementSection title="포장으로 준비하기">
				<VisualEditorList
					onChange={packaging => setDetail(current => ({ ...current, packaging }))}
					visuals={detail.packaging}
				/>
			</ManagementSection>

			<ManagementSection title="배달로 준비하기">
				<VisualEditorList
					onChange={delivery => setDetail(current => ({ ...current, delivery }))}
					visuals={detail.delivery}
				/>
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
					accessibilityLabel="메뉴 저장"
					onPress={saveRecipe}
					pressedColor="#003E7A"
					radius="base"
					style={styles.saveButton}
				>
					<AppIcon.Sm color={AppColors.textOnPrimary} name="save-outline" pressable={false} />
					<AppText.Base bold color={AppColors.textOnPrimary}>
						저장
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
	stepList: {
		width: "100%",
		gap: AppSpacing.md,
	},
	stepEditor: {
		width: "100%",
		gap: AppSpacing.md,
		borderWidth: 1,
		borderColor: "rgba(71, 85, 105, 0.22)",
		borderRadius: 4,
		padding: AppSpacing.md,
	},
	stepHeader: {
		minHeight: 40,
		flexDirection: "row",
		alignItems: "center",
		gap: AppSpacing.sm,
	},
	stepNumber: {
		width: 26,
		height: 26,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 999,
		backgroundColor: AppColors.primary,
	},
	stepHeaderTitle: {
		flex: 1,
		minWidth: 0,
	},
	stepActions: {
		flexDirection: "row",
	},
	visualArea: {
		width: "100%",
		gap: AppSpacing.sm,
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
});

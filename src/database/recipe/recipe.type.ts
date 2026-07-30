export const recipeTable = {
	name: "recipes",
	columns: {
		id: "id",
		name: "name",
		category: "category",
		subCategory: "sub_category",
		chosung: "chosung",
		createdAt: "created_at",
		updatedAt: "updated_at",
	},
} as const;

export type RecipeCategory = "음료" | "베이커리" | "이벤트";
export type RecipeSubCategory =
	| "카페인"
	| "디카페인"
	| "논커피"
	| "에이드/티"
	| "플랫치노"
	| "생과일"
	| "시즌 음료"
	| "베이글"
	| "브레드"
	| "케이크"
	| "디저트"
	| "시즌"
	| "세트"
	| "페어링";

export type Recipe = {
	category: RecipeCategory;
	chosung?: string;
	createdAt: string;
	id: string;
	name: string;
	subCategory: RecipeSubCategory;
	updatedAt: string;
};

export const recipeSchema = {
	table: recipeTable,
	createTableSql: `
CREATE TABLE IF NOT EXISTS ${recipeTable.name} (
  ${recipeTable.columns.id} TEXT PRIMARY KEY NOT NULL,
  ${recipeTable.columns.name} TEXT NOT NULL,
  ${recipeTable.columns.category} TEXT NOT NULL,
  ${recipeTable.columns.subCategory} TEXT NOT NULL,
  ${recipeTable.columns.chosung} TEXT,
  ${recipeTable.columns.createdAt} TEXT NOT NULL,
  ${recipeTable.columns.updatedAt} TEXT NOT NULL
);
`.trim(),
} as const;

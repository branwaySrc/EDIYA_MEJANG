import type { RecipeSubCategory } from "@/database/recipe/recipe.type";
export type { Recipe, RecipeCategory, RecipeSubCategory } from "@/database/recipe/recipe.type";


export const beverageSubCategories: RecipeSubCategory[] = ["카페인", "디카페인", "논커피", "에이드/티", "플랫치노", "생과일", "시즌 음료"];
export const bakerySubCategories: RecipeSubCategory[] = ["베이글", "브레드", "케이크", "디저트"];
export const eventSubCategories: RecipeSubCategory[] = ["시즌", "세트", "페어링"];
